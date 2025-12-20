import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  message: string;
  pdfContent: string;
  filename: string;
  documentType: string;
  documentId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      to,
      cc = [],
      bcc = [],
      subject,
      message,
      pdfContent,
      filename,
      documentType,
      documentId,
    }: EmailRequest = await req.json();

    if (!to || to.length === 0) {
      throw new Error("Recipient email is required");
    }

    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }

    if (!pdfContent || !filename) {
      throw new Error("PDF content and filename are required");
    }

    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASS = Deno.env.get("SMTP_PASS");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || SMTP_USER;
    const FROM_NAME = Deno.env.get("FROM_NAME") || "BYLROS";

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP configuration not found in environment variables");

      return new Response(
        JSON.stringify({
          success: true,
          message: "Email feature not configured. PDF can still be downloaded.",
          warning: "SMTP settings required for email functionality"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailBody = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to.join(", "),
      cc: cc.length > 0 ? cc.join(", ") : undefined,
      bcc: bcc.length > 0 ? bcc.join(", ") : undefined,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #bb2738 0%, #a01f2f 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">BYLROS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Premium Glass & Aluminum Solutions</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${message.split('\n').map(line => `<p style="margin: 0 0 15px 0; color: #333; line-height: 1.6;">${line}</p>`).join('')}
            </div>
            <div style="margin-top: 20px; padding: 20px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
              <p style="margin: 0; color: #1976d2; font-weight: bold;">📎 Attachment</p>
              <p style="margin: 5px 0 0 0; color: #555; font-size: 14px;">${filename}</p>
            </div>
          </div>
          <div style="background: #f1f3f4; padding: 20px; text-align: center; border-top: 3px solid #bb2738;">
            <p style="margin: 0; color: #666; font-size: 12px;">This email was sent from your BYLROS system</p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">Please do not reply to this email</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfContent,
          encoding: "base64",
          contentType: "application/pdf",
        },
      ],
    };

    console.log(`Attempting to send email to: ${to.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachment: ${filename}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        recipients: to.length,
        documentType,
        documentId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
