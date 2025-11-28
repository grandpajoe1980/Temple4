import { NextResponse } from 'next/server'
import { detectPodcast } from '../../../../lib/podcast'

async function fetchOEmbed(url: string, endpoint: string) {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return null
    const json = await res.json()
    return json
  } catch (err) {
    return null
  }
}

function parseMetaFromHtml(html: string) {
  const titleMatch = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html)
  const imgMatch = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html)
  const twitterImg = /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html)
  const title = titleMatch ? titleMatch[1] : undefined
  const image = imgMatch ? imgMatch[1] : twitterImg ? twitterImg[1] : undefined
  return { title, image }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const url = body?.url
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })

    const info = detectPodcast(url)

    // Try provider-specific oEmbed endpoints first
    if (info.provider === 'youtube') {
      const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const o = await fetchOEmbed(url, endpoint)
      if (o) return NextResponse.json({ provider: 'youtube', title: o.title, image: o.thumbnail_url, info })
    }

    if (info.provider === 'spotify' && info.id) {
      const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      const o = await fetchOEmbed(url, endpoint)
      if (o) return NextResponse.json({ provider: 'spotify', title: o.title, image: o.thumbnail_url, info })
    }

    // Fallback: fetch page and parse OpenGraph / Twitter meta
    try {
      const res = await fetch(url)
      const text = await res.text()
      const parsed = parseMetaFromHtml(text)
      return NextResponse.json({ provider: info.provider, title: parsed.title, image: parsed.image, info })
    } catch (err) {
      return NextResponse.json({ provider: info.provider, info })
    }
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
