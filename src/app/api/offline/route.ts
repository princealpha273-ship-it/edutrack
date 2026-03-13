import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function getAuthUser(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingSync = await prisma.offlineSync.findMany({
      where: { synced: false },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, pendingSync })
  } catch (error: any) {
    console.error('Get offline sync error:', error)
    return NextResponse.json({ error: 'Failed to get sync data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tableName, recordId, action, data } = body

    const syncRecord = await prisma.offlineSync.create({
      data: {
        tableName,
        recordId,
        action,
        data: JSON.stringify(data),
        synced: false
      }
    })

    return NextResponse.json({ success: true, syncRecord })
  } catch (error: any) {
    console.error('Create offline sync error:', error)
    return NextResponse.json({ error: 'Failed to create sync record' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.offlineSync.update({
        where: { id },
        data: { synced: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Sync ID required' }, { status: 400 })
  } catch (error: any) {
    console.error('Update offline sync error:', error)
    return NextResponse.json({ error: 'Failed to update sync' }, { status: 500 })
  }
}
