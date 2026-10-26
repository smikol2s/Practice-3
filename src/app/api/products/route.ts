import { NextResponse } from 'next/server'
import { getProducts, GetProductsResponse } from '@/lib/handlers'

// The product list comes from the DB, so it must not be cached at build time.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse<GetProductsResponse>> {
  const res = await getProducts()
  return NextResponse.json(res)
}
