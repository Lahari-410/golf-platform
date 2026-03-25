'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, Score, Charity, Winner } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [activeTab, setActiveTab] = useState<'scores' | 'charity' | 'draws' | 'wins'>('scores')
  const [loading, setLoading] = useState(true)

  // New score form
  const [newScore, setNewScore] = useState({ score: '', played_at: '' })
  const [scoreError, setScoreError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)

    // Load scores (sorted newest first)
    const { data: scoresData } = await supabase
      .from('scores').select('*').eq('user_id', user.id)
      .order('played_at', { ascending: false }).limit(5)
    setScores(scoresData || [])

    // Load charities
    const { data: charitiesData } = await supabase
      .from('charities').select('*').eq('is_active', true)
    setCharities(charitiesData || [])

    // Load wins
    const { data: winnersData } = await supabase
      .from('winners').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setWinners(winnersData || [])

    setLoading(false)
  }

  // Add a new score (max 5, replaces oldest)
  const addScore = async () => {
    setScoreError('')
    const scoreNum = parseInt(newScore.score)
    if (!scoreNum || scoreNum < 1 || scoreNum > 45) {
      setScoreError('Score must be between 1 and 45'); return
    }
    if (!newScore.played_at) {
      setScoreError('Please select a date'); return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // If already 5 scores, delete the oldest one first
    if (scores.length >= 5) {
      const oldest = scores[scores.length - 1]
      await supabase.from('scores').delete().eq('id', oldest.id)
    }

    // Insert new score
    await supabase.from('scores').insert({
      user_id: user.id,
      score: scoreNum,
      played_at: newScore.played_at,
    })

    setNewScore({ score: '', played_at: '' })
    loadDashboard()
  }

  // Update charity selection
  const updateCharity = async (charityId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles')
      .update({ charity_id: charityId })
      .eq('id', user.id)
    loadDashboard()
  }

  // Update charity percentage
  const updateCharityPercentage = async (pct: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles')
      .update({ charity_percentage: pct })
      .eq('id', user.id)
    loadDashboard()
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-slate-400">Loading dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
        <div className="text-xl font-bold text-green-400">GolfGive</div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{profile?.full_name}</span>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-400 transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* SUBSCRIPTION STATUS */}
        <div className={`rounded-2xl p-5 mb-8 flex justify-between items-center ${
          profile?.subscription_status === 'active'
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div>
            <p className={`font-semibold ${profile?.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
              Subscription: {profile?.subscription_status?.toUpperCase()}
            </p>
            {profile?.subscription_end_date && (
              <p className="text-slate-400 text-sm mt-1">
                Renews: {new Date(profile.subscription_end_date).toLocaleDateString()}
              </p>
            )}
          </div>
          {profile?.subscription_status !== 'active' && (
            <a href="/subscribe" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-400 transition">
              Subscribe Now
            </a>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-8 bg-slate-800 rounded-xl p-1">
          {(['scores', 'charity', 'draws', 'wins'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition ${
                activeTab === tab ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {tab === 'draws' ? 'Draw History' : tab === 'wins' ? 'My Wins' : tab}
            </button>
          ))}
        </div>

        {/* SCORES TAB */}
        {activeTab === 'scores' && (
          <div>
            <h2 className="text-xl font-bold mb-6">My Golf Scores</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter your last 5 Stableford scores (1–45). Your scores are your draw numbers.
              Only the latest 5 are kept — a new score replaces the oldest.
            </p>

            {/* Add score form */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
              <h3 className="font-semibold mb-4">Add New Score</h3>
              {scoreError && <p className="text-red-400 text-sm mb-3">{scoreError}</p>}
              <div className="flex gap-3">
                <input
                  type="number" min="1" max="45"
                  placeholder="Score (1-45)"
                  value={newScore.score}
                  onChange={e => setNewScore({ ...newScore, score: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
                <input
                  type="date"
                  value={newScore.played_at}
                  onChange={e => setNewScore({ ...newScore, played_at: e.target.value })}
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-green-500"
                />
                <button onClick={addScore}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-medium transition">
                  Add
                </button>
              </div>
            </div>

            {/* Scores list */}
            <div className="space-y-3">
              {scores.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No scores yet. Add your first score above.</p>
              ) : (
                scores.map((s, i) => (
                  <div key={s.id} className="bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                        {s.score}
                      </div>
                      <div>
                        <p className="font-medium">Score: {s.score}</p>
                        <p className="text-slate-400 text-sm">{new Date(s.played_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {i === scores.length - 1 && scores.length === 5 && (
                      <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">Oldest — will be replaced</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CHARITY TAB */}
        {activeTab === 'charity' && (
          <div>
            <h2 className="text-xl font-bold mb-2">My Charity</h2>
            <p className="text-slate-400 text-sm mb-6">
              At least 10% of your subscription goes to your chosen charity every month.
            </p>

            {/* Contribution percentage */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
              <h3 className="font-semibold mb-4">
                Contribution: <span className="text-green-400">{profile?.charity_percentage}%</span>
              </h3>
              <input type="range" min="10" max="100" step="5"
                value={profile?.charity_percentage || 10}
                onChange={e => updateCharityPercentage(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between text-slate-400 text-xs mt-1">
                <span>10% (min)</span><span>100%</span>
              </div>
            </div>

            {/* Charity selection */}
            <div className="space-y-3">
              {charities.map(charity => (
                <div key={charity.id}
                  onClick={() => updateCharity(charity.id)}
                  className={`bg-slate-800 rounded-xl p-5 border cursor-pointer transition ${
                    profile?.charity_id === charity.id
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{charity.name}</h3>
                        {charity.is_featured && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Featured</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{charity.description}</p>
                    </div>
                    {profile?.charity_id === charity.id && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Draw Participation</h2>
            <div className="bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
              <p className="text-slate-400">
                {profile?.subscription_status === 'active'
                  ? `You are entered in this month's draw. Your scores are: ${scores.map(s => s.score).join(', ') || 'none yet'}`
                  : 'You need an active subscription to enter draws.'}
              </p>
            </div>
          </div>
        )}

        {/* WINS TAB */}
        {activeTab === 'wins' && (
          <div>
            <h2 className="text-xl font-bold mb-6">My Wins</h2>
            {winners.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl p-8 text-center border border-slate-700">
                <p className="text-slate-400">No wins yet — keep playing!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {winners.map(win => (
                  <div key={win.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-green-400">{win.match_type} — £{win.prize_amount}</p>
                        <p className="text-slate-400 text-sm">Status: {win.verification_status} | Payment: {win.payment_status}</p>
                      </div>
                      {win.verification_status === 'pending' && !win.proof_url && (
                        <button className="text-sm bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition">
                          Upload Proof
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
