import axios from 'axios'

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || 'your-consumer-key'
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || 'your-consumer-secret'
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '174379'
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || 'your-passkey'
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback'
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'

const MPESA_BASE_URL = MPESA_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke'

async function getMpesaAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64')
  
  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` }
    }
  )
  
  return response.data.access_token
}

function generateMpesaPassword(): string {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14)
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
  return password
}

export interface MpesaPaymentRequest {
  phone: string
  amount: number
  accountReference: string
  transactionDesc?: string
}

export interface MpesaPaymentResponse {
  success: boolean
  message?: string
  checkoutRequestId?: string
  errorCode?: string
}

export async function initiateMpesaPayment(request: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
  try {
    const token = await getMpesaAccessToken()
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14)
    
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: generateMpesaPassword(),
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(request.amount),
        PartyA: request.phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: request.phone,
        CallBackURL: MPESA_CALLBACK_URL,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc || 'EduTrack Payment'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    
    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      message: 'STK Push sent successfully'
    }
  } catch (error: any) {
    console.error('M-Pesa payment error:', error.response?.data || error.message)
    return {
      success: false,
      errorCode: error.response?.data?.errorCode,
      message: error.response?.data?.errorMessage || 'Payment failed'
    }
  }
}

export function verifyMpesaCallback(callbackData: any): boolean {
  return callbackData.Body?.stkCallback?.ResultCode === 0
}

export function extractMpesaTransactionData(callbackData: any) {
  const callback = callbackData.Body?.stkCallback
  return {
    checkoutRequestId: callback?.CheckoutRequestID,
    merchantRequestId: callback?.MerchantRequestID,
    resultCode: callback?.ResultCode,
    resultDesc: callback?.ResultDesc,
    amount: callback?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'Amount')?.Value,
    receiptNumber: callback?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value,
    phoneNumber: callback?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'PhoneNumber')?.Value
  }
}
