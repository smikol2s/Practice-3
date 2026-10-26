import { NextRequest, NextResponse } from 'next/server'
import {
  ErrorResponse,
  checkCredentials,
  CheckCredentialsResponse,
} from '@/lib/handlers'
import { createSession } from '@/lib/auth'

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<CheckCredentialsResponse> | NextResponse<ErrorResponse>
> {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  // Only strings are accepted (prevents NoSQL injection such as {"$ne": null})
  if (
    typeof body?.email !== 'string' ||
    typeof body?.password !== 'string' ||
    !body.email ||
    !body.password
  ) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Request parameters are wrong or missing.',
      },
      { status: 400 }
    )
  }

  const userId = await checkCredentials(body.email, body.password)

  if (userId === null) {
    return NextResponse.json(
      {
        error: 'WRONG_CREDENTIALS',
        message: 'Wrong e-mail address or password.',
      },
      { status: 400 }
    )
  }

  // Upon success, the session cookie is created and sent back to the client
  await createSession({ userId: userId._id.toString() })

  return NextResponse.json(userId, { status: 200 })
}
