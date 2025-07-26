import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { domain } = await req.json()
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Checking availability for domain: ${domain}.ir`)

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/
    if (!domainRegex.test(domain)) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: 'Invalid domain format',
          message: 'نام دامنه نامعتبر است' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check domain availability using Iran's NIC.ir whois service
    // Note: This is a simplified implementation. In production, you would need proper API access
    try {
      const whoisResponse = await fetch(`https://whois.nic.ir/whois/${domain}.ir`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Domain Checker Bot 1.0'
        }
      })

      const whoisText = await whoisResponse.text()
      console.log(`Whois response for ${domain}.ir:`, whoisText.substring(0, 200))

      // Check if domain is available based on whois response
      const isAvailable = whoisText.includes('No Object Found') || 
                         whoisText.includes('Not found') ||
                         whoisText.includes('No matching record') ||
                         !whoisText.includes('domain:')

      return new Response(
        JSON.stringify({ 
          available: isAvailable,
          domain: `${domain}.ir`,
          message: isAvailable ? 'دامنه در دسترس است' : 'دامنه در دسترس نیست',
          checkedAt: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (whoisError) {
      console.error('Whois check failed:', whoisError)
      
      // Fallback: Check against our database to see if domain is already ordered
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .like('description', `%"domain":"${domain}"%`)
        .limit(1)

      const isInOurDatabase = existingOrders && existingOrders.length > 0

      return new Response(
        JSON.stringify({ 
          available: !isInOurDatabase,
          domain: `${domain}.ir`,
          message: isInOurDatabase ? 'دامنه قبلاً سفارش داده شده' : 'وضعیت دامنه نامشخص - لطفاً با پشتیبانی تماس بگیرید',
          note: 'Unable to verify with registry, checked against our database only',
          checkedAt: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Domain check error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check domain availability',
        message: 'خطا در بررسی وضعیت دامنه'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})