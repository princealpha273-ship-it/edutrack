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
    if (!auth || !auth.institutionId || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wifiNetworks = await prisma.schoolWifi.findMany({
      where: { institutionId: auth.institutionId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, wifiNetworks })
  } catch (error: any) {
    console.error('Get WiFi error:', error)
    return NextResponse.json({ error: 'Failed to get WiFi networks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ssid, bssid, allowedFrom, allowedTo } = body

    const wifi = await prisma.schoolWifi.create({
      data: {
        institutionId: auth.institutionId,
        ssid,
        bssid: bssid || null,
        allowedFrom: allowedFrom || "00:00:00",
        allowedTo: allowedTo || "23:59:59"
      }
    })

    return NextResponse.json({ success: true, wifi })
  } catch (error: any) {
    console.error('Create WiFi error:', error)
    return NextResponse.json({ error: 'Failed to create WiFi network' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ssid, bssid, isActive, allowedFrom, allowedTo } = body

    const wifi = await prisma.schoolWifi.update({
      where: { id, institutionId: auth.institutionId },
      data: { ssid, bssid: bssid || null, isActive, allowedFrom, allowedTo }
    })

    return NextResponse.json({ success: true, wifi })
  } catch (error: any) {
    console.error('Update WiFi error:', error)
    return NextResponse.json({ error: 'Failed to update WiFi network' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth || !auth.institutionId || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'WiFi ID required' }, { status: 400 })
    }

    await prisma.schoolWifi.delete({ where: { id, institutionId: auth.institutionId } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete WiFi error:', error)
    return NextResponse.json({ error: 'Failed to delete WiFi network' }, { status: 500 })
  }
}
