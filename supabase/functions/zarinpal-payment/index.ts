import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ZarinPal SDK functionality
class ZarinPal {
  private merchantId: string;
  private sandbox: boolean;

  constructor(merchantId: string, sandbox = false) {
    this.merchantId = merchantId;
    this.sandbox = sandbox;
  }

  private getApiUrl(endpoint: string): string {
    const baseUrl = this.sandbox 
      ? "https://sandbox.zarinpal.com/pg/v4/payment"
      : "https://api.zarinpal.com/pg/v4/payment";
    return `${baseUrl}/${endpoint}.json`;
  }

  private getPaymentUrl(authority: string): string {
    const baseUrl = this.sandbox 
      ? "https://sandbox.zarinpal.com/pg/StartPay"
      : "https://www.zarinpal.com/pg/StartPay";
    return `${baseUrl}/${authority}`;
  }

  async request(params: {
    amount: number;
    description: string;
    callback_url: string;
    metadata?: any;
  }) {
    const requestData = {
      merchant_id: this.merchantId,
      amount: params.amount,
      description: params.description,
      callback_url: params.callback_url,
      metadata: params.metadata || {}
    };

    console.log("ZarinPal payment request:", requestData);

    const response = await fetch(this.getApiUrl("request"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    console.log("ZarinPal payment response:", result);

    if (result.data && result.data.code === 100) {
      return {
        success: true,
        authority: result.data.authority,
        payment_url: this.getPaymentUrl(result.data.authority)
      };
    } else {
      return {
        success: false,
        error: result.errors?.message || "Payment request failed",
        code: result.data?.code
      };
    }
  }

  async verify(params: {
    amount: number;
    authority: string;
  }) {
    const verifyData = {
      merchant_id: this.merchantId,
      amount: params.amount,
      authority: params.authority
    };

    console.log("ZarinPal verify request:", verifyData);

    const response = await fetch(this.getApiUrl("verify"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(verifyData),
    });

    const result = await response.json();
    console.log("ZarinPal verify response:", result);

    if (result.data && result.data.code === 100) {
      return {
        success: true,
        ref_id: result.data.ref_id,
        card_hash: result.data.card_hash,
        card_pan: result.data.card_pan
      };
    } else {
      return {
        success: false,
        error: result.errors?.message || "Payment verification failed",
        code: result.data?.code
      };
    }
  }
}

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

  // Get merchant ID from environment
  const merchantId = Deno.env.get("ZARINPAL_MERCHANT_ID");
  if (!merchantId) {
    throw new Error("ZarinPal merchant ID not configured");
  }

  // Initialize ZarinPal (using sandbox for testing)
  const zarinpal = new ZarinPal(merchantId, true);
  
  const callbackUrl = `${req.headers.get("origin")}/payment-callback?order_id=${orderId}`;

  // Request payment
  const result = await zarinpal.request({
    amount: amount,
    description: description,
    callback_url: callbackUrl,
    metadata: {
      order_id: orderId,
      user_id: user.id
    }
  });

  if (result.success) {
    // Store payment info in Supabase
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("orders").update({
      zarinpal_authority: result.authority,
      payment_status: "pending"
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        authority: result.authority,
        paymentUrl: result.payment_url
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } else {
    throw new Error("Payment request failed: " + result.error);
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

  // Get merchant ID from environment
  const merchantId = Deno.env.get("ZARINPAL_MERCHANT_ID");
  if (!merchantId) {
    throw new Error("ZarinPal merchant ID not configured");
  }

  // Initialize ZarinPal (using sandbox for testing)
  const zarinpal = new ZarinPal(merchantId, true);

  // Verify payment
  const result = await zarinpal.verify({
    authority: authority,
    amount: Math.floor(order.price / 10) // Convert from Rials to Tomans
  });

  if (result.success) {
    // Payment successful - update order
    await supabaseService.from("orders").update({
      payment_status: "paid",
      status: "confirmed",
      zarinpal_ref_id: result.ref_id,
      updated_at: new Date().toISOString()
    }).eq("id", orderId);

    return new Response(
      JSON.stringify({
        success: true,
        refId: result.ref_id,
        cardHash: result.card_hash,
        cardPan: result.card_pan,
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
        error: result.error,
        code: result.code
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
}