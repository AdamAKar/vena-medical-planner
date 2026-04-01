// pages/api/zoho/accounts.js
// Returns Zoho account list from Supabase cache for typeahead search
// Cache is kept live by webhook

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const q = (req.query.q || '').toLowerCase().trim()

  let query = supabase
    .from('zoho_acct_cache')
    .select('zoho_id,name,city')
    .order('name')
    .limit(20)

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data, error } = await query

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ accounts: data || [] })
}
