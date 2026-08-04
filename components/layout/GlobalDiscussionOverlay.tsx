'use client'

import React from 'react'
import { useDiscussion } from '@/components/providers/DiscussionProvider'
import { DiscussionPanel } from '@/components/content/DiscussionPanel'

/**
 * Connects the global DiscussionStore to the UI panel.
 * Ensures only ONE panel instance exists across the entire app.
 */
export function GlobalDiscussionOverlay() {
  const { isOpen, mode, selectedPost, focusedCommentId, closePanel, incrementCount } = useDiscussion()

  // In 'global' mode, we won't have a selectedPost yet. 
  // The panel will be updated to handle this global state.
  const slug = selectedPost?.slug || 'global'
  const title = selectedPost?.title || 'Platform Discussions'

  return (
    <DiscussionPanel 
      postSlug={slug}
      postTitle={title}
      open={isOpen}
      onClose={closePanel}
      post={selectedPost || undefined}
      focusedCommentId={focusedCommentId}
      onCommentAdded={() => {
        if (selectedPost) {
          incrementCount(selectedPost.slug)
        }
      }}
    />
  )
}
