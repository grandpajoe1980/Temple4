"use client"
import React, { useEffect, useState } from 'react'
import { detectPodcast, spotifyEmbedUrl, youtubeEmbedUrl, appleEmbedUrl } from '../../lib/podcast'

type Props = {
  url: string
}

type Meta = {
  title?: string
  image?: string
  provider?: string
}

export default function PodcastEmbed({ url }: Props) {
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

  // Helper to open the player in a new tab (fallback when iframe blocked)
  const openPlayer = (src?: string) => {
    if (!src) window.open(url, '_blank', 'noopener')
    else window.open(src, '_blank', 'noopener')
  }

  // Reusable iframe with load/error detection and timeout fallback
  function DetectedIframe(props: React.ComponentProps<'iframe'> & { src: string; fallbackSrc?: string }) {
    const { src, fallbackSrc, ...rest } = props
    const [iframeStatus, setIframeStatus] = useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle')
    useEffect(() => {
      let mounted = true
      setIframeStatus('loading')
      const timeout = setTimeout(() => {
        if (!mounted) return
        // if still loading after timeout, treat as failed
        setIframeStatus((s) => (s === 'loaded' ? s : 'failed'))
      }, 3500)
      return () => {
        mounted = false
        clearTimeout(timeout)
      }
    }, [src])

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
          src={src}
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
            src={src}
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
              artwork ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: 660, borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openPlayer(src)}>
                  <img src={artwork} alt={title || 'podcast artwork'} style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <DetectedIframe
                  title={`apple-podcast-${info.podcastId}-${info.episodeId || 'pod'}`}
                  src={src}
                  style={{ width: '100%', maxWidth: 660, overflow: 'hidden', borderRadius: 10 }}
                  height={450}
                  frameBorder={0}
                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                  sandbox="allow-forms allow-same-origin allow-scripts allow-storage-access-by-user-activation"
                  loading="lazy"
                  fallbackSrc={url}
                />
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
