'use client'

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Comment } from '@/types/post'
import { getBrowserFingerprint } from '@/lib/fingerprint'
import { useModeration } from '@/hooks/use-moderation'
import { useUI } from '@/components/providers/UIProvider'
import { storeCommentToken } from '@/lib/comment-tokens'

export const MAX_MESSAGE_LENGTH = 500

export interface ModerationFeedback {
  type: 'blocked' | 'warning'
  title: string
  message: string
}

const TOXIC_PATTERNS = [
  { re: /fuck/i, label: 'profanity' },
  { re: /shit/i, label: 'profanity' },
  { re: /bitch/i, label: 'profanity' },
  { re: /asshole/i, label: 'profanity' },
  { re: /cunt/i, label: 'profanity' },
  { re: /dick/i, label: 'profanity' },
  { re: /kill yourself/i, label: 'hate speech' },
  { re: /kys/i, label: 'hate speech' },
  { re: /n[i1]gg[ae]/i, label: 'discriminatory language' },
  { re: /f[ae]ggot/i, label: 'discriminatory language' },
  { re: /retard/i, label: 'discriminatory language' },
  { re: /whor[ea]/i, label: 'profanity' },
  { re: /porn/i, label: 'explicit sexual content' },
  { re: /b[eo]ng[ao]d/i, label: 'discriminatory language' },
  { re: /m[a4]d[a4]rch[d4]h?[o0]d/i, label: 'profanity' },
  { re: /b[e3][s$]t[i1]d[i1]/i, label: 'profanity' },
]

export function detectToxicWarning(text: string): string | null {
  for (const { re, label } of TOXIC_PATTERNS) {
    if (re.test(text)) return label
  }
  return null
}

export function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const resize = () => {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
    el.addEventListener('input', resize)
    resize()
    return () => el.removeEventListener('input', resize)
  }, [ref])
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: isBright ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)',
        color: isBright ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.45)',
        fontSize: size * 0.42,
        fontWeight: 600,
      }}
    >
      {initial}
    </div>
  )
}

function FeedbackBanner({ feedback }: { feedback: ModerationFeedback | null }) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div
            className="mt-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed border"
            style={{
              backgroundColor: feedback.type === 'blocked'
                ? (isBright ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.08)')
                : (isBright ? 'rgba(234,179,8,0.06)' : 'rgba(234,179,8,0.08)'),
              borderColor: feedback.type === 'blocked'
                ? (isBright ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.2)')
                : (isBright ? 'rgba(234,179,8,0.15)' : 'rgba(234,179,8,0.2)'),
            }}
          >
            <p
              className="font-semibold mb-0.5"
              style={{
                color: feedback.type === 'blocked'
                  ? (isBright ? '#b91c1c' : '#fca5a5')
                  : (isBright ? '#a16207' : '#fde68a'),
              }}
            >
              {feedback.type === 'blocked' ? '\u2716 Comment blocked' : '\u26A0 Review required'}
            </p>
            <p style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}>
              {feedback.title}
            </p>
            <p style={{ color: isBright ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)' }}>
              {feedback.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export interface SharedComposerProps {
  postSlug: string
  parentId: string | null
  fingerprint: string
  onSuccess?: (comment: Comment) => void
  onCancel?: () => void
  cancelLabel?: string
  placeholder?: string
  autoFocus?: boolean
  compact?: boolean
  /** Edit mode — replaces create with PATCH (author re-moderates their text). */
  mode?: 'create' | 'edit'
  initialValue?: string
  editCommentId?: string
  editToken?: string
  onEdit?: (comment: Comment) => void
}

export interface SharedComposerHandle {
  /** Append text to the draft and focus the field (used by the emoji picker). */
  insertText: (text: string) => void
  focus: () => void
}

export const SharedComposer = forwardRef<SharedComposerHandle, SharedComposerProps>(function SharedComposer(
  {
    postSlug,
    parentId,
    fingerprint,
    onSuccess,
    onCancel,
    cancelLabel,
    placeholder,
    autoFocus,
    compact,
    mode = 'create',
    initialValue = '',
    editCommentId,
    editToken,
    onEdit,
  }: SharedComposerProps,
  ref,
) {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const [name, setName] = useState('')
  const [message, setMessage] = useState(initialValue)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<ModerationFeedback | null>(null)
  const [toxicLabel, setToxicLabel] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const [expanded, setExpanded] = useState(mode === 'edit')
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { checkContent, isChecking } = useModeration()
  useAutoResize(messageRef)

  useImperativeHandle(ref, () => ({
    insertText(text) {
      const el = messageRef.current
      setExpanded(true)
      if (el) {
        el.focus()
        el.value = (el.value ?? '') + text
        el.dispatchEvent(new InputEvent('input', { bubbles: true }))
      }
    },
    focus() {
      setExpanded(true)
      messageRef.current?.focus()
    },
  }))

  useEffect(() => {
    if (autoFocus) {
      setExpanded(true)
      const t = setTimeout(() => messageRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [autoFocus])

  const isEdit = mode === 'edit'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    if (honeypotRef.current?.value) return
    const n = name.trim() || 'Anonymous'
    const m = message.trim()
    if (!m) return
    if (m.length > MAX_MESSAGE_LENGTH) return
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsSubmitting(true)

    try {
      const moderation = await checkContent(m + ' ' + n, { context: isEdit ? 'comment_edit' : 'comment', userId: fingerprint })
      if (!moderation || !moderation.allow) {
        if (moderation?.severity === 'high') {
          setFeedback({
            type: 'blocked',
            title: 'This comment violates community guidelines.',
            message: 'Contains abusive or hateful language. Please revise your comment before posting.',
          })
        } else {
          setFeedback({
            type: 'warning',
            title: 'Potential profanity detected.',
            message: 'Please review your language before posting.',
          })
        }
        setIsSubmitting(false)
        return
      }

      const res = isEdit
        ? await fetch(`/api/comments/${editCommentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: m, editToken }),
            signal: controller.signal,
          })
        : await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postSlug,
              name: n,
              message: m,
              parentId,
              fingerprint,
              metrics: {
                startTime: Date.now(),
                typingTime: 0,
                charCount: m.length,
                backspaceCount: 0,
                pasteCount: 0,
                mouseEvents: 0,
                focusEvents: 0,
                interactions: 0,
              },
            }),
            signal: controller.signal,
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      if (data.status === 'discarded') {
        setFeedback({
          type: 'blocked',
          title: 'This edit violates community guidelines.',
          message: 'Our moderation system detected content that cannot be published. Please revise.',
        })
        setIsSubmitting(false)
        return
      }

      if (isEdit) {
        if (data.status === 'shadow_banned') {
          setFeedback({
            type: 'warning',
            title: 'Edit saved but hidden.',
            message: 'Our moderation flagged this edit — it is only visible to you.',
          })
          setIsSubmitting(false)
          return
        }
        onEdit?.(data)
        onCancel?.()
        return
      }

      setPosted(true)
      setTimeout(() => setPosted(false), 2000)

      if (data.edit_token) {
        storeCommentToken(data.id, data.edit_token)
      }

      if (data.status !== 'shadow_banned') {
        onSuccess?.(data)
      }
      setName('')
      setMessage('')
      setToxicLabel(null)
      setExpanded(false)
      onCancel?.()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setFeedback({
        type: 'warning',
        title: 'Unable to post.',
        message: err instanceof Error ? err.message : 'Connection issue. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasContent = message.trim().length > 0
  const isReply = !!parentId && !isEdit

  return (
    <motion.form
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      <input ref={honeypotRef} type="text" name="website_url_honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <div className="flex gap-2.5">
        <Avatar name={isEdit ? '?' : name || '?'} size={isReply ? 24 : compact ? 28 : 28} />
        <div className="flex-1 min-w-0">
          {expanded && !isEdit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <input
                ref={nameRef}
                type="text"
                placeholder="Anonymous"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                disabled={isSubmitting || isChecking}
                className="bg-transparent text-[11px] font-medium outline-none placeholder-gray-600 disabled:opacity-50 w-24 mb-1"
                style={{ color: isBright ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)' }}
              />
            </motion.div>
          )}
          <div className="relative">
            {!expanded && !autoFocus ? (
              <div
                onClick={() => {
                  setExpanded(true)
                  setTimeout(() => messageRef.current?.focus(), 50)
                }}
                className="cursor-text text-sm py-1"
                style={{ color: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)' }}
              >
                {placeholder ?? 'Share your thoughts...'}
              </div>
            ) : (
              <>
                <textarea
                  ref={messageRef}
                  placeholder={placeholder ?? 'Share your thoughts...'}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setToxicLabel(detectToxicWarning(e.target.value))
                    if (feedback) setFeedback(null)
                  }}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={1}
                  disabled={isSubmitting || isChecking}
                  onFocus={() => setExpanded(true)}
                  className="w-full bg-transparent text-sm outline-none resize-none placeholder-gray-600 disabled:opacity-50"
                  style={{ color: 'var(--foreground)', lineHeight: 1.6 }}
                />
                {expanded && hasContent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between mt-1 pt-1.5 border-t"
                    style={{ borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-[10px]" style={{ color: isBright ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)' }}>
                      {message.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                    <div className="flex items-center gap-2">
                      {onCancel && (
                        <button
                          type="button"
                          onClick={onCancel}
                          disabled={isSubmitting}
                          className="text-[11px] font-medium transition-colors hover:opacity-70 disabled:opacity-30"
                          style={{ color: isBright ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.35)' }}
                        >
                          {cancelLabel ?? (isEdit ? 'Cancel' : 'Cancel')}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || isChecking || !message.trim()}
                        className="text-[11px] font-semibold transition-colors hover:opacity-80 disabled:opacity-30"
                        style={{ color: 'var(--accent, rgb(34,211,238))' }}
                      >
                        {isSubmitting || isChecking ? 'Verifying...' : posted ? 'Posted' : (isEdit ? 'Save' : (parentId ? 'Reply' : 'Post'))}
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {toxicLabel && !feedback && (
            <p className="text-[11px] mt-1" style={{ color: isBright ? 'rgba(234,179,8,0.7)' : 'rgba(250,204,21,0.6)' }}>
              {'\u26A0'} Potentially inappropriate language detected
            </p>
          )}

          <FeedbackBanner feedback={feedback} />
        </div>
      </div>
    </motion.form>
  )
})
