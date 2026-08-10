import { NextResponse } from 'next/server'
import registry from '@/features/anime-universe/assets/registry.json'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET() {
  return NextResponse.json(registry, { headers: NO_STORE })
}
