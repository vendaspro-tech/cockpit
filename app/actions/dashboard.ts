'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole as getWorkspaceRole } from "@/lib/auth-utils"

export async function getUserRole(userId: string, workspaceId: string) {
  return getWorkspaceRole(userId, workspaceId)
}

export async function getSellerDashboardData(userId: string, workspaceId: string) {
  const supabase = createAdminClient()
  type AssessmentTypeRow = { name: string | null }
  type ProductRow = { name: string | null }
  type AssessmentHistoryRow = {
    created_at: string
    score: number
    assessment_types: AssessmentTypeRow | null
  }
  type DefHistoryRow = {
    id: string
    created_at: string
    score: number
    metadata?: { lead_name?: string | null } | null
    products: ProductRow | null
  }

  // Get Supabase user ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', userId)
    .single()

  if (!user) return null

  // 1. Latest Assessment for Radar
  const { data: latestAssessment } = await supabase
    .from('assessments')
    .select('*, assessment_types(*)')
    .eq('workspace_id', workspaceId)
    .eq('evaluated_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 2. Score Evolution (Last 6 months)
  const { data: history } = await supabase
    .from('assessments')
    .select('created_at, score, assessment_types(name)')
    .eq('workspace_id', workspaceId)
    .eq('evaluated_user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(10)

  // 3. DEF History
  const { data: defHistory } = await supabase
    .from('assessments')
    .select('*, products(name)')
    .eq('workspace_id', workspaceId)
    .eq('evaluated_user_id', user.id)
    .eq('test_type', 'def_method')
    .order('created_at', { ascending: false })
    .limit(5)

  const historyRows = (history ?? []) as unknown as AssessmentHistoryRow[]
  const defHistoryRows = (defHistory ?? []) as unknown as DefHistoryRow[]

  return {
    latestAssessment,
    history: historyRows.map(h => ({
      date: new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: h.score,
      label: h.assessment_types?.name || ''
    })),
    defHistory: defHistoryRows.map(h => ({
      id: h.id,
      date: h.created_at,
      leadName: h.metadata?.lead_name || 'Lead sem nome',
      product: h.products?.name || 'Produto não informado',
      score: h.score,
      status: (h.score >= 70 ? 'won' : h.score < 40 ? 'lost' : 'ongoing') as 'won' | 'lost' | 'ongoing'
    }))
  }
}

export async function getLeaderDashboardData(workspaceId: string) {
  const supabase = createAdminClient()
  type MemberRow = {
    user_id: string
    role: string
    users: { full_name: string | null; email: string | null } | null
  }
  type AssessmentScoreRow = { score: number }
  type RankingEntry = { name: string; score: number; role: string; avatar: string }
  type DefResultCategory = { name: string; score: { percentage?: number | null } }
  type DefResult = { categories?: DefResultCategory[] | null }
  type DefAssessmentRow = { result?: DefResult | null }
  type HeatmapEntry = { category: string; score: number; items: { name: string; score: number }[] }

  // 1. Team Performance Ranking
  // Fetch all members and their average scores
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      user_id,
      role,
      users (
        full_name,
        email
      )
    `)
    .eq('workspace_id', workspaceId)

  const memberRows = (members ?? []) as unknown as MemberRow[]
  const rankingData: RankingEntry[] = []
  
  if (memberRows.length > 0) {
    for (const member of memberRows) {
      const { data: avgScore } = await supabase
        .from('assessments')
        .select('score')
        .eq('workspace_id', workspaceId)
        .eq('evaluated_user_id', member.user_id)
        .order('created_at', { ascending: false })
        .limit(5) // Average of last 5

      const scoreRows = (avgScore ?? []) as AssessmentScoreRow[]

      if (scoreRows.length > 0) {
        const avg = scoreRows.reduce((acc, curr) => acc + curr.score, 0) / scoreRows.length
        const userData = member.users
        rankingData.push({
          name: userData?.full_name || userData?.email || 'Usuário',
          score: Math.round(avg),
          role: member.role,
          avatar: ''
        })
      }
    }
  }

  // 2. Seniority Distribution
  // This would typically come from a specific 'seniority' field or latest assessment result
  // For now, we'll mock it based on ranking scores as a proxy or return placeholder
  const seniorityData = [
    { name: 'Júnior', value: rankingData.filter(r => r.score < 50).length, color: '#ef4444' },
    { name: 'Pleno', value: rankingData.filter(r => r.score >= 50 && r.score < 80).length, color: '#eab308' },
    { name: 'Sênior', value: rankingData.filter(r => r.score >= 80).length, color: '#22c55e' },
  ].filter(d => d.value > 0)

  // 3. Team Bottleneck Heatmap
  // We need to aggregate category scores from all assessments
  // This is heavy, so we'll simplify: fetch latest DEF assessments for everyone
  const { data: defs } = await supabase
    .from('assessments')
    .select('result')
    .eq('workspace_id', workspaceId)
    .eq('test_type', 'def_method')
    .order('created_at', { ascending: false })
    .limit(20)

  const heatmapData: HeatmapEntry[] = []
  const defRows = (defs ?? []) as DefAssessmentRow[]
  if (defRows.length > 0) {
    const categories: Record<string, number[]> = {}
    defRows.forEach((def) => {
      if (def.result?.categories) {
        def.result.categories.forEach((cat) => {
          if (!categories[cat.name]) categories[cat.name] = []
          categories[cat.name].push(cat.score.percentage || 0)
        })
      }
    })

    Object.entries(categories).forEach(([cat, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      heatmapData.push({
        category: cat,
        score: Math.round(avg),
        items: [] // Detailed items could be added here
      })
    })
  }

  return {
    ranking: rankingData,
    seniority: seniorityData,
    heatmap: heatmapData,
    evolution: [] // Placeholder for team evolution
  }
}
