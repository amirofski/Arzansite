import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ZarinPal SDK implementation following official patterns
class ZarinPalSDK {
  private merchantId: string;
  private isSandbox: boolean;
  private baseUrl: string;

  constructor(merchantId: string, isSandbox = false) {
    this.merchantId = merchantId;
    this.isSandbox = isSandbox;
    this.baseUrl = isSandbox 
      ? "https://sandbox.zarinpal.com"
      : "https://api.zarinpal.com";
  }

  get payments() {
    return new Payments(this);
  }

  get verifications() {
    return new Verifications(this);
  }

  async makeRequest(endpoint: string, data: any) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making request to: ${url}`, data);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        ...data
      }),
    });

    const result = await response.json();
    console.log(`Response from ${endpoint}:`, result);
    return result;
  }

  getRedirectUrl(authority: string): string {
    const baseUrl = this.isSandbox 
      ? "https://sandbox.zarinpal.com/pg/StartPay"
      : "https://www.zarinpal.com/pg/StartPay";
    return `${baseUrl}/${authority}`;
  }
}

class Payments {
  private zarinpal: ZarinPalSDK;
  private endpoint = "/pg/v4/payment/request.json";

  constructor(zarinpal: ZarinPalSDK) {
    this.zarinpal = zarinpal;
  }

  async create(data: {
    amount: number;
    callback_url: string;
    description: string;
    mobile?: string;
    email?: string;
    metadata?: any;
  }) {
    // Validate amount (minimum 1000 Tomans)
    if (data.amount < 1000) {
      throw new Error("Amount must be at least 1000 Tomans");
    }

    const result = await this.zarinpal.makeRequest(this.endpoint, {
      amount: data.amount,
      callback_url: data.callback_url,
      description: data.description,
      mobile: data.mobile,
      email: data.email,
      metadata: data.metadata || {}
    });

    if (result.data && result.data.code === 100) {
      return {
        success: true,
        authority: result.data.authority,
        payment_url: this.zarinpal.getRedirectUrl(result.data.authority),
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.errors?.message || "Payment request failed",
        code: result.data?.code,
        errors: result.errors
      };
    }
  }

  getRedirectUrl(authority: string): string {
    return this.zarinpal.getRedirectUrl(authority);
  }
}

class Verifications {
  private zarinpal: ZarinPalSDK;
  private endpoint = "/pg/v4/payment/verify.json";

  constructor(zarinpal: ZarinPalSDK) {
    this.zarinpal = zarinpal;
  }

  async verify(data: {
    amount: number;
    authority: string;
  }) {
    const result = await this.zarinpal.makeRequest(this.endpoint, {
      amount: data.amount,
      authority: data.authority
    });

    if (result.data && result.data.code === 100) {
      return {
        success: true,
        ref_id: result.data.ref_id,
        card_hash: result.data.card_hash,
        card_pan: result.data.card_pan,
        fee_type: result.data.fee_type,
        fee: result.data.fee,
        data: result.data
      };
    } else {
      return {
        success: false,
        error: result.errors?.message || "Payment verification failed",
        code: result.data?.code,
        errors: result.errors
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
      throw new Error("Invalid action. Use 'request' or 'verify'");
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

  // Initialize ZarinPal SDK (using sandbox for testing)
  const zarinpal = new ZarinPalSDK(merchantId, true);
  
  const callbackUrl = `${req.headers.get("origin")}/payment-callback?order_id=${orderId}`;

  // Create payment request using SDK
  const result = await zarinpal.payments.create({
    amount: amount,
    description: description,
    callback_url: callbackUrl,
    email: user.email || undefined,
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
    throw new Error(`Payment request failed: ${result.error} (Code: ${result.code})`);
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

  // Initialize ZarinPal SDK (using sandbox for testing)
  const zarinpal = new ZarinPalSDK(merchantId, true);

  // Verify payment using SDK
  const result = await zarinpal.verifications.verify({
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
        fee: result.fee,
        feeType: result.fee_type,
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