import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import {
  deleteCartItem,
  ErrorResponse,
  GetCartResponse,
  NOT_FOUND_MESSAGES,
  NotFound,
  putCartItem,
} from '@/lib/handlers'
import { authorizeUser } from '@/lib/authorization'

type Params = { params: Promise<{ userId: string; productId: string }> }

// The user ID is checked by authorizeUser(); only the product ID is left here
function validateProductId({ productId }: Awaited<Params['params']>) {
  if (!Types.ObjectId.isValid(productId)) {
    return NextResponse.json(
      { error: 'WRONG_PARAM', message: 'Invalid product ID.' },
      { status: 400 }
    )
  }
  return null
}

const notFound = (reason: NotFound) =>
  NextResponse.json(
    { error: reason, message: NOT_FOUND_MESSAGES[reason] },
    { status: 404 }
  )

export async function PUT(
  request: NextRequest,
  props: Params
): Promise<NextResponse<GetCartResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params

  const denied = await authorizeUser(params.userId)
  if (denied) return denied

  const idError = validateProductId(params)
  if (idError) return idError

  let body: { qty?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        error: 'WRONG_REQUEST',
        message: 'The request body is not valid JSON.',
      },
      { status: 400 }
    )
  }

  const qty = body?.qty
  if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
    return NextResponse.json(
      {
        error: 'WRONG_REQUEST',
        message: 'qty must be an integer greater than or equal to 1.',
      },
      { status: 400 }
    )
  }

  const res = await putCartItem(params.userId, params.productId, qty)
  if (typeof res === 'string') return notFound(res)

  const { created, ...cart } = res

  if (created) {
    return NextResponse.json(cart, {
      status: 201,
      headers: {
        Location: `/api/users/${params.userId}/cart/${params.productId}`,
      },
    })
  }

  return NextResponse.json(cart, { status: 200 })
}

export async function DELETE(
  request: NextRequest,
  props: Params
): Promise<NextResponse<GetCartResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params

  const denied = await authorizeUser(params.userId)
  if (denied) return denied

  const idError = validateProductId(params)
  if (idError) return idError

  const cart = await deleteCartItem(params.userId, params.productId)
  if (typeof cart === 'string') return notFound(cart)

  return NextResponse.json(cart, { status: 200 })
}
