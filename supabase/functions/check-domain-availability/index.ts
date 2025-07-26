import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

// Domain pricing in Iranian Rials
const DOMAIN_PRICING = {
  '.ir': 0, // Free for 1 year
  '.com': 450000, // ~$12
  '.net': 520000, // ~$14
  '.org': 480000, // ~$13
  '.info': 380000, // ~$10
  '.biz': 420000, // ~$11
  '.co': 950000, // ~$25
  '.io': 1850000, // ~$50
  '.me': 750000, // ~$20
  '.cc': 580000, // ~$15
}

const DOMAIN_DESCRIPTIONS = {
  '.ir': 'دامنه ایرانی - یک سال رایگان',
  '.com': 'محبوب‌ترین پسوند جهانی',
  '.net': 'مناسب برای شبکه‌ها و فناوری',
  '.org': 'مناسب برای سازمان‌ها',
  '.info': 'مناسب برای وب‌سایت‌های اطلاعاتی',
  '.biz': 'مناسب برای کسب‌وکار',
  '.co': 'کوتاه و قدرتمند',
  '.io': 'محبوب در میان استارتاپ‌ها',
  '.me': 'مناسب برای وب‌سایت‌های شخصی',
  '.cc': 'کوتاه و منحصربه‌فرد',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { domain, extension = '.ir' } = await req.json()
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Checking availability for domain: ${domain}${extension}`)

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/
    if (!domainRegex.test(domain)) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: 'Invalid domain format',
          message: 'نام دامنه نامعتبر است',
          price: DOMAIN_PRICING[extension] || 0,
          description: DOMAIN_DESCRIPTIONS[extension] || ''
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const fullDomain = `${domain}${extension}`
    let isAvailable = false
    let message = ''
    let note = ''

    try {
      // Check domain availability based on extension
      if (extension === '.ir') {
        // For .ir domains, use Iran's NIC.ir whois service
        const whoisResponse = await fetch(`https://whois.nic.ir/whois/${fullDomain}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Domain Checker Bot 1.0'
          }
        })

        const whoisText = await whoisResponse.text()
        console.log(`Whois response for ${fullDomain}:`, whoisText.substring(0, 200))

        isAvailable = whoisText.includes('No Object Found') || 
                     whoisText.includes('Not found') ||
                     whoisText.includes('No matching record') ||
                     !whoisText.includes('domain:')
      } else {
        // For other extensions, use a generic whois check or external API
        // Note: In production, you'd want to use proper domain availability APIs
        const whoisResponse = await fetch(`https://whois.net/whois/${fullDomain}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Domain Checker Bot 1.0'
          }
        })

        const whoisText = await whoisResponse.text()
        console.log(`Whois response for ${fullDomain}:`, whoisText.substring(0, 200))

        // Generic patterns for availability checking
        isAvailable = whoisText.includes('No match') || 
                     whoisText.includes('Not found') ||
                     whoisText.includes('No matching record') ||
                     whoisText.includes('No Data Found') ||
                     whoisText.toLowerCase().includes('available')
      }

      message = isAvailable ? 'دامنه در دسترس است' : 'دامنه در دسترس نیست'

    } catch (whoisError) {
      console.error('Whois check failed:', whoisError)
      
      // Fallback: Check against our database
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .like('description', `%"domain":"${domain}"%`)
        .like('description', `%"extension":"${extension}"%`)
        .limit(1)

      const isInOurDatabase = existingOrders && existingOrders.length > 0
      isAvailable = !isInOurDatabase
      message = isInOurDatabase ? 'دامنه قبلاً سفارش داده شده' : 'وضعیت دامنه نامشخص - لطفاً با پشتیبانی تماس بگیرید'
      note = 'Unable to verify with registry, checked against our database only'
    }

    return new Response(
      JSON.stringify({ 
        available: isAvailable,
        domain: fullDomain,
        extension: extension,
        price: DOMAIN_PRICING[extension] || 0,
        description: DOMAIN_DESCRIPTIONS[extension] || '',
        message: message,
        note: note,
        checkedAt: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

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