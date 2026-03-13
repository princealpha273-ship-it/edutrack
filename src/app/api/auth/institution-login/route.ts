import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, generateToken, verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, institutionSlug, selfieImage, wifiSSID, wifiBSSID, sessionType } = body

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 8)

    // Handle non-staff (visitors)
    if (sessionType === 'nonstaff') {
      const institution = await prisma.institution.findUnique({ where: { slug: institutionSlug } })
      if (!institution) {
        return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
      }

      const visitor = await prisma.nonStaffAttendance.create({
        data: {
          institutionId: institution.id,
          fullName: body.fullName || 'Visitor',
          phone: body.phone,
          organization: body.organization,
          purpose: body.purpose || 'General Visit',
          date: dateStr,
          checkInTime: timeStr,
          checkInWifi: wifiSSID
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Check-in recorded',
        visitor: { id: visitor.id, passNumber: visitor.id.substring(0, 8).toUpperCase() }
      })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Get first membership
    const membership = await prisma.institutionUser.findFirst({ where: { userId: user.id, isActive: true } })
    if (!membership) {
      return NextResponse.json({ error: 'User does not belong to any institution' }, { status: 403 })
    }

    const institution = await prisma.institution.findUnique({ where: { id: membership.institutionId } })
    if (!institution || !institution.isActive) {
      return NextResponse.json({ error: 'Institution not active' }, { status: 403 })
    }

    const token = generateToken({ userId: user.id, email: user.email, role: membership.role, institutionId: institution.id })

    // Simple WiFi check - any WiFi works for now
    const isWithinWifi = !!wifiSSID

    const loginRecord = await prisma.loginRecord.create({
      data: {
        institutionId: institution.id,
        userId: user.id,
        sessionType: membership.role === 'student' ? 'student' : 'staff',
        selfieImage: selfieImage || '',
        wifiSSID,
        wifiBSSID,
        loginTime: now,
        date: dateStr,
        time: timeStr,
        isWithinWifi
      }
    })

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: membership.role },
      institution: { id: institution.id, name: institution.name, slug: institution.slug },
      isWithinWifi,
      attendanceMarked: isWithinWifi && membership.role === 'student'
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
