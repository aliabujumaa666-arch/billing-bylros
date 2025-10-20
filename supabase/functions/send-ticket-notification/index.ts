import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { type, ticket, customerEmail, adminEmail } = await req.json();

    if (!ticket || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailPayloads: EmailPayload[] = [];

    if (type === "new_ticket") {
      emailPayloads.push({
        to: customerEmail,
        subject: `Support Ticket #${ticket.id} Created`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #bb2738, #a01f2f); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">Support Ticket Created</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Hello,</p>
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Your support ticket has been created successfully. Our team will review it shortly.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Ticket ID:</strong> #${ticket.id}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Priority:</strong> ${ticket.priority}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>Status:</strong> ${ticket.status}</p>
              </div>
              
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">We'll send you an email when there's an update on your ticket.</p>
              <p style="color: #64748b; font-size: 14px;">Best regards,<br>BYLROS Support Team</p>
            </div>
          </div>
        `,
      });

      if (adminEmail) {
        emailPayloads.push({
          to: adminEmail,
          subject: `New Support Ticket #${ticket.id} - ${ticket.priority} Priority`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #bb2738, #a01f2f); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">New Support Ticket</h1>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">A new support ticket has been submitted.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Ticket ID:</strong> #${ticket.id}</p>
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Priority:</strong> ${ticket.priority}</p>
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Status:</strong> ${ticket.status}</p>
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Customer:</strong> ${customerEmail}</p>
                  <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>Category:</strong> ${ticket.category || 'General'}</p>
                </div>
                
                <p style="color: #334155; font-size: 16px; margin-bottom: 20px;"><strong>Message:</strong></p>
                <div style="background: #f1f5f9; padding: 15px; border-left: 4px solid #bb2738; border-radius: 4px;">
                  <p style="color: #334155; font-size: 14px; margin: 0;">${ticket.message}</p>
                </div>
              </div>
            </div>
          `,
        });
      }
    } else if (type === "ticket_reply") {
      emailPayloads.push({
        to: customerEmail,
        subject: `New Reply on Ticket #${ticket.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #bb2738, #a01f2f); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">New Reply Received</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Hello,</p>
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">You have received a new reply on your support ticket #${ticket.id}.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>Status:</strong> ${ticket.status}</p>
              </div>
              
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Please log in to your customer portal to view the full conversation.</p>
              <p style="color: #64748b; font-size: 14px;">Best regards,<br>BYLROS Support Team</p>
            </div>
          </div>
        `,
      });
    } else if (type === "ticket_status_update") {
      emailPayloads.push({
        to: customerEmail,
        subject: `Ticket #${ticket.id} Status Updated to ${ticket.status}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #bb2738, #a01f2f); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0;">Ticket Status Updated</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Hello,</p>
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">The status of your support ticket has been updated.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Ticket ID:</strong> #${ticket.id}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>New Status:</strong> ${ticket.status}</p>
              </div>
              
              <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">Please log in to your customer portal for more details.</p>
              <p style="color: #64748b; font-size: 14px;">Best regards,<br>BYLROS Support Team</p>
            </div>
          </div>
        `,
      });
    }

    console.log(`Prepared ${emailPayloads.length} email notification(s) for ticket #${ticket.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${emailPayloads.length} email notification(s) prepared`,
        emailsCount: emailPayloads.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
