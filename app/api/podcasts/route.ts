import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const tenantId = q.get('tenantId')
    const where: any = { deletedAt: null }
    if (tenantId) where.tenantId = tenantId
    const podcasts = await prisma.podcast.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(podcasts)
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, tenantId, authorUserId, title, description } = body
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })
    if (!tenantId) return NextResponse.json({ error: 'missing tenantId' }, { status: 400 })
    if (!authorUserId) return NextResponse.json({ error: 'missing authorUserId' }, { status: 400 })

    // Try to fetch metadata via our metadata endpoint
    let meta: any = {}
    try {
      const res = await fetch(new URL('/api/podcast/metadata', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (res.ok) meta = await res.json()
    } catch (e) {
      // ignore
    }

    const created = await prisma.podcast.create({
      data: {
        tenantId,
        authorUserId,
        title: title || meta.title || 'Untitled',
        description: description || '',
        audioUrl: url,
        imageUrl: meta.image || null,
        isPublished: true,
        publishedAt: new Date(),
      },
    })
    return NextResponse.json(created)
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, url, title, description } = body
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const updateData: any = {}
    if (url) updateData.audioUrl = url
    if (title) updateData.title = title
    if (description) updateData.description = description

    // If url changed, try to refresh metadata
    if (url) {
      try {
        const res = await fetch(new URL('/api/podcast/metadata', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        if (res.ok) {
          const meta = await res.json()
          if (meta.title) updateData.title = meta.title
          if (meta.image) updateData.imageUrl = meta.image
        }
      } catch (e) {}
    }

    const updated = await prisma.podcast.update({ where: { id }, data: updateData })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const id = q.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const now = new Date()
    const updated = await prisma.podcast.update({ where: { id }, data: { deletedAt: now } })
    return NextResponse.json({ success: true, podcast: updated })
  } catch (err) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
