import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyToken, getTokenFromHeader } from '@/lib/auth'

function getAuthUser(request: NextRequest) {
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (!token) return null
  return verifyToken(token)
}

// GET - List all institutions (Platform Admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is platform admin
    const platformAdmin = await prisma.platformAdmin.findFirst({
      where: { email: auth.email }
    })

    if (!platformAdmin) {
      return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let where: any = {}
    if (status) where.subscriptionStatus = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } }
      ]
    }

    const institutions = await prisma.institution.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            users: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, institutions })
  } catch (error: any) {
    console.error('Get institutions error:', error)
    return NextResponse.json({ error: 'Failed to get institutions' }, { status: 500 })
  }
}

// POST - Create new institution (Platform Admin)
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformAdmin = await prisma.platformAdmin.findFirst({
      where: { email: auth.email }
    })

    if (!platformAdmin) {
      return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, country, county, address, phone, email, subscriptionPlan, monthlyFee } = body

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

    // Check if slug exists
    const existing = await prisma.institution.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Institution with this name already exists' }, { status: 400 })
    }

    const institution = await prisma.institution.create({
      data: {
        name,
        slug,
        type: type || 'secondary',
        country: country || 'Kenya',
        county,
        address,
        phone,
        email,
        subscriptionPlan: subscriptionPlan || 'basic',
        monthlyFee: monthlyFee || 0,
        subscriptionStatus: 'active',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
      }
    })

    return NextResponse.json({ success: true, institution })
  } catch (error: any) {
    console.error('Create institution error:', error)
    return NextResponse.json({ error: 'Failed to create institution' }, { status: 500 })
  }
}

// PUT - Update institution (Platform Admin)
export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformAdmin = await prisma.platformAdmin.findFirst({
      where: { email: auth.email }
    })

    if (!platformAdmin) {
      return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, type, country, county, address, phone, email, subscriptionStatus, subscriptionPlan, monthlyFee, isActive } = body

    const institution = await prisma.institution.update({
      where: { id },
      data: {
        name,
        type,
        country,
        county,
        address,
        phone,
        email,
        subscriptionStatus,
        subscriptionPlan,
        monthlyFee,
        isActive
      }
    })

    return NextResponse.json({ success: true, institution })
  } catch (error: any) {
    console.error('Update institution error:', error)
    return NextResponse.json({ error: 'Failed to update institution' }, { status: 500 })
  }
}

// DELETE - Delete institution (Platform Admin)
export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformAdmin = await prisma.platformAdmin.findFirst({
      where: { email: auth.email }
    })

    if (!platformAdmin) {
      return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Institution ID required' }, { status: 400 })
    }

    await prisma.institution.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete institution error:', error)
    return NextResponse.json({ error: 'Failed to delete institution' }, { status: 500 })
  }
}
