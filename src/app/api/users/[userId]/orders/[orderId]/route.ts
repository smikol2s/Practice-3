import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import {
  ErrorResponse,
  getOrder,
  GetOrderResponse,
  NOT_FOUND_MESSAGES,
} from '@/lib/handlers'
import { authorizeUser } from '@/lib/authorization'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string; orderId: string }> }
): Promise<NextResponse<GetOrderResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params
  const denied = await authorizeUser(params.userId)
  if (denied) return denied
  if (!Types.ObjectId.isValid(params.orderId)) {
    return NextResponse.json(
      { error: 'WRONG_PARAM', message: 'Invalid order ID.' },
      { status: 400 }
    )
  }

  const order = await getOrder(params.userId, params.orderId)

  if (typeof order === 'string') {
    return NextResponse.json(
      { error: order, message: NOT_FOUND_MESSAGES[order] },
      { status: 404 }
    )
  }

  return NextResponse.json(order)
}
