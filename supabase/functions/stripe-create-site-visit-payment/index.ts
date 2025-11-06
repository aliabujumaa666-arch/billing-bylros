import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreatePaymentIntentRequest {
  site_visit_id: string;
  amount: number;
  currency?: string;
}

function convertAEDtoCents(aedAmount: number, currency: string): number {
  if (currency === "AED") {
    return Math.round(aedAmount * 100);
  }
  return Math.round(aedAmount * 100);
}

async function getStripeSettings() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('stripe_settings')
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new Error('Stripe settings not configured');
  }

  if (!data.is_active) {
    throw new Error('Stripe payments are currently disabled');
  }

  if (!data.secret_key) {
    throw new Error('Stripe credentials not configured');
  }

  return {
    secretKey: data.secret_key,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSettings = await getStripeSettings();
    const stripe = new Stripe(stripeSettings.secretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const { site_visit_id, amount, currency = "AED" }: CreatePaymentIntentRequest = await req.json();

    if (!site_visit_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid site_visit_id or amount" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: siteVisit, error: siteVisitError } = await supabase
      .from('site_visits')
      .select('*, customers(name, email)')
      .eq('id', site_visit_id)
      .maybeSingle();

    if (siteVisitError || !siteVisit) {
      return new Response(
        JSON.stringify({ error: "Site visit not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const amountInCents = convertAEDtoCents(amount, currency);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        site_visit_id: site_visit_id,
        customer_name: siteVisit.customers?.name || 'Unknown',
        visit_location: siteVisit.location,
      },
      description: `Site Visit Payment - ${siteVisit.location}`,
      receipt_email: siteVisit.customers?.email || undefined,
    });

    await supabase
      .from('site_visits')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', site_visit_id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Stripe payment intent:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});