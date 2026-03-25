'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This page is shown after successful Stripe payment
// Stripe redirects here with ?subscribed=true

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard after 4 seconds
    const timer = setTimeout(() => router.push('/dashboard'), 4000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">You're in!</h1>
        <p className="text-slate-400 mb-8">
          Your subscription is active. Welcome to GolfGive.
          <br />Redirecting to your dashboard...
        </p>
        <Link href="/dashboard"
          className="bg-green-500 hover:bg-green-400 text-white px-8 py-3 rounded-xl font-semibold transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
