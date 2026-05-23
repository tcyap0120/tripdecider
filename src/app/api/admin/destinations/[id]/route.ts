import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, description, price, currency, photoUrl, link, details, tags } = body

  const destination = await prisma.destination.update({
    where: { id },
    data: {
      name,
      description,
      price: parseFloat(price),
      currency: currency || 'MYR',
      photoUrl,
      link: link || null,
      details: details || '',
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
    },
  })

  return NextResponse.json(destination)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.destination.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
