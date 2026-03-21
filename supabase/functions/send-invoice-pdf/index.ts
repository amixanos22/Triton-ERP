import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Ταυτοποίηση ενοικιαστή
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Λήψη ρυθμίσεων ενοικιαστή (Key & Email)
    const { data: profile } = await supabaseClient
      .from('profiles').select('resend_key, sender_email, company_name')
      .eq('id', user.id).single()

    const { to, invoiceHtml, invoiceNo, customerName } = await req.json()

    // Αποστολή μέσω Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${profile.resend_key}`,
      },
      body: JSON.stringify({
        from: `${profile.company_name} <${profile.sender_email}>`,
        to: [to],
        subject: `Παραστατικό ${invoiceNo}`,
        html: invoiceHtml,
      }),
    })

    return new Response(JSON.stringify(await res.json()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
