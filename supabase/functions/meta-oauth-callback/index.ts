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

    console.log('Received OAuth callback:', { code: !!code, metaAppId, redirectUri });

    if (!code || !metaAppId || !metaAppSecret || !redirectUri) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters',
          details: {
            hasCode: !!code,
            hasAppId: !!metaAppId,
            hasAppSecret: !!metaAppSecret,
            hasRedirectUri: !!redirectUri
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Step 1: Exchanging code for access token...');
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaAppSecret}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to exchange code for token',
          details: tokenData,
          step: 'token_exchange'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('Step 2: Access token obtained successfully');

    console.log('Step 3: Fetching user business accounts...');
    const businessAccountsUrl = `https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${accessToken}`;
    const businessResponse = await fetch(businessAccountsUrl);
    const businessData = await businessResponse.json();

    console.log('Business response status:', businessResponse.status);

    if (!businessResponse.ok) {
      console.error('Business accounts fetch failed:', businessData);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch business accounts',
          details: businessData,
          step: 'business_accounts',
          hint: 'Make sure your app has business_management permission'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let whatsappPhoneNumbers = [];
    let debugInfo = {
      businessCount: 0,
      wabaCount: 0,
      phoneCount: 0
    };

    if (businessData.data && businessData.data.length > 0) {
      debugInfo.businessCount = businessData.data.length;
      console.log(`Found ${businessData.data.length} business account(s)`);

      for (const business of businessData.data) {
        const businessId = business.id;
        console.log(`Step 4: Fetching WhatsApp Business Accounts for business ${businessId}...`);

        const wabaUrl = `https://graph.facebook.com/v21.0/${businessId}/owned_whatsapp_business_accounts?fields=id,name&access_token=${accessToken}`;
        const wabaResponse = await fetch(wabaUrl);
        const wabaData = await wabaResponse.json();

        console.log(`WABA response status for business ${businessId}:`, wabaResponse.status);

        if (wabaResponse.ok && wabaData.data && wabaData.data.length > 0) {
          debugInfo.wabaCount += wabaData.data.length;
          console.log(`Found ${wabaData.data.length} WABA(s) for business ${businessId}`);

          for (const waba of wabaData.data) {
            const wabaId = waba.id;
            console.log(`Step 5: Fetching phone numbers for WABA ${wabaId}...`);

            const phonesUrl = `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status&access_token=${accessToken}`;
            const phonesResponse = await fetch(phonesUrl);
            const phonesData = await phonesResponse.json();

            console.log(`Phones response status for WABA ${wabaId}:`, phonesResponse.status);

            if (phonesResponse.ok && phonesData.data) {
              debugInfo.phoneCount += phonesData.data.length;
              console.log(`Found ${phonesData.data.length} phone number(s) for WABA ${wabaId}`);
              whatsappPhoneNumbers = whatsappPhoneNumbers.concat(phonesData.data);
            } else {
              console.error(`Failed to fetch phones for WABA ${wabaId}:`, phonesData);
            }
          }
        } else {
          console.log(`No WABAs found for business ${businessId}`, wabaData);
        }
      }
    } else {
      console.log('No business accounts found');
    }

    console.log('Final results:', {
      totalPhones: whatsappPhoneNumbers.length,
      debugInfo
    });

    return new Response(
      JSON.stringify({
        success: true,
        access_token: accessToken,
        expires_in: tokenData.expires_in,
        phone_numbers: whatsappPhoneNumbers,
        business_accounts: businessData.data || [],
        debug_info: debugInfo
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        stack: error.stack,
        step: 'exception'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
