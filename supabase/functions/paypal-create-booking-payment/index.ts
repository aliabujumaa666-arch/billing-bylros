import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateOrderRequest {
  booking_id: string;
  amount: number;
}

function convertAEDtoUSD(aedAmount: number): number {
  const AED_TO_USD_RATE = 0.27;
  return parseFloat((aedAmount * AED_TO_USD_RATE).toFixed(2));
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

    const { booking_id, amount }: CreateOrderRequest = await req.json();

    if (!booking_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid booking_id or amount" }),
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

    const usdAmount = convertAEDtoUSD(amount);

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: booking_id,
          amount: {
            currency_code: "USD",
            value: usdAmount.toFixed(2),
          },
          description: `Site Visit Booking - ${booking_id.slice(0, 8)} (AED ${amount.toFixed(2)})`,
        },
      ],
      application_context: {
        return_url: `${req.headers.get("origin") || "http://localhost:5173"}/booking-success`,
        cancel_url: `${req.headers.get("origin") || "http://localhost:5173"}/booking-cancel`,
        brand_name: "BYLROS Platform",
        user_action: "PAY_NOW",
      },
    };

    const orderResponse = await fetch(`${paypalSettings.apiUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.text();
      console.error("PayPal order creation failed:", errorData);
      throw new Error("Failed to create PayPal order");
    }

    const orderData = await orderResponse.json();

    return new Response(
      JSON.stringify({
        order_id: orderData.id,
        status: orderData.status,
        links: orderData.links,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});