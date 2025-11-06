import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CapturePaymentRequest {
  order_id: string;
  invoice_id: string;
}

interface WebhookEvent {
  event_type: string;
  resource_type: string;
  resource: any;
}

async function getPayPalSettings() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('paypal_settings')
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new Error('PayPal settings not configured');
  }

  if (!data.client_id || !data.client_secret) {
    throw new Error('PayPal credentials not configured');
  }

  const apiUrl = data.mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  return {
    clientId: data.client_id,
    clientSecret: data.client_secret,
    apiUrl,
  };
}

async function getPayPalAccessToken(clientId: string, clientSecret: string, apiUrl: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

async function capturePayPalOrder(orderId: string, apiUrl: string, clientId: string, clientSecret: string) {
  const accessToken = await getPayPalAccessToken(clientId, clientSecret, apiUrl);

  const response = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("PayPal capture failed:", errorData);
    throw new Error("Failed to capture PayPal payment");
  }

  return await response.json();
}

async function processPayPalPayment(captureData: any, invoiceId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const purchaseUnit = captureData.purchase_units[0];
  const capture = purchaseUnit.payments.captures[0];
  const amount = parseFloat(capture.amount.value);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    throw new Error("Invoice not found");
  }

  const previousBalance = invoice.balance;

  const { data: paymentResult, error: paymentError } = await supabase
    .from("payments")
    .insert({
      invoice_id: invoiceId,
      amount: amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "PayPal",
      payment_processor: "paypal",
      paypal_order_id: captureData.id,
      paypal_transaction_id: capture.id,
      reference: capture.id,
      notes: `PayPal payment - Order ID: ${captureData.id}`,
      payment_metadata: {
        payer_email: captureData.payer?.email_address,
        payer_name: captureData.payer?.name?.given_name + " " + captureData.payer?.name?.surname,
        status: capture.status,
      },
    })
    .select()
    .single();

  if (paymentError || !paymentResult) {
    console.error("Payment insert error:", paymentError);
    throw new Error("Failed to record payment");
  }

  const newBalance = invoice.balance - amount;
  const newStatus = newBalance <= 0 ? "Paid" : "Partial";

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      balance: newBalance,
      status: newStatus,
    })
    .eq("id", invoiceId);

  if (updateError) {
    console.error("Invoice update error:", updateError);
    throw new Error("Failed to update invoice");
  }

  const { data: receiptNumber } = await supabase.rpc('generate_receipt_number');

  const { error: receiptError } = await supabase
    .from("receipts")
    .insert({
      receipt_number: receiptNumber,
      customer_id: invoice.customer_id,
      payment_id: paymentResult.id,
      invoice_id: invoice.id,
      order_id: invoice.order_id,
      amount_paid: amount,
      payment_method: "PayPal",
      payment_reference: capture.id,
      invoice_total: invoice.total_amount,
      previous_balance: previousBalance,
      remaining_balance: newBalance,
      payment_date: new Date().toISOString().split('T')[0],
      notes: `PayPal payment - Order ID: ${captureData.id}`,
      status: 'generated',
    });

  if (receiptError) {
    console.error("Receipt creation error:", receiptError);
  }

  return { success: true, balance: newBalance, status: newStatus };
}

async function handleWebhook(event: WebhookEvent) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const eventId = event.resource?.id || crypto.randomUUID();

  const { error: webhookError } = await supabase
    .from("paypal_webhooks")
    .insert({
      event_id: eventId,
      event_type: event.event_type,
      resource_type: event.resource_type,
      payload: event,
      processed: false,
    });

  if (webhookError) {
    console.error("Webhook logging error:", webhookError);
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const captureId = event.resource.id;
    const customId = event.resource.custom_id;
    
    console.log("Payment captured via webhook:", captureId, "Custom ID:", customId);
    
    await supabase
      .from("paypal_webhooks")
      .update({ processed: true })
      .eq("event_id", eventId);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    
    if (url.pathname.includes("/webhook")) {
      const webhookEvent: WebhookEvent = await req.json();
      await handleWebhook(webhookEvent);
      
      return new Response(
        JSON.stringify({ received: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paypalSettings = await getPayPalSettings();

    const { order_id, invoice_id }: CapturePaymentRequest = await req.json();

    if (!order_id || !invoice_id) {
      return new Response(
        JSON.stringify({ error: "order_id and invoice_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const captureData = await capturePayPalOrder(
      order_id,
      paypalSettings.apiUrl,
      paypalSettings.clientId,
      paypalSettings.clientSecret
    );
    
    if (captureData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ error: "Payment not completed", status: captureData.status }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await processPayPalPayment(captureData, invoice_id);

    return new Response(
      JSON.stringify({
        success: true,
        capture_id: captureData.purchase_units[0].payments.captures[0].id,
        ...result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});