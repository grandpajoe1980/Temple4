"use client"
import React, { useEffect, useState } from 'react'
import PodcastEmbed from './PodcastEmbed'

type PodcastItem = {
  id: string
  title?: string | null
  description?: string | null
  audioUrl: string
  imageUrl?: string | null
}

export default function PodcastLinkForm({ tenantId, authorUserId }: { tenantId?: string; authorUserId?: string }) {
  const [url, setUrl] = useState('')
  const [list, setList] = useState<PodcastItem[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadList()
  }, [])

  async function loadList() {
    try {
      const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
      const res = await fetch(`/api/podcasts${q}`)
      if (!res.ok) return
      const data = await res.json()
      setList(data || [])
    } catch (err) {
      console.warn('failed to load podcasts', err)
    }
  }

  async function addUrl(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    if (!tenantId || !authorUserId) {
      // fallback to local-only
      setList((s) => [{ id: `local-${Date.now()}`, audioUrl: trimmed, title: undefined }, ...s])
      setUrl('')
      return
    }
    try {
      const res = await fetch('/api/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, tenantId, authorUserId }),
      })
      if (!res.ok) {
        console.warn('failed to save')
        return
      }
      const json = await res.json()
      setList((s) => [json, ...s])
      setUrl('')
    } catch (err) {
      console.warn('failed to save', err)
    }
  }

  async function removeAt(index: number, id?: string) {
    if (id && id.startsWith('local-')) {
      setList((s) => s.filter((_, i) => i !== index))
      return
    }
    try {
      const res = await fetch(`/api/podcasts?id=${encodeURIComponent(id || '')}`, { method: 'DELETE' })
      if (!res.ok) return
      setList((s) => s.filter((_, i) => i !== index))
    } catch (err) {
      console.warn('delete failed', err)
    }
  }

  function startEdit(index: number) {
    setEditingIndex(index)
    setEditValue(list[index].audioUrl)
  }

  async function saveEdit(index: number) {
    const trimmed = editValue.trim()
    if (!trimmed) return
    const item = list[index]
    if (item.id.startsWith('local-')) {
      setList((s) => s.map((v, i) => (i === index ? { ...v, audioUrl: trimmed } : v)))
      setEditingIndex(null)
      setEditValue('')
      return
    }
    try {
      const res = await fetch('/api/podcasts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, url: trimmed }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setList((s) => s.map((v, i) => (i === index ? updated : v)))
      setEditingIndex(null)
      setEditValue('')
    } catch (err) {
      console.warn('update failed', err)
    }
  }

  const IconButton = ({ onClick, bg, title, children }: { onClick: () => void; bg: string; title?: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#444' }}>
        Enter a share link from Spotify (episode URL), YouTube (watch or youtu.be), or Apple Podcasts (podcasts.apple.com/.../id...).
      </div>
      <form onSubmit={addUrl} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Spotify / YouTube / Apple Podcast link"
          style={{ flex: 1, padding: '8px 10px' }}
        />
        <button type="submit" style={{ padding: '8px 12px' }}>
          Add
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {list.map((item, i) => (
          <div key={item.id} style={{ position: 'relative', padding: 12, borderRadius: 8, background: '#fff' }}>
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
              <IconButton onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} bg="#22c55e" title="Play">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
                </svg>
              </IconButton>
              <IconButton onClick={() => startEdit(i)} bg="#2b6cb0" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" stroke="currentColor" strokeWidth="0" fill="currentColor" />
                </svg>
              </IconButton>
              <IconButton onClick={() => removeAt(i, item.id)} bg="#e53e3e" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7L5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </IconButton>
            </div>

            {editingIndex === i ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ flex: 1, padding: '6px 8px' }} />
                <button onClick={() => saveEdit(i)} style={{ padding: '6px 10px' }}>
                  Save
                </button>
                <button onClick={() => { setEditingIndex(null); setEditValue('') }} style={{ padding: '6px 10px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title || 'artwork'} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 96, height: 96, background: '#eee', borderRadius: 8 }} />
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{item.title || 'Untitled'}</div>
                  <div style={{ color: '#666' }}>{item.description || ''}</div>
                </div>
              </div>
            )}

            {expandedIndex === i ? (
              <div style={{ marginTop: 12 }}>
                <PodcastEmbed url={item.audioUrl} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
