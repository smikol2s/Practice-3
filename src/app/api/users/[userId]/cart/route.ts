import { NextRequest, NextResponse } from 'next/server'
import { ErrorResponse, getCart, GetCartResponse } from '@/lib/handlers'
import { authorizeUser } from '@/lib/authorization'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
): Promise<NextResponse<GetCartResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params

  const denied = await authorizeUser(params.userId)
  if (denied) return denied

  const cart = await getCart(params.userId)

  if (cart === null) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'User not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json(cart)
}
