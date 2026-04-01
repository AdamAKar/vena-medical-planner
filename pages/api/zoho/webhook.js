// pages/api/zoho/webhook.js
// Receives webhook events from Zoho CRM
// Account created/updated/deleted → updates Supabase zoho_acct_cache

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const payload   = req.body
  const operation = (payload.operation || '').toLowerCase()
  const records   = Array.isArray(payload.data) ? payload.data : [payload.data].filter(Boolean)

  console.log('Zoho webhook:', operation, records.length, 'records')

  for (const record of records) {
    const zohoId = record.id || record.ID
    if (!zohoId) continue

    if (operation === 'delete') {
      await supabase.from('zoho_acct_cache').delete().eq('zoho_id', zohoId)
    } else {
      await supabase.from('zoho_acct_cache').upsert({
        zoho_id:     zohoId,
        name:        record.Account_Name || '',
        city:        record.Billing_City || '',
        modified_at: record.Modified_Time || new Date().toISOString(),
      }, { onConflict: 'zoho_id' })
    }
  }

  return res.status(200).json({ ok: true })
}
