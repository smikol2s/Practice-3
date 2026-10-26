import { NextRequest, NextResponse } from 'next/server'
import { ErrorResponse, getUser, GetUserResponse } from '@/lib/handlers'
import { authorizeUser } from '@/lib/authorization'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
): Promise<NextResponse<GetUserResponse> | NextResponse<ErrorResponse>> {
  const params = await props.params

  // 401 not signed in, 400 invalid ID, 403 signed in as another user
  const denied = await authorizeUser(params.userId)
  if (denied) return denied

  const user = await getUser(params.userId)

  if (user === null) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'User not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}
