'use client'

import Link from 'next/link'
import { useState } from 'react'

interface NavbarProps {
  categories: string[]
}

export function Navbar({ categories }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Home */}
          <Link
            href="/"
            className="text-lg font-semibold text-gray-900 transition-opacity hover:opacity-70"
          >
            Home
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden gap-6 md:flex">
            {categories.slice(0, 3).map((category) => (
              <Link
                key={category}
                href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                {category}
              </Link>
            ))}
            <Link
              href="/about"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              About
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="space-y-2 border-t border-gray-200 py-4 md:hidden">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="block text-sm text-gray-600 transition-colors hover:text-gray-900"
                onClick={() => setIsOpen(false)}
              >
                {category}
              </Link>
            ))}
            <Link
              href="/about"
              className="block text-sm text-gray-600 transition-colors hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
