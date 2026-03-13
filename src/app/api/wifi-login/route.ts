import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      selfieImage, 
      wifiSSID, 
      wifiBSSID,
      ipAddress,
      latitude,
      longitude,
      sessionType // student, staff, nonstaff
    } = body

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 8)

    // Check if WiFi is required and configured
    const allowedWifi = await prisma.schoolWifi.findFirst({
      where: { isActive: true }
    })

    let isWithinWifi = false
    let wifiMessage = "No school WiFi configured"
    let institutionId = ''

    if (allowedWifi) {
      institutionId = allowedWifi.institutionId
      if (!wifiSSID) {
        return NextResponse.json({ 
          error: 'WiFi connection required. Please connect to school WiFi.',
          requiresWifi: true,
          requiredSSID: allowedWifi.ssid
        }, { status: 400 })
      }

      // Check if connected to allowed WiFi
      if (wifiSSID === allowedWifi.ssid || (allowedWifi.bssid && wifiBSSID === allowedWifi.bssid)) {
        isWithinWifi = true
        wifiMessage = `Connected to school WiFi: ${wifiSSID}`
      } else {
        return NextResponse.json({ 
          error: `Please connect to school WiFi: ${allowedWifi.ssid}`,
          requiresWifi: true,
          requiredSSID: allowedWifi.ssid,
          currentSSID: wifiSSID
        }, { status: 400 })
      }
    }

    // For non-staff (visitors), no password needed
    if (sessionType === 'nonstaff') {
      if (!institutionId) {
        return NextResponse.json({ error: 'No institution configured' }, { status: 400 })
      }

      const visitor = await prisma.nonStaffAttendance.create({
        data: {
          institutionId,
          fullName: body.fullName || 'Visitor',
          phone: body.phone || null,
          organization: body.organization || null,
          purpose: body.purpose || 'General Visit',
          date: dateStr,
          checkInTime: timeStr,
          checkInWifi: wifiSSID || null,
          checkInImage: selfieImage || null
        }
      })

      await prisma.loginRecord.create({
        data: {
          institutionId,
          sessionType: 'nonstaff',
          selfieImage: selfieImage || '',
          wifiSSID: wifiSSID || null,
          wifiBSSID: wifiBSSID || null,
          ipAddress: ipAddress || null,
          latitude: latitude || null,
          longitude: longitude || null,
          loginTime: now,
          date: dateStr,
          time: timeStr,
          isWithinWifi
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Check-in recorded successfully',
        isWithinWifi,
        wifiMessage,
        visitor: {
          id: visitor.id,
          passNumber: visitor.id.substring(0, 8).toUpperCase()
        }
      })
    }

    // For students and staff, require authentication
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { 
        student: true,
        teacher: true,
        admin: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Get user role and institution from institutionUser
    const instUser = await prisma.institutionUser.findFirst({
      where: { userId: user.id }
    })

    const userRole = instUser?.role || 'student'
    const userInstitutionId = instUser?.institutionId || institutionId

    const token = generateToken({ 
      userId: user.id, 
      email: user.email, 
      role: userRole,
      institutionId: userInstitutionId
    })

    // Create login record with selfie
    const loginRecord = await prisma.loginRecord.create({
      data: {
        institutionId: userInstitutionId,
        userId: user.id,
        sessionType: userRole === 'student' ? 'student' : 'staff',
        selfieImage: selfieImage || '',
        wifiSSID: wifiSSID || null,
        wifiBSSID: wifiBSSID || null,
        ipAddress: ipAddress || null,
        latitude: latitude || null,
        longitude: longitude || null,
        locationName: body.locationName || null,
        loginTime: now,
        date: dateStr,
        time: timeStr,
        isWithinWifi
      }
    })

    // Auto-mark attendance if within WiFi
    if (isWithinWifi && user.student) {
      // Check if already marked present today
      const existingAttendance = await prisma.studentAttendance.findUnique({
        where: {
          studentId_date: {
            studentId: user.student.id,
            date: dateStr
          }
        }
      })

      if (!existingAttendance) {
        await prisma.studentAttendance.create({
          data: {
            institutionId: userInstitutionId,
            studentId: user.student.id,
            date: dateStr,
            checkInTime: timeStr,
            checkInWifi: wifiSSID || null,
            checkInImage: selfieImage || null,
            checkInVerified: true,
            status: 'present'
          }
        })

        // Update attendance rate
        const allAttendance = await prisma.studentAttendance.findMany({
          where: { studentId: user.student.id }
        })
        const presentCount = allAttendance.filter(a => a.status === 'present').length
        const newRate = allAttendance.length > 0 ? (presentCount / allAttendance.length) * 100 : 100
        await prisma.student.update({
          where: { id: user.student.id },
          data: { attendanceRate: newRate }
        })
      }
    } else if (isWithinWifi && (user.teacher || user.admin)) {
      // Check if already marked present today
      const existingAttendance = await prisma.staffAttendance.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: dateStr
          }
        }
      })

      if (!existingAttendance) {
        await prisma.staffAttendance.create({
          data: {
            institutionId: userInstitutionId,
            userId: user.id,
            role: userRole === 'admin' ? 'admin' : 'teacher',
            date: dateStr,
            checkInTime: timeStr,
            checkInWifi: wifiSSID || null,
            checkInImage: selfieImage || null,
            checkInVerified: true,
            status: 'present'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: userRole,
        profilePhoto: user.profilePhoto
      },
      isWithinWifi,
      wifiMessage,
      attendanceMarked: isWithinWifi,
      loginRecord: {
        id: loginRecord.id,
        time: loginRecord.time,
        date: loginRecord.date
      }
    })
  } catch (error: any) {
    console.error('WiFi Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const sessionType = searchParams.get('type') // student, staff, nonstaff

    const where: any = {}
    if (date) where.date = date
    if (sessionType) where.sessionType = sessionType

    const records = await prisma.loginRecord.findMany({
      where,
      include: {
        user: {
          select: { fullName: true, email: true }
        }
      },
      orderBy: { loginTime: 'desc' },
      take: 100
    })

    return NextResponse.json({ success: true, records })
  } catch (error: any) {
    console.error('Get login records error:', error)
    return NextResponse.json({ error: 'Failed to get records' }, { status: 500 })
  }
}
