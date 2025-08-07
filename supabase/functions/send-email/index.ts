// Supabase Edge Function for sending emails using built-in SMTP
// This function leverages Supabase's native email capabilities

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
  templateType?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: unknown;
}

// Supabase client for logging
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/**
 * Process email request
 * Since Supabase Edge Functions cannot send custom emails via SMTP,
 * we'll log the request and provide guidance
 */
async function processEmailRequest(emailData: EmailRequest): Promise<EmailResponse> {
  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For authentication-related emails, we can trigger Supabase's built-in email sending
    if (emailData.templateType === 'password_reset' || emailData.templateType === 'email_verification') {
      // Use Supabase's built-in password reset which will use the configured SMTP
      const { data, error } = await supabase.auth.resetPasswordForEmail(emailData.to, {
        redirectTo: `${supabaseUrl}/auth/callback`
      });

      if (error) {
        console.error('Supabase auth error:', error);
        return {
          success: false,
          message: 'خطا در ارسال ایمیل بازنشانی رمز عبور',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'ایمیل بازنشانی رمز عبور با موفقیت ارسال شد',
        data: data
      };
    }

    // For other email types, we'll log the request but indicate that custom SMTP sending
    // is not available in Supabase Edge Functions
    return {
      success: false,
      message: 'ارسال ایمیل سفارشی از طریق SMTP در Supabase Edge Functions پشتیبانی نمی‌شود. لطفاً از قالب‌های ایمیل Supabase یا سرویس‌های شخص ثالث استفاده کنید.',
      error: 'Custom SMTP email sending not supported in Supabase Edge Functions',
      data: {
        emailData,
        recommendation: 'Use Supabase Auth email templates or third-party email services for custom emails'
      }
    };
    
  } catch (error) {
    console.error('Email processing error:', error);
    return {
      success: false,
      message: 'خطا در پردازش درخواست ایمیل',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate email request
 */
function validateEmailRequest(request: EmailRequest): { valid: boolean; error?: string } {
  if (!request.to) {
    return { valid: false, error: 'آدرس ایمیل گیرنده الزامی است' };
  }

  if (!request.subject) {
    return { valid: false, error: 'موضوع ایمیل الزامی است' };
  }

  if (!request.html && !request.text) {
    return { valid: false, error: 'محتوای ایمیل الزامی است' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.to)) {
    return { valid: false, error: 'آدرس ایمیل نامعتبر است' };
  }

  return { valid: true };
}

/**
 * Log email activity to database (if email_logs table exists)
 */
async function logEmailActivity(emailData: EmailRequest, result: EmailResponse) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to log to email_logs table if it exists
    const { error } = await supabase
      .from('email_logs')
      .insert({
        to_email: emailData.to,
        subject: emailData.subject,
        success: result.success,
        error_message: result.error || null,
        sent_at: new Date().toISOString(),
        service_used: 'supabase_smtp',
        template_type: emailData.templateType || 'custom'
      });

    if (error) {
      console.warn('Failed to log email activity:', error);
    }
  } catch (error) {
    console.warn('Email logging failed:', error);
  }
}

/**
 * Main serve function
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const emailData: EmailRequest = await req.json();

    // Validate request
    const validation = validateEmailRequest(emailData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: validation.error
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process email request
    const result = await processEmailRequest(emailData);

    // Log email activity
    await logEmailActivity(emailData, result);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'خطا در پردازش درخواست',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}) 