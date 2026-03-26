'use client'
import { useState, useEffect } from 'react'

export default function SubscribePage() {
  const [plan, setPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)

  // ✅ get query param safely
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const planParam = params.get('plan')
    if (planParam) setPlan(planParam)
  }, [])

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error creating checkout session')
      }
    } catch (err) {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
        <div className="text-2xl font-bold text-green-400 mb-6">GolfGive</div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
          <p className="text-slate-400 text-sm mb-1">Selected plan</p>
          <p className="text-3xl font-bold text-white">
            {plan === 'yearly' ? '£100' : '£10'}
            <span className="text-lg text-slate-400">
              /{plan === 'yearly' ? 'year' : 'month'}
            </span>
          </p>
          {plan === 'yearly' && (
            <p className="text-green-400 text-sm mt-1">Save £20 vs monthly</p>
          )}
        </div>

        <ul className="text-left space-y-2 text-slate-300 text-sm mb-8">
          <li>✓ Monthly prize draw entry</li>
          <li>✓ Golf score tracking</li>
          <li>✓ At least 10% to your charity</li>
          <li>✓ Cancel anytime</li>
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:bg-green-800 text-white font-semibold rounded-xl transition"
        >
          {loading ? 'Redirecting to payment...' : 'Continue to Payment'}
        </button>

        <p className="text-slate-500 text-xs mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  )
}