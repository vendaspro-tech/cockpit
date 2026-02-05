'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface TeamAverageResult {
  average: number
  max: number
  min: number
  count: number
  allScores: number[]
}


/**
 * Calcula a média do time para um tipo de teste específico
 */
export async function getTeamAverageScore(
  workspaceId: string,
  testType: string
): Promise<TeamAverageResult | null> {
  const supabase = createAdminClient()
  
  try {
    // Buscar todas as avaliações concluídas do workspace para este tipo
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('id, evaluated_user_id')
      .eq('workspace_id', workspaceId)
      .eq('test_type', testType)
      .eq('status', 'completed')
    
    if (error || !assessments || assessments.length === 0) {
      console.error('Error fetching team assessments:', error)
      return null
    }
    
    // Buscar resultados de cada avaliação
    const scores: number[] = []
    
    for (const assessment of assessments) {
      // Tentar buscar resultado salvo
      const { data: result } = await supabase
        .from('assessment_results')
        .select('scores')
        .eq('assessment_id', assessment.id)
        .single()
      
      if (result?.scores) {
        // Extrair score baseado no tipo
        let score = 0
        if (typeof result.scores === 'number') {
          score = result.scores
        } else if (result.scores.percentage) {
          score = result.scores.percentage
        } else if (result.scores.globalPercentage) {
          score = result.scores.globalPercentage
        } else if (result.scores.score && result.scores.maxScore) {
          score = (result.scores.score / result.scores.maxScore) * 100
        }
        
        if (score > 0) {
          scores.push(score)
        }
      }
    }
    
    if (scores.length === 0) {
      return null
    }
    
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    
    return {
      average: Math.round(average * 10) / 10, // 1 decimal
      max: Math.round(max * 10) / 10,
      min: Math.round(min * 10) / 10,
      count: scores.length,
      allScores: scores
    }
  } catch (error) {
    console.error('Error calculating team average:', error)
    return null
  }
}

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  avatar?: string
  trend?: number
  badge?: 'top' | 'rising' | 'attention'
}

/**
 * Busca o ranking do time
 */
export async function getTeamLeaderboard(
  workspaceId: string,
  testType?: string,
  limit: number = 10,
  squadId?: string
): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient()
  
  try {
    // Query simples e direta
    let query = supabase
      .from('assessments')
      .select('id, evaluated_user_id, test_type')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
    
    // Filter by squad if provided
    if (squadId) {
      // Get squad members
      const { data: squadMembers } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId)
      
      const memberIds = squadMembers?.map(m => m.user_id) || []
      if (memberIds.length > 0) {
        query = query.in('evaluated_user_id', memberIds)
      }
    }
    
    const { data: assessments, error } = await query
    
    if (error) {
      console.error('❌ Supabase error:', JSON.stringify(error, null, 2))
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      // Retornar array vazio ao invés de crashar
      return []
    }
    
    if (!assessments || assessments.length === 0) {
      console.log('ℹ️ No completed assessments found')
      return []
    }
    
    console.log(`✅ Found ${assessments.length} assessments`)
    
    // Filtrar por tipo se necessário
    const filteredAssessments = testType 
      ? assessments.filter(a => a.test_type === testType)
      : assessments
    
    if (filteredAssessments.length === 0) {
      console.log(`ℹ️ No assessments of type ${testType}`)
      return []
    }
    
    // Buscar usuários separadamente
    const userIds = [...new Set(assessments.map(a => a.evaluated_user_id))]
    type UserRow = { id: string; full_name: string | null; email: string | null }

    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)
    
    const userRows = (users ?? []) as UserRow[]
    const userMap = new Map(userRows.map(u => [u.id, u]))
    
    // Criar map para agrupar por usuário (última avaliação)
    const userScores = new Map<string, {
      user: UserRow
      score: number
      assessmentId: string
    }>()
    
    for (const assessment of assessments) {
      const userId = assessment.evaluated_user_id
      
      // Pular se já temos este usuário (lista está ordenada por mais recente)
      if (userScores.has(userId)) continue
      
      // Buscar resultado
      const { data: result } = await supabase
        .from('assessment_results')
        .select('scores')
        .eq('assessment_id', assessment.id)
        .single()
      
      if (result?.scores) {
        let score = 0
        if (typeof result.scores === 'number') {
          score = result.scores
        } else if (result.scores.percentage) {
          score = result.scores.percentage
        } else if (result.scores.globalPercentage) {
          score = result.scores.globalPercentage
        }
        
        if (score > 0) {
          const user = userMap.get(userId)
          if (user) {
            userScores.set(userId, {
              user,
              score,
              assessmentId: assessment.id
            })
          }
        }
      }
    }
    
    // Converter para array e ordenar
    const leaderboard: LeaderboardEntry[] = Array.from(userScores.values())
      .map(({ user, score }) => ({
        id: user.id,
        name: user.full_name || user.email || 'Usuário',
        score: Math.round(score * 10) / 10,
        // TODO: Adicionar cálculo de trend quando houver histórico
        // TODO: Adicionar badges baseado em performance
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return leaderboard
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

export interface DashboardStats {
  totalAssessments: number
  completedAssessments: number
  pendingAssessments: number
  averageScore: number
  activePDIs: number
}

/**
 * Busca estatísticas gerais para o dashboard
 */
export async function getDashboardStats(
  workspaceId: string,
  squadId?: string
): Promise<DashboardStats> {
  const supabase = createAdminClient()
  
  try {
    // Total e status de avaliações
    let assessmentQuery = supabase
      .from('assessments')
      .select('id, status')
      .eq('workspace_id', workspaceId)
    
    // Filter by squad if provided
    if (squadId) {
      const { data: squadMembers } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId)
      
      const memberIds = squadMembers?.map(m => m.user_id) || []
      if (memberIds.length > 0) {
        assessmentQuery = assessmentQuery.in('evaluated_user_id', memberIds)
      }
    }
    
    const { data: assessments } = await assessmentQuery
    
    const totalAssessments = assessments?.length || 0
    const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0
    const pendingAssessments = totalAssessments - completedAssessments
    
    // PDIs ativos
    const { data: pdis } = await supabase
      .from('pdi_plans')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'in_progress'])
    
    const activePDIs = pdis?.length || 0
    
    // Score médio (pode ser expandido para calcular de todas as avaliações)
    const averageScore = 0 // TODO: Implementar cálculo global
    
    return {
      totalAssessments,
      completedAssessments,
      pendingAssessments,
      averageScore,
      activePDIs
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalAssessments: 0,
      completedAssessments: 0,
      pendingAssessments: 0,
      averageScore: 0,
      activePDIs: 0
    }
  }
}

export interface CompetencyMatrixData {
  users: Array<{
    userId: string
    userName: string
    scores: Record<string, number>
  }>
  competencies: string[]
}

/**
 * Busca matriz de competências para heat map
 */
export async function getCompetencyMatrix(
  workspaceId: string,
  testType: string,
  squadId?: string
): Promise<CompetencyMatrixData> {
  const supabase = createAdminClient()
  
  try {
    // Buscar avaliações concluídas
    let matrixQuery = supabase
      .from('assessments')
      .select(`
        id,
        evaluated_user_id,
        users!inner (
          id,
          full_name,
          email
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('test_type', testType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
    
    // Filter by squad if provided
    if (squadId) {
      const { data: squadMembers } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId)
      
      const memberIds = squadMembers?.map(m => m.user_id) || []
      if (memberIds.length > 0) {
        matrixQuery = matrixQuery.in('evaluated_user_id', memberIds)
      }
    }
    
    const { data: assessments } = await matrixQuery
    
    if (!assessments || assessments.length === 0) {
      return { users: [], competencies: [] }
    }
    
    // Agrupar por usuário (última avaliação)
    type MatrixUser = { userId: string; userName: string; scores: Record<string, number> }
    type AssessmentUserRow = { id: string; full_name: string | null; email: string | null }

    const userMap = new Map<string, MatrixUser>()
    const competenciesSet = new Set<string>()
    
    for (const assessment of assessments) {
      const userId = assessment.evaluated_user_id
      
      // Já temos este usuário (última avaliação)
      if (userMap.has(userId)) continue
      
      // Buscar resultado
      const { data: result } = await supabase
        .from('assessment_results')
        .select('scores')
        .eq('assessment_id', assessment.id)
        .single()
      
      if (result?.scores) {
        const scores: Record<string, number> = {}
        
        // Extrair scores por competência/item baseado no tipo
        if (testType === 'def_method' && result.scores.categories) {
          // DEF tem categorias com items
          for (const category of result.scores.categories) {
            if (category.items) {
              for (const item of category.items) {
                const compName = item.name || item.id
                scores[compName] = item.score || 0
                competenciesSet.add(compName)
              }
            }
          }
        } else if (result.scores.items) {
          // Senioridade e Values 8D têm items diretos
          for (const item of result.scores.items) {
            const compName = item.name || item.id
            scores[compName] = item.score || 0
            competenciesSet.add(compName)
          }
        } else if (result.scores.dimensions) {
          // Values 8D pode ter dimensions
          for (const [dim, score] of Object.entries(result.scores.dimensions)) {
            scores[dim] = typeof score === 'number' ? score : 0
            competenciesSet.add(dim)
          }
        }
        
        if (Object.keys(scores).length > 0) {
          const user = assessment.users as unknown as AssessmentUserRow | null
          if (user) {
            userMap.set(userId, {
              userId: user.id,
              userName: user.full_name || user.email || 'Usuário',
              scores
            })
          }
        }
      }
    }
    
    return {
      users: Array.from(userMap.values()),
      competencies: Array.from(competenciesSet)
    }
  } catch (error) {
    console.error('Error fetching competency matrix:', error)
    return { users: [], competencies: [] }
  }
}
