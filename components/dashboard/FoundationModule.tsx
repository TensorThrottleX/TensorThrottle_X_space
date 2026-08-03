'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DASHBOARD_CONTENT, KNOWLEDGE_TREE } from '@/lib/dashboard-data'
import { StackedDeck } from './StackedDeck'
import { QuoteCard } from './QuoteCard'
import { RotatingNarrative } from './RotatingNarrative'
import { InteractiveTreeView } from '@/components/visuals/InteractiveTreeView'

type Tab = 'purpose' | 'about' | 'quote'

export interface FoundationModuleProps {
  isBright: boolean
}

const TABS: Tab[] = ['purpose', 'about', 'quote']
const TAB_W = 82
const GAP = 2

export function FoundationModule({ isBright }: FoundationModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>('purpose')
  const tabIndex = TABS.indexOf(activeTab)

  // Tree state — persists per tab so switching tabs preserves expansion
  const [treeOpen, setTreeOpen] = useState(false)
  const [purposeExpanded, setPurposeExpanded] = useState<Set<string>>(new Set())
  const [aboutExpanded, setAboutExpanded] = useState<Set<string>>(new Set())

  const handleInitialize = useCallback(() => setTreeOpen(true), [])
  const handleCloseTree = useCallback(() => setTreeOpen(false), [])
  const handleResetTree = useCallback(() => {
    setPurposeExpanded(new Set())
    setAboutExpanded(new Set())
  }, [])

  const handleToggleNode = useCallback((id: string) => {
    const setter = activeTab === 'purpose' ? setPurposeExpanded : setAboutExpanded
    setter((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [activeTab])

  const currentExpanded = activeTab === 'purpose' ? purposeExpanded : aboutExpanded
  const activeTreeData = DASHBOARD_CONTENT[activeTab as 'purpose' | 'about']?.treeData || KNOWLEDGE_TREE

  return (
    <div className="relative">
      {/* ── Segmented toggle — overlaps card top edge by ~50% ── */}
      <div className="relative z-20 flex justify-center" style={{ marginBottom: '-21px' }}>
        <div
          className="relative flex items-center rounded-full p-[3px] gap-[2px] backdrop-blur-xl transition-colors duration-500"
          style={{
            backgroundColor: 'var(--adaptive-glass-bg)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--adaptive-glass-border)',
            boxShadow: 'var(--adaptive-glass-shadow)',
          }}
        >
          <motion.div
            className="absolute h-[calc(100%-6px)] rounded-full"
            initial={false}
            animate={{ x: tabIndex * (TAB_W + GAP) }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ left: 3, top: 3, width: TAB_W, backgroundColor: 'var(--adaptive-hero-color)', opacity: 0.08 }}
          />
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative w-[82px] h-[30px] text-[10.5px] font-medium tracking-[0.1em] transition-all duration-300 rounded-full flex items-center justify-center capitalize"
              style={{
                color: 'var(--adaptive-hero-color)',
                opacity: activeTab === tab ? 1 : 0.35,
              }}
              onMouseEnter={(e) => { if (activeTab !== tab) e.currentTarget.style.opacity = '0.55' }}
              onMouseLeave={(e) => { if (activeTab !== tab) e.currentTarget.style.opacity = '0.35' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'purpose' && (
            <motion.div
              key="purpose"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <StackedDeck
                mode="purpose"
                content={DASHBOARD_CONTENT.purpose}
                isBright={isBright}
                onInitialize={handleInitialize}
              />
            </motion.div>
          )}
          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <RotatingNarrative isBright={isBright} onInitialize={handleInitialize} />
            </motion.div>
          )}
          {activeTab === 'quote' && (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <QuoteCard isBright={isBright} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Knowledge Tree Overlay ── */}
      <AnimatePresence>
        {treeOpen && (
          <InteractiveTreeView
            data={activeTreeData}
            expandedIds={currentExpanded}
            onToggle={handleToggleNode}
            onClose={handleCloseTree}
            onReset={handleResetTree}
            isBright={isBright}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
