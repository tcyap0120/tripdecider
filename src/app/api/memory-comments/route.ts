import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getViewer } from '@/lib/trip'

// Memories are shared across all trips, so comments are too

export async function GET(req: NextRequest) {
  if (!(await getViewer())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memoryId = req.nextUrl.searchParams.get('memoryId')
  if (!memoryId) return NextResponse.json({ error: 'Missing memoryId' }, { status: 400 })

  const comments = await prisma.memoryComment.findMany({
    where: { memoryId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, content: true, createdAt: true, participantId: true },
  })

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer()
  if (!viewer?.participantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memoryId, content } = await req.json()
  if (!memoryId || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (content.trim().length > 300) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const participant = await prisma.participant.findUnique({ where: { id: viewer.participantId } })
  if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comment = await prisma.memoryComment.create({
    data: {
      memoryId,
      participantId: participant.id,
      username: participant.displayName || participant.username,
      content: content.trim(),
    },
    select: { id: true, username: true, content: true, createdAt: true, participantId: true },
  })

  return NextResponse.json(comment)
}

export async function DELETE(req: NextRequest) {
  const viewer = await getViewer()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const comment = await prisma.memoryComment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only allow deleting own comment (or admin)
  if (viewer.participantId && comment.participantId !== viewer.participantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.memoryComment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
