import { deleteSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(): Promise<NextResponse<null>> {
  // The session cookie is removed
  await deleteSession()
  return new NextResponse(null, { status: 204 })
}
