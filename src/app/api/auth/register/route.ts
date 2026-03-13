import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, class: studentClass, admissionNumber, parentPhone } = body

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and full name required' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone
      }
    })

    const token = generateToken({ userId: user.id, email: user.email, role: 'student' })

    return NextResponse.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: 'student' }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
