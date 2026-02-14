import { Client } from '@notionhq/client'
import { NextResponse } from 'next/server'
import { getPostBySlug } from '@/lib/notion'
export const dynamic = 'force-dynamic'

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    try {
        const post = await getPostBySlug(slug)

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        return NextResponse.json({ content: post.content })
    } catch (error) {
        console.error('Failed to fetch post content:', error)
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }
}
