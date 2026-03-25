'use client'
import Link from 'next/link'

// Homepage — explains what the platform does
// Clean, modern, emotion-driven design (not traditional golf aesthetics)

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-slate-800">
        <div className="text-2xl font-bold text-green-400">GolfGive</div>
        <div className="flex gap-4">
          <Link href="/login" className="text-slate-300 hover:text-white transition">Sign in</Link>
          <Link href="/register" className="bg-green-500 hover:bg-green-400 text-white px-5 py-2 rounded-full font-medium transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center py-32 px-4">
        <div className="inline-block bg-green-500/10 text-green-400 text-sm px-4 py-1 rounded-full mb-6 border border-green-500/20">
          Play Golf. Win Prizes. Change Lives.
        </div>
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Golf that gives<br />
          <span className="text-green-400">back</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Enter your golf scores, compete in monthly prize draws, and automatically
          support the charity you care about — all in one subscription.
        </p>
        <Link href="/register"
          className="bg-green-500 hover:bg-green-400 text-white text-lg px-10 py-4 rounded-full font-semibold transition inline-block">
          Start Your Free Trial
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Subscribe', desc: 'Choose monthly or yearly. A portion of every subscription goes directly to your chosen charity.' },
            { step: '02', title: 'Enter Scores', desc: 'Log your last 5 Stableford scores after each round. Your scores are your lottery numbers.' },
            { step: '03', title: 'Win & Give', desc: 'Every month, scores are matched against the draw. Win prizes while your charity wins too.' },
          ].map(item => (
            <div key={item.step} className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="text-green-400 text-sm font-mono mb-4">{item.step}</div>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold mb-2">Monthly</h3>
            <div className="text-5xl font-bold mb-1">£10<span className="text-xl text-slate-400">/mo</span></div>
            <p className="text-slate-400 mb-8">Cancel anytime</p>
            <ul className="space-y-3 text-slate-300">
              <li>✓ Monthly prize draw entry</li>
              <li>✓ Score tracking</li>
              <li>✓ 10% to your charity</li>
            </ul>
            <Link href="/register?plan=monthly"
              className="mt-8 block text-center border border-green-500 text-green-400 py-3 rounded-xl hover:bg-green-500 hover:text-white transition">
              Choose Monthly
            </Link>
          </div>
          {/* Yearly */}
          <div className="bg-green-500 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 bg-white text-green-600 text-xs px-3 py-1 rounded-full font-bold">BEST VALUE</div>
            <h3 className="text-xl font-bold mb-2 text-white">Yearly</h3>
            <div className="text-5xl font-bold mb-1 text-white">£100<span className="text-xl text-green-100">/yr</span></div>
            <p className="text-green-100 mb-8">Save £20 vs monthly</p>
            <ul className="space-y-3 text-green-50">
              <li>✓ All monthly features</li>
              <li>✓ Priority draw entry</li>
              <li>✓ 10% to your charity</li>
            </ul>
            <Link href="/register?plan=yearly"
              className="mt-8 block text-center bg-white text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50 transition">
              Choose Yearly
            </Link>
          </div>
        </div>
      </section>

      {/* CHARITY IMPACT */}
      <section className="py-24 px-8 bg-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Every round matters</h2>
          <p className="text-xl text-slate-400 mb-12">
            At least 10% of every subscription goes directly to the charity you choose.
            You can increase this percentage anytime from your dashboard.
          </p>
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: '£50,000+', label: 'Donated to charities' },
              { value: '2,000+', label: 'Active subscribers' },
              { value: '5', label: 'Charity partners' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-green-400 mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-12 text-slate-500 border-t border-slate-800">
        <div className="text-green-400 font-bold text-xl mb-2">GolfGive</div>
        <p>Play Golf. Win Prizes. Support Charity.</p>
      </footer>
    </main>
  )
}
