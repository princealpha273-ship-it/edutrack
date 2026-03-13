import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { initiateMpesaPayment, extractMpesaTransactionData, verifyMpesaCallback } from '@/lib/mpesa'

const SCHOOL_FEE_AMOUNT = 7000 // Example exam fee
const COMMISSION_FEE = 100 // Your 100 KES per transaction

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

    const student = await prisma.student.findUnique({ where: { userId: auth.userId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const transactions = await prisma.feeTransaction.findMany({
      where: { studentId: student.id },
      orderBy: { paymentDate: 'desc' }
    })

    const completedTransactions = transactions.filter(t => t.paymentStatus === 'completed')
    const totalPaid = completedTransactions.reduce((sum, t) => sum + t.amountPaid, 0)
    const totalCommission = completedTransactions.reduce((sum, t) => sum + t.commissionFee, 0)
    const balance = Math.max(0, SCHOOL_FEE_AMOUNT - totalPaid)

    return NextResponse.json({
      success: true,
      feeInfo: {
        schoolFeeAmount: SCHOOL_FEE_AMOUNT,
        commissionFee: COMMISSION_FEE,
        totalPaid,
        totalCommission,
        balance,
        transactions
      }
    })
  } catch (error: any) {
    console.error('Get fees error:', error)
    return NextResponse.json({ error: 'Failed to get fee info' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, amount } = body

    const student = await prisma.student.findUnique({ where: { userId: auth.userId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const totalAmount = amount || SCHOOL_FEE_AMOUNT
    const paymentAmount = totalAmount + COMMISSION_FEE // User pays school fee + 100 KES commission

    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    
    const transaction = await prisma.feeTransaction.create({
      data: {
        institutionId: student.institutionId,
        userId: auth.userId,
        studentId: student.id,
        schoolFeeAmount: totalAmount,
        commissionFee: COMMISSION_FEE,
        amountPaid: paymentAmount,
        balanceRemaining: Math.max(0, SCHOOL_FEE_AMOUNT - (totalAmount)),
        paymentStatus: 'pending',
        phoneNumber: phone || user?.phone || ''
      }
    })

    if (phone) {
      const mpesaResult = await initiateMpesaPayment({
        phone,
        amount: paymentAmount,
        accountReference: `EDU${student.admissionNumber}`,
        transactionDesc: `School fees payment for ${student.admissionNumber}`
      })

      if (mpesaResult.success) {
        await prisma.feeTransaction.update({
          where: { id: transaction.id },
          data: { paymentGatewayRef: mpesaResult.checkoutRequestId }
        })
        return NextResponse.json({
          success: true,
          message: 'STK Push sent to your phone',
          checkoutRequestId: mpesaResult.checkoutRequestId,
          transactionId: transaction.id,
          amount: paymentAmount,
          schoolFee: totalAmount,
          commission: COMMISSION_FEE
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Payment initiation failed',
          error: mpesaResult.message
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      amount: paymentAmount,
      schoolFee: totalAmount,
      commission: COMMISSION_FEE,
      message: 'Transaction created. Use M-Pesa to complete payment.'
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
