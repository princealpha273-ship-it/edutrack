import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function getAuthUser(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  return verifyToken(token)
}

// GET - List hotspot admins
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const hotspots = await prisma.hotspotAdmin.findMany({
      where: { institutionId: auth.institutionId },
      orderBy: { createdAt: 'desc' }
    })

    const count = await prisma.hotspotAdmin.count({
      where: { institutionId: auth.institutionId }
    })

    return NextResponse.json({ 
      success: true, 
      hotspots,
      count,
      maxAllowed: 8,
      canAddMore: count < 8
    })
  } catch (error: any) {
    console.error('Get hotspots error:', error)
    return NextResponse.json({ error: 'Failed to get hotspots' }, { status: 500 })
  }
}

// POST - Add new hotspot admin (max 8)
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, phone, role, unit, hotspotName, userId } = body

    // Check max limit (8 hotspots)
    const currentCount = await prisma.hotspotAdmin.count({
      where: { institutionId: auth.institutionId }
    })

    if (currentCount >= 8) {
      return NextResponse.json({ 
        error: 'Maximum of 8 hotspot admins allowed per institution' 
      }, { status: 400 })
    }

    // Check if phone already registered
    const existing = await prisma.hotspotAdmin.findFirst({
      where: { institutionId: auth.institutionId, phone }
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'This phone number is already registered as a hotspot' 
      }, { status: 400 })
    }

    const hotspot = await prisma.hotspotAdmin.create({
      data: {
        institutionId: auth.institutionId,
        userId: userId || undefined,
        fullName,
        phone,
        role: role || 'unit_teacher',
        unit,
        hotspotName: hotspotName || `${fullName}'s Hotspot`
      }
    })

    return NextResponse.json({ success: true, hotspot })
  } catch (error: any) {
    console.error('Create hotspot error:', error)
    return NextResponse.json({ error: 'Failed to create hotspot' }, { status: 500 })
  }
}

// PUT - Update hotspot admin
export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, fullName, phone, role, unit, hotspotName, isActive, isOnline } = body

    const hotspot = await prisma.hotspotAdmin.update({
      where: { id },
      data: {
        fullName,
        phone,
        role,
        unit,
        hotspotName,
        isActive,
        isOnline,
        lastActiveAt: isOnline ? new Date() : undefined
      }
    })

    return NextResponse.json({ success: true, hotspot })
  } catch (error: any) {
    console.error('Update hotspot error:', error)
    return NextResponse.json({ error: 'Failed to update hotspot' }, { status: 500 })
  }
}

// DELETE - Remove hotspot admin
export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Hotspot ID required' }, { status: 400 })
    }

    await prisma.hotspotAdmin.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete hotspot error:', error)
    return NextResponse.json({ error: 'Failed to delete hotspot' }, { status: 500 })
  }
}
