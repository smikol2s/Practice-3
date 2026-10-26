import { Types } from 'mongoose'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { ErrorResponse } from '@/lib/handlers'

/**
 * Common checks for every endpoint under /api/users/[userId]/...
 *
 *   401 NOT_AUTHENTICATED -> no valid session cookie (user not signed in)
 *   400 WRONG_PARAM       -> the userId of the URL is not a valid ObjectId
 *   403 NOT_AUTHORIZED    -> signed in, but as a different user
 *
 * Returns an error response if the request must be rejected, or null if the
 * signed-in user is allowed to access the resources of `userId`.
 */
export async function authorizeUser(
  userId: string
): Promise<NextResponse<ErrorResponse> | null> {
  const session = await getSession()
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'NOT_AUTHENTICATED', message: 'Authentication required.' },
      { status: 401 }
    )
  }

  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json(
      { error: 'WRONG_PARAM', message: 'Invalid user ID.' },
      { status: 400 }
    )
  }

  if (session.userId.toString() !== userId) {
    return NextResponse.json(
      { error: 'NOT_AUTHORIZED', message: 'Unauthorized access.' },
      { status: 403 }
    )
  }

  return null
}
