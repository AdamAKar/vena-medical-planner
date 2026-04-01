// pages/api/zoho/[...path].js
// Proxy for all Zoho CRM API calls from the browser
// Handles token refresh server-side — browser never touches Zoho directly

import { zohoGet, zohoPost } from '../../../lib/zoho'

export default async function handler(req, res) {
  // Build Zoho API path from URL segments
  const segments = req.query.path || []
  const path     = segments.join('/')
  const query    = new URLSearchParams(
    Object.entries(req.query).filter(([k]) => k !== 'path')
  ).toString()
  const fullPath = path + (query ? '?' + query : '')

  try {
    let data
    if (req.method === 'GET') {
      data = await zohoGet(fullPath)
    } else if (req.method === 'POST') {
      data = await zohoPost(fullPath, req.body)
    } else {
      return res.status(405).end()
    }
    return res.status(200).json(data)
  } catch (e) {
    console.error('Zoho proxy error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
