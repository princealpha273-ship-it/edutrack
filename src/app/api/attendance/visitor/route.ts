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
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let where: any = {}

    if (date) {
      where.date = date
    } else if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate }
    }

    const visitors = await prisma.nonStaffAttendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { checkInTime: 'desc' }]
    })

    const total = visitors.length
    const checkedIn = visitors.filter(v => v.status === 'checked-in').length
    const checkedOut = visitors.filter(v => v.status === 'checked-out').length

    return NextResponse.json({
      success: true,
      visitors,
      statistics: { total, checkedIn, checkedOut }
    })
  } catch (error: any) {
    console.error('Get visitors error:', error)
    return NextResponse.json({ error: 'Failed to get visitors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, checkOut, selfieImage, wifiSSID } = body

    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 8)

    // Check-out visitor
    if (id && checkOut) {
      const visitor = await prisma.nonStaffAttendance.update({
        where: { id },
        data: {
          checkOutTime: timeStr,
          checkOutWifi: wifiSSID,
          checkOutImage: selfieImage,
          status: 'checked-out'
        }
      })
      return NextResponse.json({ success: true, visitor })
    }

    // Check-in new visitor (handled by wifi-login for guests)
    return NextResponse.json({ error: 'Use /api/wifi-login for visitor check-in' }, { status: 400 })
  } catch (error: any) {
    console.error('Visitor attendance error:', error)
    return NextResponse.json({ error: 'Failed to process visitor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      await prisma.nonStaffAttendance.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 })
  } catch (error: any) {
    console.error('Delete visitor error:', error)
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 })
  }
}
