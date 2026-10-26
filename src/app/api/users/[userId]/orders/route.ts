import { NextRequest, NextResponse } from 'next/server'
import {
  createOrder,
  CreateOrderResponse,
  ErrorResponse,
  getOrders,
  GetOrdersResponse,
  NOT_FOUND_MESSAGES,
} from '@/lib/handlers'
import { authorizeUser } from '@/lib/authorization'

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
): Promise<NextResponse<GetOrdersResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params
  const denied = await authorizeUser(params.userId)
  if (denied) return denied

  const res = await getOrders(params.userId)

  if (res === null) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'User not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json(res)
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
): Promise<NextResponse<CreateOrderResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params
  const invalid = (message: string) =>
    NextResponse.json({ error: 'WRONG_REQUEST', message }, { status: 400 })

  const denied = await authorizeUser(params.userId)
  if (denied) return denied

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return invalid('The request body is not valid JSON.')
  }

  if (
    body === null ||
    typeof body !== 'object' ||
    !isNonEmptyString(body.address) ||
    !isNonEmptyString(body.cardHolder) ||
    !isNonEmptyString(body.cardNumber)
  ) {
    return invalid('The request body is invalid or incomplete.')
  }

  const res = await createOrder(params.userId, {
    address: body.address,
    cardHolder: body.cardHolder,
    cardNumber: body.cardNumber,
  })

  if (res === 'EMPTY_CART') {
    return invalid('The cart is empty.')
  }

  if (typeof res === 'string') {
    return NextResponse.json(
      { error: res, message: NOT_FOUND_MESSAGES[res] },
      { status: 404 }
    )
  }

  return NextResponse.json(res, {
    status: 201,
    headers: { Location: `/api/users/${params.userId}/orders/${res._id}` },
  })
}
