import { JWTPayload, SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

const SESSION_COOKIE = 'session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7  days

interface Payload extends JWTPayload {
  userId: string
}

// The JWT is signed (integrity), but NOT encrypted: it only contains the user ID
async function encode(payload: Payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

async function decode(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify<Payload>(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

/** Creates the session cookie that the client sends in every request. */
export async function createSession(payload: Payload) {
  const session = await encode(payload)
  const expires = new Date(Date.now() + SESSION_DURATION_MS)

  // In Next.js 15+ cookies() is asynchronous
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: true,
    expires,
    sameSite: 'lax',
    path: '/',
  })
}

/** Returns the session payload, or null if there is no (valid) session. */
export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)?.value
  const payload = await decode(session)

  if (!session || !payload) {
    return null
  }

  return payload
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
