'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Comment } from '@/types/post'
import { getBrowserFingerprint } from '@/lib/fingerprint' // Ensure you create this file or adapt
import { useModeration } from '@/hooks/use-moderation'
import { cn } from "@/lib/utils"

interface CommentSectionProps {
  postSlug: string
  initialComments: Comment[]
}

const MAX_MESSAGE_LENGTH = 500
const COMMENT_TIMEOUT_MS = 30_000
const TOXIC_PATTERNS = [/fuck/i, /shit/i, /bitch/i, /asshole/i, /cunt/i, /dick/i, /kill yourself/i, /kys/i]

export function CommentSection({ postSlug, initialComments }: CommentSectionProps): React.ReactNode {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fingerprint, setFingerprint] = useState<string>('')

  // Real-time Moderation State
  const [toxicWarning, setToxicWarning] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Behavior Metrics
  const metrics = useRef({
    startTime: 0,
    typingTime: 0, // Time between first and last keypress
    charCount: 0,
    backspaceCount: 0,
    pasteCount: 0,
    mouseEvents: 0,
    focusEvents: 0,
    interactions: 0
  })

  // State to track message length reactively
  const [messageLength, setMessageLength] = useState(0)

  useEffect(() => {
    isMountedRef.current = true
    
    // Generate fingerprint on mount (async)
    getBrowserFingerprint().then(fp => {
      if (isMountedRef.current) setFingerprint(fp)
    }).catch(console.error)

    // Reset metrics on mount
    metrics.current = {
      startTime: Date.now(),
      typingTime: 0,
      charCount: 0,
      backspaceCount: 0,
      pasteCount: 0,
      mouseEvents: 0,
      focusEvents: 0,
      interactions: 0
    }

    return () => {
      isMountedRef.current = false
      // Abort any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleInteraction = () => {
    metrics.current.interactions++
    metrics.current.mouseEvents++
  }

  const handleFocus = () => {
    metrics.current.focusEvents++
    metrics.current.interactions++
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (metrics.current.charCount === 0) {
      metrics.current.startTime = Date.now()
    }
    metrics.current.charCount++
    if (e.key === 'Backspace') metrics.current.backspaceCount++

    // Live text check
    const currentVal = messageRef.current?.value || ''
    const hasToxic = TOXIC_PATTERNS.some(p => p.test(currentVal))
    if (hasToxic) {
      setToxicWarning("Let's keep the conversation respectful.")
    } else {
      setToxicWarning(null)
    }
  }

  const handlePaste = () => {
    metrics.current.pasteCount++
  }

  const { checkContent, isChecking } = useModeration()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setToxicWarning(null)

    // 1. Client-Side Honeypot Check
    if (honeypotRef.current?.value) {
      console.log("Bot detected (honeypot)")
      return // Silent reject
    }

    const name = nameRef.current?.value.trim()
    const message = messageRef.current?.value.trim()

    // 2. Basic Validation
    if (!name) return setError('Name is required')
    if (!message) return setError('Message is required')
    if (message.length > MAX_MESSAGE_LENGTH) return setError(`Message too long`)

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), COMMENT_TIMEOUT_MS)

    // 3. ML-Based Toxicity Check (Server-Side)
    setIsSubmitting(true)

    try {
      const moderation = await checkContent(message + " " + name, { context: 'comment', userId: fingerprint }); // Check both

      // Check if unmounted during moderation
      if (!isMountedRef.current) return;

      if (!moderation) {
        throw new Error('Moderation check failed. Please try again.');
      }

      if (!moderation.allow) {
        // Block submission based on severity
        if (moderation.severity === 'high') {
          setError("Severe or offensive language is not allowed.");
        } else {
          setError("Your message contains abusive language. Please revise.");
        }
        setIsSubmitting(false);
        return;
      }

      // Calculate final metrics
      const endTime = Date.now()
      const typingDuration = endTime - metrics.current.startTime

      const payload = {
        postSlug,
        name,
        message,
        fingerprint,
        metrics: {
          ...metrics.current,
          typingTime: typingDuration,
          finalCharCount: message.length
        }
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Check if unmounted during fetch
      if (!isMountedRef.current) return;

      const data = await response.json()

      if (!response.ok) {
        // If server returns error, show it
        throw new Error(data.error || 'Failed to post comment')
      }

      // 4. Handle Success logic (including Shadow Bans)
      if (data.status === 'shadow_banned') {
        // Fake success for the user
        setSuccess(true)
      } else {
        // Real success
        setComments((prev) => [data, ...prev])
        setSuccess(true)
      }

      // Reset form
      if (nameRef.current) nameRef.current.value = ''
      if (messageRef.current) {
        messageRef.current.value = ''
        setMessageLength(0)
      }

      // Reset metrics
      metrics.current = {
        startTime: Date.now(),
        typingTime: 0,
        charCount: 0,
        backspaceCount: 0,
        pasteCount: 0,
        mouseEvents: 0,
        focusEvents: 0,
        interactions: 0
      }

      setTimeout(() => {
        if (isMountedRef.current) setSuccess(false)
      }, 3000)
    } catch (err) {
      clearTimeout(timeoutId)
      // Don't show error for intentional aborts
      if (err instanceof Error && err.name === 'AbortError') {
        if (isMountedRef.current) {
          setError('Request timed out. Please try again.')
        }
        return;
      }
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Comments temporarily unavailable.')
      }
    } finally {
      clearTimeout(timeoutId)
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <section
      className="space-y-6"
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Comments</h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border p-6 relative overflow-hidden transition-colors duration-500"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
      >

        {/* Honeypot Field (Hidden) */}
        <input
          ref={honeypotRef}
          type="text"
          name="website_url_honeypot"
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Name</label>
          <input
            ref={nameRef}
            type="text"
            placeholder="Your name"
            maxLength={50}
            disabled={isSubmitting || isChecking}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="mt-1 w-full rounded-lg border px-4 py-2 text-sm placeholder-gray-500 focus:outline-none disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: 'var(--input)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <div>
          {/* Note: Char count logic remains as is, visual only update */}
          <label className="flex justify-between text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
            <span>Message</span>
            <span className={cn(
              "text-[10px] font-bold tracking-widest transition-colors duration-300",
              messageLength > MAX_MESSAGE_LENGTH * 0.9 ? "text-red-400" :
                messageLength > MAX_MESSAGE_LENGTH * 0.7 ? "text-yellow-400" :
                  "text-white/30"
            )}>
              {messageLength} / {MAX_MESSAGE_LENGTH}
            </span>
          </label>
          <textarea
            ref={messageRef}
            placeholder="Share your thoughts..."
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            disabled={isSubmitting || isChecking}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setMessageLength(e.target.value.length)
              // Keep original live check
              const currentVal = e.target.value
              const hasToxic = TOXIC_PATTERNS.some(p => p.test(currentVal))
              if (hasToxic) setToxicWarning("Let's keep the conversation respectful.")
              else setToxicWarning(null)
            }}
            onPaste={handlePaste}
            className="mt-1 w-full rounded-lg border px-4 py-2 text-sm placeholder-gray-500 focus:outline-none disabled:opacity-50 resize-none transition-colors"
            style={{
              backgroundColor: 'var(--input)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        {toxicWarning && <p className="text-sm text-yellow-500 animate-pulse">{toxicWarning}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">Comment posted successfully!</p>}

        <button
          type="submit"
          disabled={isSubmitting || isChecking || !!toxicWarning}
          className="rounded-lg border px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          style={{
            backgroundColor: 'var(--secondary)',
            borderColor: 'var(--border)',
            color: 'var(--secondary-foreground)'
          }}
        >
          {isSubmitting || isChecking ? 'Verifying...' : 'Post Comment'}
        </button>
      </form>

      {/* Constraints Info */}
      <div className="text-xs flex gap-4 mt-2" style={{ color: 'var(--muted-foreground)' }}>
        <span>Anonymous</span>
        <span>Moderated</span>
        <span>No Login</span>
      </div>

      {/* Comments List */}
      <div className="space-y-4 mt-8">
        {comments.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}
              className="rounded-lg border p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 transition-colors"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{comment.name}</span>
                <time className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </time>
              </div>
              <p className="break-words text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{comment.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
