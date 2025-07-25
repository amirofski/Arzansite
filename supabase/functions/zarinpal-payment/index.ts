import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    if (action === "request") {
      return await handlePaymentRequest(req, payload);
    } else if (action === "verify") {
      return await handlePaymentVerification(req, payload);
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

async function handlePaymentRequest(req: Request, payload: any) {
  const { amount, description, orderId } = payload;
  
  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Get authenticated user
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data } = await supabaseClient.auth.getUser(token);
  const user = data.user;
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Zarinpal merchant ID (should be set as environment variable)
  const merchantId = Deno.env.get("ZARINPAL_MERCHANT_ID") || "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
  
  const callbackUrl = `${req.headers.get("origin")}/payment-callback`;

  // Zarinpal payment request
  const zarinpalRequest = {
    merchant_id: merchantId,
    amount: amount, // Amount in Tomans
    description: description,
    callback_url: callbackUrl,
    metadata: {
      order_id: orderId,
      user_id: user.id
    }
  };

  // Call Zarinpal API
  const response = await fetch("https://api.zarinpal.com/pg/v4/payment/request.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(zarinpalRequest),
  });

  const result = await response.json();

  if (result.data && result.data.code === 100) {
    // Store payment info in Supabase
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("orders").update({
      zarinpal_authority: result.data.authority,
      payment_status: "pending"
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        authority: result.data.authority,
        paymentUrl: `https://www.zarinpal.com/pg/StartPay/${result.data.authority}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } else {
    throw new Error("Payment request failed: " + (result.errors?.message || "Unknown error"));
  }
}

async function handlePaymentVerification(req: Request, payload: any) {
  const { authority, orderId } = payload;
  
  // Create Supabase service client
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Get order details
  const { data: order, error: orderError } = await supabaseService
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found");
  }

  const merchantId = Deno.env.get("ZARINPAL_MERCHANT_ID") || "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";

  // Verify payment with Zarinpal
  const verificationRequest = {
    merchant_id: merchantId,
    authority: authority,
    amount: order.price / 10 // Convert from Rials to Tomans
  };

  const response = await fetch("https://api.zarinpal.com/pg/v4/payment/verify.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verificationRequest),
  });

  const result = await response.json();

  if (result.data && result.data.code === 100) {
    // Payment successful - update order
    await supabaseService.from("orders").update({
      payment_status: "paid",
      status: "confirmed",
      zarinpal_ref_id: result.data.ref_id,
      updated_at: new Date().toISOString()
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        refId: result.data.ref_id,
        message: "Payment verified successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } else {
    // Payment failed - update order
    await supabaseService.from("orders").update({
      payment_status: "failed",
      status: "cancelled",
      updated_at: new Date().toISOString()
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: false,
        error: result.errors?.message || "Payment verification failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
}