'use client'

import React, { useState } from 'react'
import type { TelemetrySnapshot } from '@/lib/media/runtime/Telemetry'
import type { RenderStrategy } from '@/lib/media/strategy/RenderStrategy'

interface TelemetryPanelProps {
  snapshot: TelemetrySnapshot
}

export function TelemetryPanel({ snapshot }: TelemetryPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'reports' | 'history'>('overview')

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
          background: 'rgba(0,0,0,0.8)', color: '#0f0',
          border: '1px solid #0f0', borderRadius: 4, padding: '4px 8px',
          fontSize: 11, fontFamily: 'monospace', cursor: 'pointer',
        }}
      >
        📊 {snapshot.currentStrategy?.strategyName || 'no-strategy'} | {snapshot.averageFps}fps
      </button>
    )
  }

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '4px 10px', cursor: 'pointer', fontSize: 11,
    fontFamily: 'monospace', border: 'none', background: activeTab === tab ? '#0f0' : 'transparent',
    color: activeTab === tab ? '#000' : '#0f0', fontWeight: activeTab === tab ? 700 : 400,
  })

  return (
    <div
      style={{
        position: 'fixed', bottom: 8, right: 8, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)', color: '#0f0',
        border: '1px solid #0f0', borderRadius: 6, padding: 8,
        fontSize: 11, fontFamily: 'monospace', maxWidth: 440,
        maxHeight: '60vh', overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 700 }}>UAVRE Telemetry</span>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: 'none', border: 'none', color: '#0f0', cursor: 'pointer', fontSize: 13 }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {(['overview', 'strategy', 'reports', 'history'] as const).map(tab => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab snapshot={snapshot} />}
      {activeTab === 'strategy' && <StrategyTab strategy={snapshot.currentStrategy} />}
      {activeTab === 'reports' && <ReportsTab snapshot={snapshot} />}
      {activeTab === 'history' && <HistoryTab strategies={snapshot.strategyHistory} />}
    </div>
  )
}

function OverviewTab({ snapshot }: { snapshot: TelemetrySnapshot }) {
  const s = snapshot.currentStrategy
  return (
    <div>
      <Line label="FPS" value={`${snapshot.averageFps}`} />
      <Line label="Dropped" value={`${snapshot.totalDroppedFrames}/${snapshot.totalFramesRendered}`} />
      <Line label="Jank" value={s ? (s.decisionLog.find(l => l.step === 'quality' && l.decision.includes('perf'))?.reason || 'N/A') : 'N/A'} />
      <Line label="Quality" value={s?.qualityProfile || 'N/A'} />
      <Line label="Render Cost" value={s ? `${(s.renderCost * 100).toFixed(0)}%` : 'N/A'} />
      <Line label="Object Fit" value={s?.objectFit || 'N/A'} />
      <Line label="Object Pos" value={s?.objectPosition || 'N/A'} />
      <Line label="Rotation" value={s ? `${s.rotation}°` : '0°'} />
      <Line label="Scale" value={s ? `${(s.scale * 100).toFixed(0)}%` : '100%'} />
      <Line label="Filter" value={s?.filterString || 'none'} />
      <Line label="Strategy" value={s?.strategyName || 'N/A'} />
      <Line label="Confidence" value={s ? `${(s.confidence * 100).toFixed(0)}%` : 'N/A'} />
      <Line label="Session" value={`${(snapshot.sessionDuration / 1000).toFixed(0)}s`} />
      <Line label="Recomputes" value={`${snapshot.recomputeCount}`} />
    </div>
  )
}

function StrategyTab({ strategy }: { strategy: RenderStrategy | null }) {
  if (!strategy) return <div style={{ opacity: 0.5 }}>No strategy computed</div>
  return (
    <div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>Decisions</div>
      {strategy.decisionLog.map((entry, i) => (
        <div key={i} style={{ borderTop: '1px solid rgba(0,255,0,0.15)', padding: '2px 0' }}>
          <div><span style={{ opacity: 0.5 }}>step:</span> {entry.step}</div>
          <div><span style={{ opacity: 0.5 }}>decision:</span> {entry.decision}</div>
          <div><span style={{ opacity: 0.5 }}>reason:</span> {entry.reason}</div>
          <div><span style={{ opacity: 0.5 }}>confidence:</span> {(entry.confidence * 100).toFixed(0)}%</div>
        </div>
      ))}
    </div>
  )
}

function ReportsTab({ snapshot }: { snapshot: TelemetrySnapshot }) {
  const asset = snapshot.assetReport
  const device = snapshot.deviceReport

  return (
    <div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>Asset</div>
      {asset ? (
        <>
          <Line label="Resolution" value={`${asset.resolution.width}x${asset.resolution.height}`} />
          <Line label="Aspect" value={asset.aspectRatio.toFixed(3)} />
          <Line label="Orientation" value={asset.orientation} />
          <Line label="Codec" value={asset.codec || 'unknown'} />
          <Line label="Frame Rate" value={asset.frameRate ? `${asset.frameRate}fps` : 'unknown'} />
          <Line label="Category" value={asset.contentCategory} />
          <Line label="Entropy" value={asset.visualEntropy?.toFixed(3) || 'N/A'} />
          <Line label="HDR" value={asset.isHDR ? 'yes' : 'no'} />
        </>
      ) : (
        <div style={{ opacity: 0.5 }}>Not analyzed</div>
      )}

      <div style={{ fontWeight: 700, marginTop: 6 }}>Device</div>
      {device ? (
        <>
          <Line label="GPU" value={`${device.gpu.renderer || 'unknown'} (${device.gpu.tier})`} />
          <Line label="CPU Cores" value={`${device.cpu.cores}`} />
          <Line label="Memory" value={`${device.memory.deviceMemory}GB`} />
          <Line label="DPR" value={`${device.display.dpr}`} />
          <Line label="Battery" value={device.power.batteryLevel !== null ? `${Math.round(device.power.batteryLevel * 100)}%` : 'N/A'} />
          <Line label="Network" value={device.network.effectiveBandwidth ? `${device.network.effectiveBandwidth}Mbps` : 'N/A'} />
          <Line label="Form" value={device.form} />
          <Line label="Browser" value={`${device.browser.name} ${device.browser.version}`} />
          <Line label="OS" value={device.os.name} />
          <Line label="HW Decode" value={device.mediaCapabilities.hardwareAccelerated ? 'yes' : 'no'} />
        </>
      ) : (
        <div style={{ opacity: 0.5 }}>Not analyzed</div>
      )}
    </div>
  )
}

function HistoryTab({ strategies }: { strategies: RenderStrategy[] }) {
  if (strategies.length === 0) return <div style={{ opacity: 0.5 }}>No history</div>
  return (
    <div>
      {strategies.map((s, i) => (
        <div key={i} style={{ borderTop: '1px solid rgba(0,255,0,0.15)', padding: '2px 0' }}>
          <span style={{ opacity: 0.5 }}>#{i + 1}</span>{' '}
          {s.strategyName} | {s.qualityProfile} | {s.objectFit} | {s.rotation}° | conf:{(s.confidence * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{value}</span>
    </div>
  )
}
