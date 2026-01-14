
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// CCS Brand Icon Component
function BrandIcon({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200" 
      width={size} 
      height={size}
      className={className}
      fill="currentColor"
    >
      <g transform="translate(100, 100)">
        {/* Center star */}
        <path d="M 0,-15 L 4,-4 L 15,-4 L 6,3 L 10,14 L 0,7 L -10,14 L -6,3 L -15,-4 L -4,-4 Z"/>
        
        {/* Six petals arranged in a circle */}
        {[0, 60, 120, 180, 240, 300].map((rotation) => (
          <g key={rotation} transform={`rotate(${rotation})`}>
            <circle cx="0" cy="-45" r="20"/>
            <path d="M -12,-45 Q 0,-35 12,-45 Q 0,-55 -12,-45 Z"/>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.ok) {
        setIsSubmitted(true)
      } else {
        setError(data.error || 'Failed to process request')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl border-0 overflow-hidden">
            <div className="text-center p-8 pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900">
                Check Your Email
              </h2>
              <p className="text-center text-gray-600 mt-1">
                If an account exists with {email}, you will receive password reset instructions.
              </p>
            </div>
            <div className="px-8 pb-8">
              <Link href="/login">
                <button className="w-full py-2.5 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  <span className="flex items-center justify-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl border-0 overflow-hidden">
          <div className="text-center p-8 pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg">
                <BrandIcon size={48} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Forgot Password?
            </h2>
            <p className="text-center text-gray-600 mt-1">
              Enter your email to receive a password reset link
            </p>
          </div>
          <div className="px-8 pb-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Email
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors placeholder:text-gray-400"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                <span className="flex items-center justify-center">
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Login
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
