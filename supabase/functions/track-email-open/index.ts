import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        new Uint8Array([
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
          0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
          0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
          0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
          0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
          0x01, 0x00, 0x3B,
        ]),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const headers = {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
    };

    const recipientResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_campaign_recipients?tracking_token=eq.${token}&select=*&limit=1`,
      { headers }
    );

    const recipients = await recipientResponse.json();

    if (recipients && recipients.length > 0) {
      const recipient = recipients[0];

      const updateData: any = {
        open_count: (recipient.open_count || 0) + 1,
      };

      if (!recipient.opened_at) {
        updateData.opened_at = new Date().toISOString();
        updateData.status = "opened";
      }

      await fetch(
        `${supabaseUrl}/rest/v1/email_campaign_recipients?id=eq.${recipient.id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(updateData),
        }
      );

      const campaignResponse = await fetch(
        `${supabaseUrl}/rest/v1/email_campaigns?id=eq.${recipient.campaign_id}&select=*&limit=1`,
        { headers }
      );

      const campaigns = await campaignResponse.json();
      if (campaigns && campaigns.length > 0) {
        const campaign = campaigns[0];

        await fetch(
          `${supabaseUrl}/rest/v1/email_campaigns?id=eq.${campaign.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              opened_count: (campaign.opened_count || 0) + 1,
            }),
          }
        );
      }
    }

    return new Response(
      new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
        0x01, 0x00, 0x3B,
      ]),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );

  } catch (error) {
    console.error("Error tracking email open:", error);

    return new Response(
      new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
        0x01, 0x00, 0x3B,
      ]),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
});