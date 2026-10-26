import { NextRequest, NextResponse } from 'next/server'
import { createUser, CreateUserResponse, ErrorResponse } from '@/lib/handlers'

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateUserResponse> | NextResponse<ErrorResponse>> {
  const invalid = (message: string) =>
    NextResponse.json({ error: 'WRONG_REQUEST', message }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return invalid('The request body is not valid JSON.')
  }

  if (
    body === null ||
    typeof body !== 'object' ||
    !isNonEmptyString(body.email) ||
    !isNonEmptyString(body.password) ||
    !isNonEmptyString(body.name) ||
    !isNonEmptyString(body.surname) ||
    !isNonEmptyString(body.address) ||
    !isNonEmptyString(body.birthdate)
  ) {
    return invalid('The request body is invalid or incomplete.')
  }

  if (Number.isNaN(new Date(body.birthdate).getTime())) {
    return invalid('Invalid birthdate.')
  }

  const res = await createUser({
    email: body.email,
    password: body.password,
    name: body.name,
    surname: body.surname,
    address: body.address,
    birthdate: body.birthdate,
  })

  if (res === null) {
    return invalid('A user with this e-mail address already exists.')
  }

  return NextResponse.json(res, {
    status: 201,
    headers: { Location: `/api/users/${res._id}` },
  })
}
