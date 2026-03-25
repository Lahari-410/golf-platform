'use client'
import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'monthly'

  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name }
        }
      })

      if (signUpError) throw signUpError

      // Redirect to subscription page with plan
      router.push(`/subscribe?plan=${plan}`)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-green-400">GolfGive</Link>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
              <input
                type={field.type}
                required
                placeholder={field.placeholder}
                value={form[field.name as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
              />
            </div>
          ))}

          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400">
            Plan: <strong>{plan === 'yearly' ? '£100/year' : '£10/month'}</strong> — you will set up payment next
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:bg-green-800 text-white font-semibold rounded-xl transition">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
