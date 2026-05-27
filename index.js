import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function buildPrompt(filters) {
  const { maxRent, beds, baths, minSqft, daysAgo, neighborhoods, features } = filters
  return `You are a San Francisco apartment rental search agent. Search the web for current real apartment listings matching these exact filters:

- Max rent: ${maxRent === 'any' ? 'no limit' : '$' + maxRent + '/mo'}
- Bedrooms: ${beds === 'any' ? 'any' : beds === 'studio' ? 'studio' : beds + ' bedroom(s)'}
- Bathrooms: ${baths === 'any' ? 'any' : 'at least ' + baths}
- Min size: ${minSqft} sqft (omit if not listed)
- Listed within: last ${daysAgo} day(s)
- Neighborhoods: ${neighborhoods.join(', ')}
- Must-have features: ${features.length > 0 ? features.join(', ') : 'none specified'}

Search these sites in order: sfbay.craigslist.org/search/apa, zillow.com/san-francisco-ca/rentals, apartments.com/san-francisco-ca, padmapper.com, hotpads.com. Find 5–8 real current listings that best match the filters. Prefer the most recently posted listings.

Respond ONLY with a valid JSON array. No markdown fences, no explanation, no preamble. The array must be parseable by JSON.parse(). Use this exact shape for each object:
{
  "title": "Sunny 1BR flat in the Mission",
  "price": 3200,
  "beds": "1 BR",
  "baths": "1 BA",
  "sqft": 750,
  "neighborhood": "Mission",
  "source": "Craigslist",
  "sourceIcon": "world",
  "url": "https://sfbay.craigslist.org/sfc/apa/...",
  "description": "Hardwood floors, updated kitchen, in-unit laundry, natural light.",
  "posted": "3 hours ago",
  "isNew": true,
  "isHot": false
}

sourceIcon values: "world" for Craigslist, "building" for Zillow or Apartments.com, "map-pin" for Padmapper or HotPads.
isNew = true if listed within last 24 hours. isHot = true if the listing has high demand signals (e.g. "applications accepted" or multiple inquiries noted).
If a real listing doesn't have sqft listed, use null for sqft.
If fewer than 5 real matching listings are found, supplement with highly realistic representative listings clearly marked in the description as "— representative example".`
}

app.post('/search', async (req, res) => {
  const filters = req.body

  if (!filters.neighborhoods || filters.neighborhoods.length === 0) {
    return res.status(400).json({ error: 'At least one neighborhood is required.' })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: buildPrompt(filters) }],
    })

    const textBlocks = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const clean = textBlocks.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')

    if (start === -1 || end === -1) {
      throw new Error('No JSON array found in model response.')
    }

    const listings = JSON.parse(clean.slice(start, end + 1))

    // Basic validation
    const validated = listings
      .filter(l => l && typeof l.price === 'number' && l.title)
      .map(l => ({
        title: String(l.title),
        price: Math.round(l.price),
        beds: String(l.beds || '—'),
        baths: String(l.baths || '—'),
        sqft: l.sqft ? Math.round(l.sqft) : null,
        neighborhood: String(l.neighborhood || ''),
        source: String(l.source || 'Unknown'),
        sourceIcon: String(l.sourceIcon || 'world'),
        url: String(l.url || '#'),
        description: String(l.description || ''),
        posted: String(l.posted || ''),
        isNew: Boolean(l.isNew),
        isHot: Boolean(l.isHot),
      }))

    res.json({ listings: validated })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: err.message || 'Search failed.' })
  }
})

app.get('/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`\n🏠 SF Rental Digest API`)
  console.log(`   Running at http://localhost:${PORT}`)
  console.log(`   POST /search — run a listing search`)
  console.log(`   GET  /health — health check\n`)
})
