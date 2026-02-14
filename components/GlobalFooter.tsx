import React from 'react'

export function GlobalFooter() {
    return (
        <footer className="fixed bottom-0 left-0 w-full flex justify-center py-2 z-40 pointer-events-none select-none bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-[10px] font-sans font-medium text-gray-400/80 tracking-widest uppercase">
                © 2026 TensorThrottle X. All Rights Reserved.
            </span>
        </footer>
    )
}
