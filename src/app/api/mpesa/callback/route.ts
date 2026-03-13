import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyMpesaCallback, extractMpesaTransactionData } from '@/lib/mpesa'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('M-Pesa callback received:', body)

    if (!verifyMpesaCallback(body)) {
      return NextResponse.json({ message: 'Payment verification failed' }, { status: 400 })
    }

    const data = extractMpesaTransactionData(body)
    console.log('Transaction data:', data)

    if (data.checkoutRequestId) {
      const transaction = await prisma.feeTransaction.findFirst({
        where: { paymentGatewayRef: data.checkoutRequestId }
      })

      if (transaction) {
        await prisma.feeTransaction.update({
          where: { id: transaction.id },
          data: {
            paymentStatus: 'completed',
            mpesaReceiptNumber: data.receiptNumber,
            amountPaid: data.amount || transaction.amountPaid,
            balanceRemaining: Math.max(0, transaction.schoolFeeAmount - (data.amount || 0) + transaction.commissionFee)
          }
        })

        return NextResponse.json({ message: 'Payment processed successfully' })
      }
    }

    return NextResponse.json({ message: 'Transaction not found' }, { status: 404 })
  } catch (error: any) {
    console.error('M-Pesa callback error:', error)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}
