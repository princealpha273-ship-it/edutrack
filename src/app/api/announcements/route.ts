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
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const where: any = {}
    if (role && role !== 'all') {
      where.targetRole = { in: [role, 'all'] }
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      announcements: announcements.map(a => ({
        id: a.id,
        title: a.title,
        message: a.message,
        targetRole: a.targetRole,
        priority: a.priority,
        createdAt: a.createdAt
      }))
    })
  } catch (error: any) {
    console.error('Get announcements error:', error)
    return NextResponse.json({ error: 'Failed to get announcements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, targetRole, priority } = body

    const announcement = await prisma.announcement.create({
      data: {
        adminId: auth.userId,
        institutionId: auth.institutionId || '',
        title,
        message,
        targetRole: targetRole || 'all',
        priority: priority || 'normal'
      }
    })

    return NextResponse.json({ success: true, announcement })
  } catch (error: any) {
    console.error('Create announcement error:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
