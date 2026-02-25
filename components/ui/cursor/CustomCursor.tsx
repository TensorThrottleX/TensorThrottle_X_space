'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUI } from '@/components/providers/UIProvider';

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const { renderMode } = useUI();
    const isBright = renderMode === 'bright';
    const [isActive, setIsActive] = useState(false);

    // Lerp state
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const cursorX = useRef(0);
    const cursorY = useRef(0);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.current = e.clientX;
            mouseY.current = e.clientY;
        };

        const handleMouseEnter = () => {
            setIsActive(true);
            document.body.classList.add('cursor-active');
        };

        const handleMouseLeave = () => {
            setIsActive(false);
            document.body.classList.remove('cursor-active');
        };

        // Add listeners for interactive elements
        const addInteractiveListeners = () => {
            // Comprehensive interactive selector list
            const selectors = [
                'button',
                'a',
                '.card',
                '.interactive',
                '[role="button"]',
                '[role="link"]',
                '.cursor-pointer',
                'input',
                'textarea',
                'select',
                'label'
            ];
            const interactives = document.querySelectorAll(selectors.join(', '));
            interactives.forEach(el => {
                el.addEventListener('mouseenter', handleMouseEnter);
                el.addEventListener('mouseleave', handleMouseLeave);
            });
        };

        // Mutation Observer to handle dynamic content
        const observer = new MutationObserver(addInteractiveListeners);
        if (typeof document !== 'undefined') {
            observer.observe(document.body, { childList: true, subtree: true });
            window.addEventListener('mousemove', handleMouseMove);
            // Initial run with slight delay to ensure DOM is ready
            setTimeout(addInteractiveListeners, 100);
        }

        // Animation Loop
        const animate = () => {
            // Lerp factor: 0.35 for responsive, slight smoothing
            cursorX.current += (mouseX.current - cursorX.current) * 0.35;
            cursorY.current += (mouseY.current - cursorY.current) * 0.35;

            if (cursorRef.current) {
                // Apply transform directly for performance
                cursorRef.current.style.transform = `translate3d(${cursorX.current}px, ${cursorY.current}px, 0) translate(-50%, -50%)`;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            observer.disconnect();
            document.body.classList.remove('cursor-active');

            const selectors = [
                'button',
                'a',
                '.card',
                '.interactive',
                '[role="button"]',
                '[role="link"]',
                '.cursor-pointer',
                'input',
                'textarea',
                'select',
                'label'
            ];
            const interactives = document.querySelectorAll(selectors.join(', '));
            interactives.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnter);
                el.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, []);

    return (
        <>
            <style jsx global>{`
                /* Aggressive cursor hiding when active */
                body.cursor-active,
                body.cursor-active * {
                    cursor: none !important;
                }
            `}</style>
            <div
                ref={cursorRef}
                className={`fixed top-0 left-0 w-6 h-6 pointer-events-none z-[9999] transition-opacity duration-150 ease-out will-change-transform ${isActive ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    mixBlendMode: isBright ? 'difference' : 'screen'
                }}
            >
                {/* Arrow SVG */}
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`drop-shadow-md transition-transform duration-200 ${isBright ? 'text-black' : 'text-cyan-400'} ${isActive ? 'scale-110' : 'scale-100'}`}
                >
                    <path
                        d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                        fill="currentColor"
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </>
    );
}
