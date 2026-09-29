import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detachMemoriesFromTrips, getViewer } from '@/lib/trip'

// Memories are shared across all trips
export async function GET() {
  if (!(await getViewer())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await detachMemoriesFromTrips()
  const memories = await prisma.memory.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(memories)
}
