'use client'

import React, { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { useUI } from '@/components/providers/UIProvider'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getBrowserFingerprint } from '@/lib/fingerprint'

export function LiveTrafficStats() {
    const { renderMode } = useUI()
    const isBright = renderMode === 'bright'

    const [activeUsers, setActiveUsers] = useState(0)
    const [totalVisits, setTotalVisits] = useState(0)

    useEffect(() => {
        let mounted = true;
        let room: any = null;

        const initRealtimeStats = async () => {
            const fingerprint = await getBrowserFingerprint();
            if (!mounted) return;

            // 1. Global View Counter (debounced server-side daily per fingerprint)
            try {
                const res = await fetch('/api/views', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ postSlug: '__global_site_visits__', visitorKey: fingerprint })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (mounted && data.viewCount != null) {
                        setTotalVisits(data.viewCount);
                    }
                }
            } catch (err) {
                console.error("Failed to sync views", err);
            }

            // 2. Real-time Active Users via Supabase Presence
            if (supabase) {
                room = supabase.channel('global_traffic', {
                    config: {
                        presence: {
                            key: fingerprint,
                        },
                    },
                });

                room
                    .on('presence', { event: 'sync' }, () => {
                        const state = room.presenceState();
                        if (!mounted) return;
                        const count = Object.keys(state).length;
                        setActiveUsers(count > 0 ? count : 1);
                    })
                    .subscribe(async (status: string) => {
                        if (status === 'SUBSCRIBED') {
                            await room.track({ online_at: new Date().toISOString() });
                        }
                    });
            } else {
                setActiveUsers(1); // fallback if no supabase connection
            }
        };

        initRealtimeStats();

        return () => {
            mounted = false;
            if (room && supabase) {
                supabase.removeChannel(room);
            }
        };
    }, []);

    return (
        <div 
            className="flex items-center gap-4 px-4 py-2.5 rounded-2xl border transition-colors duration-300 pointer-events-auto"
            style={{
                backgroundColor: 'var(--adaptive-glass-bg)',
                borderColor: 'var(--adaptive-glass-border)',
                boxShadow: 'var(--adaptive-glass-shadow)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
            }}
        >
            {/* Active Users */}
            <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute inset-0 rounded-full bg-purple-500/70 animate-ping" style={{ animationDuration: '3s' }} />
                    <span className="absolute inset-0 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                </div>
                <span className={cn(
                    "font-mono text-xs font-bold tracking-widest",
                    isBright ? "text-black/80" : "text-white/80"
                )}>
                    {activeUsers} <span className="opacity-40 text-[9px] uppercase ml-1">Active</span>
                </span>
            </div>

            {/* Total Visits */}
            <div className="flex items-center gap-2.5">
                <Eye 
                    size={13} 
                    className={cn(
                        "transition-colors duration-300", 
                        isBright ? "text-gray-400" : "text-gray-500"
                    )} 
                />
                <span className={cn(
                    "font-mono text-xs font-bold tracking-widest",
                    isBright ? "text-black/80" : "text-white/80"
                )}>
                    {totalVisits.toLocaleString()} <span className="opacity-40 text-[9px] uppercase ml-1">Views</span>
                </span>
            </div>
        </div>
    )
}
