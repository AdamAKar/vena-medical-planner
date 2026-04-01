// lib/zoho.js — server-side only
// All Zoho API calls go through here. Never exposed to browser.

import axios from 'axios'

let _accessToken  = null
let _tokenExpiry  = 0

export async function getZohoToken() {
  // Return cached token if still valid (5 min buffer)
  if (_accessToken && Date.now() < _tokenExpiry - 300000) {
    return _accessToken
  }

  // Refresh using stored refresh token
  const res = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
    params: {
      grant_type:    'refresh_token',
      client_id:     process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    },
  })

  if (!res.data.access_token) {
    throw new Error('Zoho token refresh failed: ' + JSON.stringify(res.data))
  }

  _accessToken = res.data.access_token
  _tokenExpiry = Date.now() + (res.data.expires_in || 3600) * 1000
  return _accessToken
}

export async function zohoGet(path) {
  const token = await getZohoToken()
  const res = await axios.get('https://www.zohoapis.com/crm/v2/' + path, {
    headers: { Authorization: 'Zoho-oauthtoken ' + token },
  })
  return res.data
}

export async function zohoPost(path, data) {
  const token = await getZohoToken()
  const res = await axios.post('https://www.zohoapis.com/crm/v2/' + path, data, {
    headers: {
      Authorization:  'Zoho-oauthtoken ' + token,
      'Content-Type': 'application/json',
    },
  })
  return res.data
}
