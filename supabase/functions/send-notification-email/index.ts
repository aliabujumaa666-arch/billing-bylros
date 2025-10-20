import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { templateName, customerEmail, customerId, data } = await req.json();

    if (!templateName || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get SMTP settings
    const { data: smtpSettings, error: smtpError } = await supabase
      .from("email_smtp_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (smtpError || !smtpSettings) {
      console.error("SMTP settings error:", smtpError);
      return new Response(
        JSON.stringify({ error: "SMTP settings not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", templateName)
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      console.error("Template error:", templateError);
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Replace template placeholders
    let subject = template.subject;
    let bodyHtml = template.body_html;

    Object.keys(data || {}).forEach(key => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), data[key]);
      bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    // Send email via SMTP
    try {
      const client = new SMTPClient({
        user: smtpSettings.smtp_username,
        password: smtpSettings.smtp_password,
        host: smtpSettings.smtp_host,
        port: smtpSettings.smtp_port,
        ssl: smtpSettings.use_ssl,
      });

      await client.sendAsync({
        from: `${smtpSettings.from_name} <${smtpSettings.from_email}>`,
        to: customerEmail,
        subject: subject,
        attachment: [
          { data: bodyHtml, alternative: true },
        ],
      });

      // Log successful send
      await supabase.from("notification_log").insert({
        customer_id: customerId || null,
        notification_type: "email",
        template_name: templateName,
        recipient: customerEmail,
        subject: subject,
        status: "sent",
        metadata: data || {},
        sent_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          subject,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      
      // Log failed send
      await supabase.from("notification_log").insert({
        customer_id: customerId || null,
        notification_type: "email",
        template_name: templateName,
        recipient: customerEmail,
        subject: subject,
        status: "failed",
        metadata: { ...data, error: emailError.message },
        sent_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ error: "Failed to send email: " + emailError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});