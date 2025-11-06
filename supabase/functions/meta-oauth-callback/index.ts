import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const metaAppId = url.searchParams.get('app_id');
    const metaAppSecret = url.searchParams.get('app_secret');
    const redirectUri = url.searchParams.get('redirect_uri');

    if (!code || !metaAppId || !metaAppSecret || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaAppSecret}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: 'Failed to exchange code for token', details: tokenData }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const accessToken = tokenData.access_token;

    const businessAccountsUrl = `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`;
    const businessResponse = await fetch(businessAccountsUrl);
    const businessData = await businessResponse.json();

    if (!businessResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch business accounts', details: businessData }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let whatsappPhoneNumbers = [];

    if (businessData.data && businessData.data.length > 0) {
      const businessId = businessData.data[0].id;
      
      const wabaUrl = `https://graph.facebook.com/v18.0/${businessId}/owned_whatsapp_business_accounts?access_token=${accessToken}`;
      const wabaResponse = await fetch(wabaUrl);
      const wabaData = await wabaResponse.json();

      if (wabaResponse.ok && wabaData.data && wabaData.data.length > 0) {
        const wabaId = wabaData.data[0].id;
        
        const phonesUrl = `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`;
        const phonesResponse = await fetch(phonesUrl);
        const phonesData = await phonesResponse.json();

        if (phonesResponse.ok && phonesData.data) {
          whatsappPhoneNumbers = phonesData.data;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: accessToken,
        expires_in: tokenData.expires_in,
        phone_numbers: whatsappPhoneNumbers,
        business_accounts: businessData.data || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});