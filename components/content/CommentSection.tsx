'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Comment } from '@/types/post'
import { getBrowserFingerprint } from '@/lib/fingerprint'
import { ThreadedDiscussion } from './discussion/ThreadedDiscussion'

interface CommentSectionProps {
  postSlug: string
  initialComments: Comment[]
  autoFocus?: boolean
}

/**
 * CommentSection — article-page wrapper around the shared ThreadedDiscussion.
 * Keeps the `#comments` deep-link behaviour for the /post/[slug] page.
 */
export function CommentSection({ postSlug, initialComments, autoFocus }: CommentSectionProps): React.ReactNode {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [fingerprint, setFingerprint] = useState('')
  const isMounted = useRef(true)
  const sectionRef = useRef<HTMLElement>(null)
  const topComposerAutoFocused = useRef(false)

  useEffect(() => {
    isMounted.current = true
    getBrowserFingerprint().then((fp) => {
      if (isMounted.current) setFingerprint(fp)
    }).catch(() => {})
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const shouldFocus = autoFocus || (typeof window !== 'undefined' && window.location.hash === '#comments')
    if (shouldFocus && sectionRef.current && !topComposerAutoFocused.current) {
      topComposerAutoFocused.current = true
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
  }, [autoFocus])

  const handleCommentAdded = useCallback((c: Comment) => {
    setComments((prev) => [c, ...prev])
  }, [])

  const handleCommentUpdated = useCallback((c: Comment) => {
    setComments((prev) => prev.map((x) => (x.id === c.id ? c : x)))
  }, [])

  const handleCommentDeleted = useCallback((c: Comment) => {
    setComments((prev) =>
      prev.map((x) =>
        x.id === c.id ? { ...x, deleted_at: new Date().toISOString(), message: '' } : x,
      ),
    )
  }, [])

  return (
    <section ref={sectionRef} id="comments">
      <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Comments</h2>
      <ThreadedDiscussion
        postSlug={postSlug}
        comments={comments}
        fingerprint={fingerprint}
        onCommentAdded={handleCommentAdded}
        onCommentUpdated={handleCommentUpdated}
        onCommentDeleted={handleCommentDeleted}
        topComposer
        autoFocusTop={autoFocus}
      />
    </section>
  )
}
