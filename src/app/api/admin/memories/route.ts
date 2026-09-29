import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detachMemoriesFromTrips, getAdminTrip } from '@/lib/trip'

// Memories are shared across all trips
export async function GET() {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await detachMemoriesFromTrips()
  const memories = await prisma.memory.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(memories)
}

export async function POST(req: NextRequest) {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { photoUrl, caption } = await req.json()
  if (!photoUrl) return NextResponse.json({ error: 'Photo is required' }, { status: 400 })
  const memory = await prisma.memory.create({ data: { photoUrl, caption: caption || '' } })
  return NextResponse.json(memory)
}
