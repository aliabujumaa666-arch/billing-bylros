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
  site_visit_id: string;
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

  if (!data.is_active) {
    throw new Error('PayPal payments are currently disabled');
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const paypalSettings = await getPayPalSettings();

    const { order_id, site_visit_id }: CapturePaymentRequest = await req.json();

    if (!order_id || !site_visit_id) {
      return new Response(
        JSON.stringify({ error: "Invalid order_id or site_visit_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getPayPalAccessToken(
      paypalSettings.clientId,
      paypalSettings.clientSecret,
      paypalSettings.apiUrl
    );

    const captureResponse = await fetch(
      `${paypalSettings.apiUrl}/v2/checkout/orders/${order_id}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.text();
      console.error("PayPal capture failed:", errorData);
      throw new Error("Failed to capture PayPal payment");
    }

    const captureData = await captureResponse.json();
    const transactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from('site_visits')
      .update({
        payment_status: 'Paid',
        payment_method: 'PayPal',
        paypal_transaction_id: transactionId,
        payment_date: new Date().toISOString(),
      })
      .eq('id', site_visit_id);

    if (updateError) {
      console.error("Failed to update site visit:", updateError);
      throw new Error("Failed to update payment status");
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        status: captureData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});