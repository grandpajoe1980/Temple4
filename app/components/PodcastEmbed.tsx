"use client"
import React, { useEffect, useState } from 'react'
import { detectPodcast, spotifyEmbedUrl, youtubeEmbedUrl, appleEmbedUrl } from '../../lib/podcast'

type Props = {
  url: string
  autoplay?: boolean
}

type Meta = {
  title?: string
  image?: string
  provider?: string
}

export default function PodcastEmbed({ url, autoplay = false }: Props) {
  const info = detectPodcast(url)
  const [meta, setMeta] = useState<Meta | null>(null)


  useEffect(() => {
    let mounted = true
    async function loadMeta() {
      try {
        const res = await fetch('/api/podcast/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        if (!res.ok) return
        const json = await res.json()
        if (!mounted) return
        setMeta({ title: json.title, image: json.image, provider: json.provider })
      } catch (err) {
        // ignore
      }
    }
    loadMeta()
    return () => {
      mounted = false
    }
  }, [url])

  const artwork = meta?.image
  const title = meta?.title
 

  const renderHeader = () => {
    if (!artwork && !title) return null
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
        {artwork ? (
          <img src={artwork} alt={title || 'artwork'} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
        ) : null}
        {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}
      </div>
    )
  }

  // If the provided URL is already an embed URL (Spotify embed, YouTube embed, Apple embed),
  // prefer rendering it directly in an iframe rather than falling back to opening it externally.
  const alreadyEmbed = (() => {
    try {
      const u = url.toLowerCase()
      if (u.includes('open.spotify.com/embed/episode/')) return { provider: 'spotify' as const, src: url }
      if (u.includes('youtube.com/embed/') || u.includes('youtu.be/embed/')) return { provider: 'youtube' as const, src: url }
      if (u.includes('embed.podcasts.apple.com')) return { provider: 'apple' as const, src: url }
      return null
    } catch (e) {
      return null
    }
  })()

  function appendAutoplayToSrc(src: string, provider?: string) {
    if (!autoplay) return src
    try {
      const urlObj = new URL(src)
      // For YouTube embed, add autoplay=1
      if ((provider === 'youtube' || src.includes('youtube.com/embed')) && !urlObj.searchParams.has('autoplay')) {
        urlObj.searchParams.set('autoplay', '1')
      }
      // For Spotify embed, attempt autoplay param (may be ignored)
      if ((provider === 'spotify' || src.includes('open.spotify.com/embed')) && !urlObj.searchParams.has('autoplay')) {
        urlObj.searchParams.set('autoplay', '1')
      }
      return urlObj.toString()
    } catch (e) {
      // fallback: simple append
      if (src.indexOf('?') === -1) return src + '?autoplay=1'
      return src + '&autoplay=1'
    }
  }

  if (alreadyEmbed) {
    // Apple embeds are flaky in some browsers and may need different iframe attributes
    if (alreadyEmbed.provider === 'apple') {
      return (
        <div style={{ maxWidth: 660 }}>
          {renderHeader()}
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => openPlayer(alreadyEmbed.src)} style={{ padding: '6px 10px', marginRight: 8 }}>
              Open Player
            </button>
            <a href={url} target="_blank" rel="noreferrer noopener">
              Open on Apple Podcasts
            </a>
          </div>
          {artwork && !autoplay ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
              <div style={{ position: 'relative', width: 160, height: 160, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                <img src={artwork} alt={title || 'podcast artwork'} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <DetectedIframe
              title={`apple-embed-${Math.random().toString(36).slice(2, 8)}`}
              src={appendAutoplayToSrc(alreadyEmbed.src, 'apple')}
              style={{ width: '100%', maxWidth: 660, overflow: 'hidden', borderRadius: 10 }}
              height={450}
              frameBorder={0}
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              sandbox="allow-forms allow-same-origin allow-scripts allow-storage-access-by-user-activation"
              loading="lazy"
              fallbackSrc={url}
              timeoutMs={8000}
            />
          )}
        </div>
      )
    }

    // Default embed rendering for other providers (YouTube/Spotify)
    return (
      <div style={{ maxWidth: 960 }}>
        {renderHeader()}
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => openPlayer(alreadyEmbed.src)} style={{ padding: '6px 10px', marginRight: 8 }}>
            Open Player
          </button>
          <a href={url} target="_blank" rel="noreferrer noopener">
            Open Link
          </a>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <DetectedIframe
            title={`embedded-player-${Math.random().toString(36).slice(2, 8)}`}
            src={appendAutoplayToSrc(alreadyEmbed.src, alreadyEmbed.provider)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            frameBorder={0}
            allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
            loading="lazy"
            fallbackSrc={url}
          />
        </div>
      </div>
    )
  }

  // Helper to open the player in a new tab (fallback when iframe blocked)
  const openPlayer = (src?: string) => {
    if (!src) window.open(url, '_blank', 'noopener')
    else window.open(src, '_blank', 'noopener')
  }

  // Reusable iframe with load/error detection and timeout fallback
  function DetectedIframe(props: React.ComponentProps<'iframe'> & { src: string; fallbackSrc?: string; timeoutMs?: number }) {
    const { src, fallbackSrc, timeoutMs, ...rest } = props
    const [iframeStatus, setIframeStatus] = useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle')
    useEffect(() => {
      let mounted = true
      setIframeStatus('loading')
      const to = typeof timeoutMs === 'number' ? timeoutMs : 3500
      const timeout = setTimeout(() => {
        if (!mounted) return
        // if still loading after timeout, treat as failed
        setIframeStatus((s) => (s === 'loaded' ? s : 'failed'))
      }, to)
      return () => {
        mounted = false
        clearTimeout(timeout)
      }
    }, [src, timeoutMs])

    return (
      <div>
        {iframeStatus === 'failed' ? (
          <div style={{ padding: 20, background: '#111', color: '#fff', borderRadius: 8 }}>
            <div style={{ marginBottom: 8 }}>Embedded player blocked or failed to load.</div>
            <div>
              <button onClick={() => openPlayer(fallbackSrc || src)} style={{ padding: '6px 10px', marginRight: 8 }}>
                Open Player
              </button>
              <a href={src} target="_blank" rel="noreferrer noopener">Open link</a>
            </div>
          </div>
        ) : (
          <iframe
            {...rest}
            src={src}
            onLoad={() => { setIframeStatus('loaded'); console.debug('iframe loaded', src); }}
            onError={() => { setIframeStatus('failed'); console.debug('iframe error', src); }}
          />
        )}
      </div>
    )
  }

  // Component to attempt direct audio playback for Apple episodes, falling
  // back to the Apple iframe when a raw audio URL cannot be found.
  function AppleAudioOrIframe({ src, episodeId, url, autoplay, artwork, title }: { src?: string | undefined; episodeId?: string | undefined; url: string; autoplay?: boolean; artwork?: string | undefined; title?: string | undefined }) {
    const [audioUrl, setAudioUrl] = useState<string | null | undefined>(undefined)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      let mounted = true
      async function fetchAudio() {
        if (!autoplay) return
        if (!src) return
        setLoading(true)
        try {
          const res = await fetch('/api/podcast/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: src }),
          })
          if (!res.ok) {
            if (mounted) setAudioUrl(null)
            return
          }
          const json = await res.json()
          if (!mounted) return
          setAudioUrl(json.audioUrl ?? null)
        } catch (e) {
          if (mounted) setAudioUrl(null)
        } finally {
          if (mounted) setLoading(false)
        }
      }
      fetchAudio()
      return () => { mounted = false }
    }, [src, episodeId, autoplay])

    // If we have a discovered audio URL, render HTML5 audio player
    if (audioUrl) {
      return (
        <div>
          <audio src={audioUrl} controls autoPlay style={{ width: '100%' }} />
        </div>
      )
    }

    // While loading, show a small placeholder
    if (loading) {
      return <div>Loading player…</div>
    }

    // Fallback to iframe
    return (
      <DetectedIframe
        title={`apple-embed-${Math.random().toString(36).slice(2, 8)}`}
        src={src || url}
        style={{ width: '100%', maxWidth: 660, overflow: 'hidden', borderRadius: 10 }}
        height={450}
        frameBorder={0}
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        sandbox="allow-forms allow-same-origin allow-scripts allow-storage-access-by-user-activation"
        loading="lazy"
        fallbackSrc={url}
        timeoutMs={8000}
      />
    )
  }

  // Render Spotify
  if (info.provider === 'spotify' && info.id) {
    const src = spotifyEmbedUrl(info.id)
    return (
      <div style={{ maxWidth: 720 }}>
        {renderHeader()}
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => openPlayer(src)} style={{ padding: '6px 10px', marginRight: 8 }}>
            Open Player
          </button>
          <a href={url} target="_blank" rel="noreferrer noopener">
            Open on Spotify
          </a>
        </div>
        <DetectedIframe
          title={`spotify-episode-${info.id}`}
          src={appendAutoplayToSrc(src, 'spotify')}
          width="100%"
          height={232}
          frameBorder={0}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          fallbackSrc={url}
        />
      </div>
    )
  }

  // Render YouTube
  if (info.provider === 'youtube' && info.id) {
    const src = youtubeEmbedUrl(info.id)
    return (
      <div style={{ maxWidth: 960 }}>
        {renderHeader()}
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => openPlayer(src)} style={{ padding: '6px 10px', marginRight: 8 }}>
            Open Player
          </button>
          <a href={url} target="_blank" rel="noreferrer noopener">
            Open on YouTube
          </a>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <DetectedIframe
            title={`youtube-${info.id}`}
            src={appendAutoplayToSrc(src, 'youtube')}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            fallbackSrc={url}
          />
        </div>
      </div>
    )
  }

  // Render Apple (best-effort)
  if (info.provider === 'apple') {
    const src = appleEmbedUrl(info.podcastId, info.episodeId)
    return (
      <div style={{ maxWidth: 660 }}>
        {renderHeader()}
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => openPlayer(src)} style={{ padding: '6px 10px', marginRight: 8 }}>
            Open Player
          </button>
          <a href={url} target="_blank" rel="noreferrer noopener">
            Open on Apple Podcasts
          </a>
        </div>
            {src ? (
              // If we have artwork from metadata, prefer showing that as a clickable
              // image instead of relying on the Apple iframe (which is frequently
              // blocked/refuses to connect). Falls back to the iframe only when
              // artwork is unavailable.
              // If we're asked to autoplay prefer the raw audio where possible.
              artwork && !autoplay ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: 660, borderRadius: 10, overflow: 'hidden' }}>
                    <img src={artwork} alt={title || 'podcast artwork'} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', cursor: 'default' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                  </div>
                </div>
              ) : (
                // Try to fetch raw audio when autoplay is requested (Apple episodes are often not embeddable).
                <AppleAudioOrIframe src={src} episodeId={info.episodeId} url={url} autoplay={autoplay} artwork={artwork} title={title} />
              )
            ) : (
              <div>
                <a href={url} target="_blank" rel="noreferrer noopener">
                  Open episode
                </a>
              </div>
            )}
      </div>
    )
  }

  // Generic fallback
  return (
    <div>
      {renderHeader()}
      <div style={{ marginTop: 6 }}>
        <button onClick={() => openPlayer()} style={{ padding: '6px 10px', marginRight: 8 }}>
          Open Player
        </button>
        <a href={url} target="_blank" rel="noreferrer noopener">
          Open Link
        </a>
      </div>
    </div>
  )
}
