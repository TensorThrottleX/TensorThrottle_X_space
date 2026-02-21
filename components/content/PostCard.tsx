import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types/post'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'

export function PostCard({ post }: { post: Post }) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'

  return (
    <Link href={`/post/${post.slug}`} className="block w-full">
      <article className={cn(
        "group relative w-full overflow-hidden border rounded-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 shadow-[var(--shadow-main)]",
        isBright
          ? "bg-[#fafafa] border-black/5 hover:border-black/10"
          : "bg-[var(--card-bg)] border-white/10 hover:border-white/20"
      )}>

        {/* Header - Instagram Style */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3 border-b backdrop-blur-sm",
          isBright ? "bg-white/50 border-black/5" : "bg-[var(--card-bg)]/50 border-white/5"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
              <div className={cn(
                "w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold",
                isBright ? "bg-white text-black" : "bg-black text-white"
              )}>
                TX
              </div>
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-sm font-semibold leading-none",
                isBright ? "text-black" : "text-white"
              )}>TensorThrottleX</span>
              <span className="text-[10px] text-gray-500 font-mono mt-0.5">{post.category}</span>
            </div>
          </div>
          <time className="text-[10px] text-gray-500 font-mono tracking-wider">
            {formatDate(post.publishedAt)}
          </time>
        </div>

        {/* Media Content - Vertical / 4:5 Aspect Ratio */}
        <div className={cn(
          "relative aspect-[4/5] w-full overflow-hidden",
          isBright ? "bg-gray-100" : "bg-zinc-900"
        )}>
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className={cn(
              "flex h-full w-full items-center justify-center bg-gradient-to-br text-opacity-30",
              isBright ? "from-gray-100 to-gray-200 text-black" : "from-zinc-900 to-zinc-800 text-zinc-700"
            )}>
              <span className="font-mono text-xs uppercase tracking-widest">[NO VISUAL]</span>
            </div>
          )}

          {/* Overlay Gradient on Hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300",
            isBright ? "from-black/10" : "from-black/80"
          )} />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className={cn(
            "flex gap-4",
            isBright ? "text-black/70" : "text-white"
          )}>
            <button className="hover:text-pink-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </button>
            <button className="hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </button>
            <button className="hover:text-green-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </button>
          </div>
          <button className={cn(
            "hover:text-yellow-500 transition-colors",
            isBright ? "text-black/70" : "text-white"
          )}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
          </button>
        </div>

        {/* Content Footer */}
        <div className="px-4 pb-4">
          <h3 className={cn(
            "text-sm font-bold mb-1 group-hover:text-cyan-600 transition-colors",
            isBright ? "text-black" : "text-white"
          )}>
            {post.title}
          </h3>
          <p className={cn(
            "text-xs line-clamp-2 leading-relaxed",
            isBright ? "text-gray-600" : "text-gray-400"
          )}>
            {post.excerpt}
          </p>
        </div>
      </article>
    </Link>
  )
}
