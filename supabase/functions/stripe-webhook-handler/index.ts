import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function getStripeSettings() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('stripe_settings')
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new Error('Stripe settings not configured');
  }

  return {
    secretKey: data.secret_key,
    webhookSecret: data.webhook_secret || '',
  };
}

async function logWebhook(eventId: string, eventType: string, payload: any, processed: boolean, errorMessage: string = '') {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  await supabase
    .from('stripe_webhooks')
    .insert({
      event_id: eventId,
      event_type: eventType,
      payload: payload,
      processed: processed,
      error_message: errorMessage,
    });
}

async function processPaymentIntentSucceeded(paymentIntent: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const invoiceId = paymentIntent.metadata?.invoice_id;
  if (!invoiceId) {
    throw new Error('No invoice_id in payment intent metadata');
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  const amountPaid = paymentIntent.amount / 100;
  const previousBalance = invoice.balance;

  const { data: paymentResult, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      amount: amountPaid,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Stripe',
      payment_processor: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.charges?.data[0]?.id || '',
      reference: paymentIntent.id,
      notes: `Stripe payment - Payment Intent ID: ${paymentIntent.id}`,
      payment_metadata: {
        payment_intent_id: paymentIntent.id,
        charge_id: paymentIntent.charges?.data[0]?.id || '',
        status: paymentIntent.status,
        receipt_url: paymentIntent.charges?.data[0]?.receipt_url || '',
      },
    })
    .select()
    .single();

  if (paymentError || !paymentResult) {
    console.error('Payment insert error:', paymentError);
    throw new Error('Failed to record payment');
  }

  const newBalance = invoice.balance - amountPaid;
  const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      balance: newBalance,
      status: newStatus,
    })
    .eq('id', invoiceId);

  if (updateError) {
    console.error('Invoice update error:', updateError);
    throw new Error('Failed to update invoice');
  }

  const { data: receiptNumber } = await supabase.rpc('generate_receipt_number');

  const { error: receiptError } = await supabase
    .from('receipts')
    .insert({
      receipt_number: receiptNumber,
      customer_id: invoice.customer_id,
      payment_id: paymentResult.id,
      invoice_id: invoice.id,
      order_id: invoice.order_id,
      amount_paid: amountPaid,
      payment_method: 'Stripe',
      payment_reference: paymentIntent.id,
      invoice_total: invoice.total_amount,
      previous_balance: previousBalance,
      remaining_balance: newBalance,
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Stripe payment - Payment Intent ID: ${paymentIntent.id}`,
      status: 'generated',
    });

  if (receiptError) {
    console.error('Receipt creation error:', receiptError);
  }

  return { success: true, balance: newBalance, status: newStatus };
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

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    if (stripeSettings.webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          stripeSettings.webhookSecret
        );
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log('Received Stripe webhook event:', event.type);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await processPaymentIntentSucceeded(paymentIntent);
          await logWebhook(event.id, event.type, event, true);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error('Payment failed:', paymentIntent.last_payment_error?.message);
          await logWebhook(event.id, event.type, event, true);
          break;
        }

        case 'charge.succeeded':
        case 'charge.failed':
        case 'charge.refunded': {
          await logWebhook(event.id, event.type, event, true);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
          await logWebhook(event.id, event.type, event, false, 'Unhandled event type');
      }

      return new Response(
        JSON.stringify({ received: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error('Error processing webhook:', error);
      await logWebhook(event.id, event.type, event, false, error.message);
      
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});