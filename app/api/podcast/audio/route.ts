import { NextResponse } from 'next/server'
import { detectPodcast } from '../../../../lib/podcast'

function findEnclosureInFeed(feedText: string, episodeId?: string, episodeTitle?: string) {
  try {
    // Split into item blocks
    const items = feedText.split(/<item[\s>]/i).slice(1)
    for (const raw of items) {
      const item = '<item' + raw
      // If episodeId present, try to match link or guid containing ?i=episodeId
      if (episodeId) {
        const idPattern = new RegExp('\\?i=' + episodeId)
        if (idPattern.test(item)) {
          const enc = /<enclosure[^>]*url=["']([^"']+)["']/i.exec(item)
          if (enc) return enc[1]
        }
      }
      // Fallback: match by title if provided
      if (episodeTitle) {
        const titlePattern = episodeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (new RegExp(titlePattern, 'i').test(item)) {
          const enc = /<enclosure[^>]*url=["']([^"']+)["']/i.exec(item)
          if (enc) return enc[1]
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const url: string = body?.url
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })

    const info = detectPodcast(url)

    // Handle Apple Podcasts by locating the show's RSS feed and parsing enclosure
    if (info.provider === 'apple' && info.podcastId) {
      try {
        const lookupUrl = `https://itunes.apple.com/lookup?id=${info.podcastId}&entity=podcastEpisode`
        const lookupRes = await fetch(lookupUrl)
        if (lookupRes.ok) {
          const lookupJson = await lookupRes.json()
          const results = lookupJson.results || []
          // Try to get collection-level feedUrl
          const collection = results.find((r: any) => r.wrapperType === 'collection') || results[0]
          const feedUrl = collection?.feedUrl

          // Try to obtain episode title from lookup results when episodeId provided
          let episodeTitle: string | undefined
          if (info.episodeId) {
            const ep = results.find((r: any) => String(r.trackId) === String(info.episodeId))
            if (ep) episodeTitle = ep.trackName
          }

          if (feedUrl) {
            const feedRes = await fetch(feedUrl)
            if (feedRes.ok) {
              const text = await feedRes.text()
              const enclosure = findEnclosureInFeed(text, info.episodeId, episodeTitle)
              if (enclosure) {
                return NextResponse.json({ audioUrl: enclosure })
              }
            }
          }
        }
      } catch (e) {
        // ignore and fallthrough
      }
    }

    // Generic fallback: no direct audio found
    return NextResponse.json({ audioUrl: null })
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
