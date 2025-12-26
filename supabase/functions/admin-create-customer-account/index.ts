import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateAccountRequest {
  customer_id: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { customer_id, email }: CreateAccountRequest = await req.json();

    if (!customer_id || !email) {
      return new Response(
        JSON.stringify({ error: "customer_id and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id, email")
      .eq("id", customer_id)
      .maybeSingle();

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: "Customer not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: existingUser } = await supabaseAdmin
      .from("customer_users")
      .select("id, customer_id, email")
      .eq("customer_id", customer_id)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: true,
          user_id: existingUser.id,
          email: existingUser.email,
          message: "Account already exists",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tempPassword = crypto.randomUUID();

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        customer_id: customer_id,
      },
    });

    if (authError || !authUser.user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create auth user: " + authError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: customerUserError } = await supabaseAdmin
      .from("customer_users")
      .insert({
        id: authUser.user.id,
        customer_id: customer_id,
        email: normalizedEmail,
      });

    if (customerUserError) {
      console.error("Customer user insert error:", customerUserError);
      
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return new Response(
        JSON.stringify({ error: "Failed to create customer user record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        email: normalizedEmail,
        message: "Customer portal account created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});