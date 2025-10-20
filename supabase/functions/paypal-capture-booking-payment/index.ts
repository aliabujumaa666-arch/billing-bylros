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
  booking_id: string;
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

async function processBookingPayment(captureData: any, bookingId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const purchaseUnit = captureData.purchase_units[0];
  const capture = purchaseUnit.payments.captures[0];

  const { error: updateError } = await supabase
    .from("public_site_visit_bookings")
    .update({
      status: "paid",
      paypal_order_id: captureData.id,
      paypal_transaction_id: capture.id,
      payment_date: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Booking update error:", updateError);
    throw new Error("Failed to update booking status");
  }

  return { success: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const paypalSettings = await getPayPalSettings();

    const { order_id, booking_id }: CapturePaymentRequest = await req.json();

    if (!order_id || !booking_id) {
      return new Response(
        JSON.stringify({ error: "order_id and booking_id are required" }),
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

    const result = await processBookingPayment(captureData, booking_id);

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