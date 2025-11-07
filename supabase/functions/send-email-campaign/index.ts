import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRecipient {
  id: string;
  email: string;
  customer_id: string;
  tracking_token: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { campaignId } = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Campaign ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
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

    const campaignResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_campaigns?id=eq.${campaignId}&select=*`,
      { headers }
    );

    const campaigns = await campaignResponse.json();
    if (!campaigns || campaigns.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const campaign = campaigns[0];

    const recipientsResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_campaign_recipients?campaign_id=eq.${campaignId}&status=eq.pending&select=*`,
      { headers }
    );

    const recipients: EmailRecipient[] = await recipientsResponse.json();

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending recipients to send to" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const smtpResponse = await fetch(
      `${supabaseUrl}/rest/v1/email_smtp_settings?is_active=eq.true&select=*&limit=1`,
      { headers }
    );

    const smtpSettings = await smtpResponse.json();
    if (!smtpSettings || smtpSettings.length === 0) {
      return new Response(
        JSON.stringify({ error: "SMTP settings not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const smtp = smtpSettings[0];

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?token=${recipient.tracking_token}`;

        const bodyWithTracking = campaign.body_html.replace(
          '</body>',
          `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" /></body>`
        );

        const emailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-notification-email`,
          {
            method: "POST",
            headers: {
              ...headers,
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: recipient.email,
              subject: campaign.subject,
              body_html: bodyWithTracking,
              from_name: campaign.from_name,
              from_email: campaign.from_email,
              reply_to: campaign.reply_to,
            }),
          }
        );

        if (emailResponse.ok) {
          await fetch(
            `${supabaseUrl}/rest/v1/email_campaign_recipients?id=eq.${recipient.id}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                status: "sent",
                sent_at: new Date().toISOString(),
              }),
            }
          );
          sentCount++;
        } else {
          await fetch(
            `${supabaseUrl}/rest/v1/email_campaign_recipients?id=eq.${recipient.id}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                status: "failed",
                bounce_reason: "Failed to send email",
              }),
            }
          );
          failedCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failedCount++;

        await fetch(
          `${supabaseUrl}/rest/v1/email_campaign_recipients?id=eq.${recipient.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              status: "failed",
              bounce_reason: error instanceof Error ? error.message : "Unknown error",
            }),
          }
        );
      }
    }

    await fetch(
      `${supabaseUrl}/rest/v1/email_campaigns?id=eq.${campaignId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_count: sentCount,
          delivered_count: sentCount,
        }),
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Campaign sent to ${sentCount} recipients`,
        sent: sentCount,
        failed: failedCount,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error sending campaign:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});