export type PodcastProvider = 'spotify' | 'youtube' | 'apple' | 'unknown'

export interface DetectedPodcast {
  provider: PodcastProvider
  id?: string
  podcastId?: string
  episodeId?: string
}

export function detectPodcast(url: string): DetectedPodcast {
  try {
    const u = url.trim()

    // Spotify episode
    const spotifyEp = /open\.spotify\.com\/episode\/([A-Za-z0-9]+)/i.exec(u)
    if (spotifyEp) return { provider: 'spotify', id: spotifyEp[1] }

    // YouTube (youtu.be or youtube.com/watch)
    const ytShort = /youtu\.be\/([\w-]{11})/i.exec(u)
    if (ytShort) return { provider: 'youtube', id: ytShort[1] }
    const ytLong = /v=([\w-]{11})/i.exec(u)
    if (ytLong) return { provider: 'youtube', id: ytLong[1] }
    const ytEmbed = /youtube\.com\/embed\/([\w-]{11})/i.exec(u)
    if (ytEmbed) return { provider: 'youtube', id: ytEmbed[1] }

    // Apple Podcasts: try to capture podcast id and optional episode id (?i=)
    // examples:
    // https://podcasts.apple.com/us/podcast/no-such-thing-as-a-fish/id840986946
    // https://podcasts.apple.com/us/podcast/id840986946?i=1000531234567
    const applePodcast = /podcasts\.apple\.com\/.+\/id(\d+)(?:.*[?&]i=(\d+))?/i.exec(u)
    if (applePodcast) {
      const podcastId = applePodcast[1]
      const episodeId = applePodcast[2]
      return { provider: 'apple', podcastId, episodeId }
    }

    return { provider: 'unknown' }
  } catch (err) {
    return { provider: 'unknown' }
  }
}

export function spotifyEmbedUrl(episodeId: string) {
  return `https://open.spotify.com/embed/episode/${episodeId}`
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`
}

export function appleEmbedUrl(podcastId?: string, episodeId?: string, country = 'us') {
  if (!podcastId && !episodeId) return undefined
  if (podcastId && episodeId) return `https://embed.podcasts.apple.com/${country}/podcast/id${podcastId}?i=${episodeId}`
  if (podcastId) return `https://embed.podcasts.apple.com/${country}/podcast/id${podcastId}`
  // fallback: if only episodeId present (rare), we can't build a clean embed
  return undefined
}
