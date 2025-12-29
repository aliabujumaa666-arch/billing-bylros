import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  conversation_id: string;
  customer_id: string;
  context: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { conversation_id, customer_id, context } = body as RequestBody;

    if (!conversation_id || typeof conversation_id !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing conversation_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!customer_id || typeof customer_id !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or missing customer_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!context || typeof context !== 'string' || context.length > 10000) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid context (max 10000 characters)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: aiSettings, error: settingsError } = await supabase
      .from("whatsapp_ai_settings")
      .select("*")
      .maybeSingle();

    if (settingsError || !aiSettings) {
      return new Response(
        JSON.stringify({ success: false, error: "AI settings not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!aiSettings.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: "AI assistant is disabled" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let customerData = null;
    if (aiSettings.use_customer_history) {
      const { data } = await supabase
        .from("customers")
        .select("name, email, phone, status")
        .eq("id", customer_id)
        .maybeSingle();
      customerData = data;
    }

    let knowledgeBaseData = [];
    if (aiSettings.use_knowledge_base) {
      const { data } = await supabase
        .from("knowledge_base_articles")
        .select("title, content")
        .eq("is_published", true)
        .limit(5);
      knowledgeBaseData = data || [];
    }

    const systemPrompt = aiSettings.system_prompt || "You are a helpful customer service assistant.";
    const customerInfo = customerData
      ? `Customer Name: ${customerData.name}\nStatus: ${customerData.status}\n`
      : "";
    const kbContext = knowledgeBaseData.length > 0
      ? `Knowledge Base:\n${knowledgeBaseData.map((kb: any) => `- ${kb.title}: ${kb.content.substring(0, 200)}`).join("\n")}\n`
      : "";

    const fullPrompt = `${systemPrompt}\n\n${customerInfo}${kbContext}\nConversation Context:\n${context}\n\nProvide a helpful, ${aiSettings.response_tone} response to the customer's last message.`;

    let aiResponse = "";
    let confidenceScore = 0.85;

    if (aiSettings.ai_provider === "openai") {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiSettings.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiSettings.model_name,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: fullPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error("OpenAI API request failed");
      }

      const openaiData = await openaiResponse.json();
      aiResponse = openaiData.choices[0].message.content;
    } else if (aiSettings.ai_provider === "anthropic") {
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": aiSettings.api_key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiSettings.model_name,
          max_tokens: 500,
          messages: [
            { role: "user", content: fullPrompt },
          ],
          system: systemPrompt,
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error("Anthropic API request failed");
      }

      const anthropicData = await anthropicResponse.json();
      aiResponse = anthropicData.content[0].text;
    } else if (aiSettings.ai_provider === "google") {
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${aiSettings.model_name}:generateContent?key=${aiSettings.api_key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }],
            }],
          }),
        }
      );

      if (!googleResponse.ok) {
        throw new Error("Google API request failed");
      }

      const googleData = await googleResponse.json();
      aiResponse = googleData.candidates[0].content.parts[0].text;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Unsupported AI provider" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const checkForEscalation = (text: string, keywords: string[]): boolean => {
      const lowerText = text.toLowerCase();
      return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
    };

    const needsEscalation = checkForEscalation(
      context,
      aiSettings.escalation_keywords || []
    );

    return new Response(
      JSON.stringify({
        success: true,
        suggested_response: aiResponse,
        confidence_score: confidenceScore,
        needs_escalation: needsEscalation,
        requires_approval: aiSettings.require_approval,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
