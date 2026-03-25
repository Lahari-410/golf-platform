'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile, Draw, Charity, Winner } from '@/types'
import { generateRandomDraw, generateAlgorithmicDraw, calculatePrizePools } from '@/lib/drawEngine'
import { Score } from '@/types'

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'draws' | 'charities' | 'winners' | 'analytics'>('draws')
  const [users, setUsers] = useState<Profile[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [drawType, setDrawType] = useState<'random' | 'algorithmic'>('random')
  const [simulatedNumbers, setSimulatedNumbers] = useState<number[]>([])

  // New charity form
  const [newCharity, setNewCharity] = useState({ name: '', description: '', website: '' })

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') { router.push('/dashboard'); return }

    await loadAllData()
    setLoading(false)
  }

  const loadAllData = async () => {
    const [usersRes, drawsRes, charitiesRes, winnersRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('draws').select('*').order('created_at', { ascending: false }),
      supabase.from('charities').select('*'),
      supabase.from('winners').select('*').order('created_at', { ascending: false }),
    ])
    setUsers(usersRes.data || [])
    setDraws(drawsRes.data || [])
    setCharities(charitiesRes.data || [])
    setWinners(winnersRes.data || [])
  }

  // Simulate a draw — generate numbers without publishing
  const simulateDraw = async () => {
    let numbers: number[]

    if (drawType === 'algorithmic') {
      // Get all scores from active subscribers
      const { data: allScores } = await supabase.from('scores').select('*')
      numbers = generateAlgorithmicDraw((allScores || []) as Score[])
    } else {
      numbers = generateRandomDraw()
    }

    setSimulatedNumbers(numbers)
  }

  // Publish the draw — make it official
  const publishDraw = async () => {
    if (simulatedNumbers.length === 0) { alert('Simulate first!'); return }

    // Calculate prize pool based on active subscribers
    const activeUsers = users.filter(u => u.subscription_status === 'active')
    const monthly = activeUsers.filter(u => u.subscription_plan === 'monthly').length
    const yearly = activeUsers.filter(u => u.subscription_plan === 'yearly').length
    const totalPool = (monthly * 10 * 0.5) + (yearly * (100 / 12) * 0.5)
    const pools = calculatePrizePools(totalPool)

    // Create draw record
    const { data: draw, error } = await supabase.from('draws').insert({
      draw_date: new Date().toISOString().split('T')[0],
      status: 'published',
      draw_type: drawType,
      winning_numbers: simulatedNumbers,
      jackpot_amount: pools.jackpot,
      four_match_amount: pools.fourMatch,
      three_match_amount: pools.threeMatch,
      total_pool: totalPool,
    }).select().single()

    if (error) { alert('Error creating draw'); return }

    // Match all active subscribers' scores against winning numbers
    const { data: allScores } = await supabase
      .from('scores').select('*, profiles!inner(subscription_status)')

    const userScoreMap: Record<string, number[]> = {}
    ;(allScores || []).forEach((s: any) => {
      if (!userScoreMap[s.user_id]) userScoreMap[s.user_id] = []
      userScoreMap[s.user_id].push(s.score)
    })

    // Find winners
    for (const [userId, userScores] of Object.entries(userScoreMap)) {
      const matches = userScores.filter(s => simulatedNumbers.includes(s)).length
      if (matches >= 3) {
        let matchType = matches === 5 ? '5-match' : matches === 4 ? '4-match' : '3-match'
        let prize = matches === 5 ? pools.jackpot : matches === 4 ? pools.fourMatch : pools.threeMatch

        await supabase.from('winners').insert({
          draw_id: draw.id,
          user_id: userId,
          match_type: matchType,
          prize_amount: prize,
          verification_status: 'pending',
          payment_status: 'pending',
        })
      }
    }

    setSimulatedNumbers([])
    await loadAllData()
    alert('Draw published successfully!')
  }

  // Add charity
  const addCharity = async () => {
    if (!newCharity.name) return
    await supabase.from('charities').insert(newCharity)
    setNewCharity({ name: '', description: '', website: '' })
    await loadAllData()
  }

  // Verify winner
  const verifyWinner = async (winnerId: string, status: 'approved' | 'rejected') => {
    await supabase.from('winners')
      .update({ verification_status: status })
      .eq('id', winnerId)
    await loadAllData()
  }

  // Mark as paid
  const markPaid = async (winnerId: string) => {
    await supabase.from('winners')
      .update({ payment_status: 'paid' })
      .eq('id', winnerId)
    await loadAllData()
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-slate-400">Loading admin panel...</p>
    </div>
  )

  const activeUsers = users.filter(u => u.subscription_status === 'active')
  const totalPool = (activeUsers.filter(u => u.subscription_plan === 'monthly').length * 10 * 0.5) +
    (activeUsers.filter(u => u.subscription_plan === 'yearly').length * (100 / 12) * 0.5)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="flex justify-between items-center px-8 py-5 border-b border-slate-800">
        <div className="text-xl font-bold text-green-400">GolfGive <span className="text-slate-500 text-sm font-normal">Admin</span></div>
        <button onClick={() => { supabase.auth.signOut(); router.push('/') }}
          className="text-sm text-slate-500 hover:text-red-400 transition">Logout</button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* STATS ROW */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Active Subscribers', value: activeUsers.length },
            { label: 'Prize Pool', value: `£${totalPool.toFixed(0)}` },
            { label: 'Pending Winners', value: winners.filter(w => w.verification_status === 'pending').length },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-8 bg-slate-800 rounded-xl p-1 overflow-x-auto">
          {(['draws', 'users', 'charities', 'winners', 'analytics'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition whitespace-nowrap ${
                activeTab === tab ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Draw Management</h2>

            {/* Run draw */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
              <h3 className="font-semibold mb-4">Run Monthly Draw</h3>
              <div className="flex gap-4 mb-4">
                {(['random', 'algorithmic'] as const).map(type => (
                  <button key={type} onClick={() => setDrawType(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
                      drawType === type ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}>
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={simulateDraw}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition">
                  Simulate
                </button>
                <button onClick={publishDraw} disabled={simulatedNumbers.length === 0}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition">
                  Publish Draw
                </button>
              </div>

              {simulatedNumbers.length > 0 && (
                <div className="mt-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <p className="text-green-400 text-sm mb-2">Simulated winning numbers:</p>
                  <div className="flex gap-3">
                    {simulatedNumbers.map(n => (
                      <div key={n} className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Past draws */}
            <div className="space-y-3">
              {draws.map(draw => (
                <div key={draw.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{new Date(draw.draw_date).toLocaleDateString()} — {draw.draw_type}</p>
                      <p className="text-slate-400 text-sm">Numbers: {draw.winning_numbers?.join(', ')}</p>
                      <p className="text-slate-400 text-sm">Pool: £{draw.total_pool?.toFixed(0)}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      draw.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {draw.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-bold mb-6">User Management</h2>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="font-medium">{user.full_name || 'No name'}</p>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {user.subscription_status}
                    </span>
                    <span className="text-slate-500 text-xs">{user.subscription_plan || 'no plan'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHARITIES TAB */}
        {activeTab === 'charities' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Charity Management</h2>

            {/* Add charity */}
            <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
              <h3 className="font-semibold mb-4">Add New Charity</h3>
              <div className="space-y-3">
                <input placeholder="Charity name" value={newCharity.name}
                  onChange={e => setNewCharity({ ...newCharity, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500" />
                <input placeholder="Description" value={newCharity.description}
                  onChange={e => setNewCharity({ ...newCharity, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500" />
                <input placeholder="Website URL" value={newCharity.website}
                  onChange={e => setNewCharity({ ...newCharity, website: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-green-500" />
                <button onClick={addCharity}
                  className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white rounded-xl font-medium transition">
                  Add Charity
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {charities.map(charity => (
                <div key={charity.id} className="bg-slate-800 rounded-xl p-5 flex justify-between items-center border border-slate-700">
                  <div>
                    <p className="font-semibold">{charity.name}</p>
                    <p className="text-slate-400 text-sm">{charity.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {charity.is_featured && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Featured</span>}
                    <span className={`text-xs px-2 py-1 rounded-full ${charity.is_active ? 'bg-slate-700 text-slate-300' : 'bg-red-500/20 text-red-400'}`}>
                      {charity.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WINNERS TAB */}
        {activeTab === 'winners' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Winners Management</h2>
            <div className="space-y-3">
              {winners.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No winners yet</p>
              ) : (
                winners.map(winner => (
                  <div key={winner.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-green-400">{winner.match_type} — £{winner.prize_amount}</p>
                        <p className="text-slate-400 text-sm">
                          Verification: {winner.verification_status} | Payment: {winner.payment_status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {winner.verification_status === 'pending' && (
                          <>
                            <button onClick={() => verifyWinner(winner.id, 'approved')}
                              className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition">
                              Approve
                            </button>
                            <button onClick={() => verifyWinner(winner.id, 'rejected')}
                              className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition">
                              Reject
                            </button>
                          </>
                        )}
                        {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                          <button onClick={() => markPaid(winner.id)}
                            className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/30 transition">
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Reports & Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Users', value: users.length },
                { label: 'Active Subscribers', value: activeUsers.length },
                { label: 'Monthly Subscribers', value: users.filter(u => u.subscription_plan === 'monthly').length },
                { label: 'Yearly Subscribers', value: users.filter(u => u.subscription_plan === 'yearly').length },
                { label: 'Total Draws Run', value: draws.length },
                { label: 'Total Winners', value: winners.length },
                { label: 'Prizes Paid', value: winners.filter(w => w.payment_status === 'paid').length },
                { label: 'Pending Verification', value: winners.filter(w => w.verification_status === 'pending').length },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
