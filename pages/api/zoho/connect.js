// pages/api/zoho/connect.js
// Exchanges a Self Client grant code for access + refresh tokens
// Called once during setup — stores refresh token in Supabase

import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { clientId, clientSecret, grantCode } = req.body

  if (!clientId || !clientSecret || !grantCode) {
    return res.status(400).json({ error: 'clientId, clientSecret, grantCode required' })
  }

  try {
    const tokenRes = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        grant_type:    'authorization_code',
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  'http://localhost',
        code:          grantCode,
      },
    })

    const { access_token, refresh_token, expires_in } = tokenRes.data

    if (!access_token) {
      return res.status(400).json({ error: tokenRes.data.error || 'Token exchange failed', details: tokenRes.data })
    }

    // Store tokens in Supabase reps table so they persist
    await supabase.from('reps').upsert({
      id:            'default',
      zoho_token:    access_token,
      zoho_refresh:  refresh_token,
      zoho_expiry:   Date.now() + (expires_in || 3600) * 1000,
      zoho_client_id:     clientId,
      zoho_client_secret: clientSecret,
    }, { onConflict: 'id' })

    // Immediately do initial account sync
    await syncZohoAccounts(access_token)

    return res.status(200).json({
      ok: true,
      message: 'Zoho connected and accounts synced',
    })
  } catch (e) {
    console.error('Zoho connect error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}

async function syncZohoAccounts(token) {
  try {
    const r = await axios.get(
      'https://www.zohoapis.com/crm/v2/Accounts?fields=id,Account_Name,Billing_City&per_page=200',
      { headers: { Authorization: 'Zoho-oauthtoken ' + token } }
    )
    const accounts = r.data?.data || []
    if (!accounts.length) return

    const rows = accounts.map(a => ({
      zoho_id:     a.id,
      name:        a.Account_Name || '',
      city:        a.Billing_City || '',
      modified_at: new Date().toISOString(),
    }))

    await supabase.from('zoho_acct_cache').upsert(rows, { onConflict: 'zoho_id' })
    console.log('Synced', rows.length, 'Zoho accounts to cache')
  } catch (e) {
    console.warn('Initial sync failed:', e.message)
  }
}
