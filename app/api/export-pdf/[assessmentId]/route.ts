import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToStream } from '@react-pdf/renderer'
import { getAuthUser } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'
import { canViewUserData } from '@/lib/hierarchy-access'
import { getTeamAverageScore } from '@/app/actions/performance-analytics'
import { AssessmentPDF } from '@/lib/pdf/assessment-pdf-template'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assessmentId: string }> }
) {
  try {
    // 1. Autenticar usuário
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { assessmentId } = await context.params
    console.log('📄 Exporting PDF for assessment:', assessmentId)
    
    const supabase = await createClient()

    // 2. Buscar ID do usuário na tabela users
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single()
    
    if (!currentUser) {
      console.error('User not found in users table')
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 3. Buscar avaliação (sem join para evitar problemas de FK)
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, workspace_id, test_type, status, evaluated_user_id')
      .eq('id', assessmentId)
      .single()

    console.log('Assessment query result:', { assessment, error: assessmentError })

    if (assessmentError || !assessment) {
      console.error('❌ Assessment fetch error:', {
        assessmentId,
        error: assessmentError,
        message: assessmentError?.message,
        details: assessmentError?.details,
        code: assessmentError?.code
      })
      return new NextResponse(`Assessment not found: ${assessmentError?.message || 'Unknown error'}`, { status: 404 })
    }
    
    console.log('✅ Assessment found:', assessment.id)
    
    // Buscar dados do usuário avaliado separadamente
    const { data: evaluatedUser } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', assessment.evaluated_user_id)
      .single()
    
    console.log('User data:', evaluatedUser)

    // 4. Verificar se está concluída
    if (assessment.status !== 'completed') {
      return new NextResponse('Assessment not completed', { status: 400 })
    }

    // 5. Verificar permissões: workspace membership + hierarchy access
    const { data: member } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', assessment.workspace_id)
      .eq('user_id', currentUser.id)
      .single()

    if (!member) {
      console.error('User not a member of workspace')
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // 6. Verificar acesso hierárquico: usuário deve ser o avaliado OU superior hierárquico
    const canView = await canViewUserData(
      currentUser.id,
      assessment.evaluated_user_id,
      assessment.workspace_id,
      supabase
    )
    
    // Permitir se for o próprio usuário ou se tiver acesso hierárquico
    const isSelf = currentUser.id === assessment.evaluated_user_id
    if (!isSelf && !canView) {
      console.error('User does not have hierarchy access to view this assessment')
      return new NextResponse('Forbidden: insufficient hierarchy level', { status: 403 })
    }
    
    console.log('✅ Permission check passed (self or hierarchy access)')

    // 7. Buscar resultado (com fallback para cálculo on-the-fly)
    console.log('🔍 Searching for results for assessment:', assessmentId)
    
    // Debug: verificar quantos registros existem
    const { count, error: countError } = await supabase
      .from('assessment_results')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessmentId)
    
    console.log(`📊 Found ${count} result record(s)`, countError ? `Error: ${countError.message}` : '')
    
    // Tentar buscar resultado salvo
    const { data: savedResult, error: resultError } = await supabase
      .from('assessment_results')
      .select('scores')
      .eq('assessment_id', assessmentId)
      .maybeSingle() // maybeSingle não dá erro se não encontrar

    console.log('Results query result:', { 
      found: !!savedResult, 
      error: resultError?.message,
      hasScores: !!savedResult?.scores 
    })

    let results
    
    if (!savedResult?.scores) {
      console.log('⚠️  No saved results found, attempting to calculate from responses...')
      
      // Fallback: buscar respostas e calcular
      const { data: responses, error: respError } = await supabase
        .from('assessment_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
      
      console.log(`Found ${responses?.length || 0} responses`)
      
      if (respError || !responses || responses.length === 0) {
        console.error('❌ No responses found either:', respError?.message)
        return new NextResponse(
          'Assessment not completed. No results or responses found.', 
          { status: 404 }
        )
      }
      
      // Calcular resultado das respostas
      try {
        const { calculateResult } = await import('@/lib/assessment-calculator')
        
        // Buscar estrutura do teste
        console.log(`📦 Importing test structure from: @/supabase/data/${assessment.test_type}.json`)
        const structure = await import(`@/supabase/data/${assessment.test_type}.json`)
        
        // Converter array de respostas para objeto
        const answersObj = responses.reduce((acc: Record<string, number>, r: any) => ({
          ...acc,
          [r.question_id]: r.score
        }), {})
        
        results = calculateResult(assessment.test_type, answersObj, structure.default || structure)
        console.log('✅ Results calculated successfully from responses')
      } catch (calcError) {
        console.error('❌ Error calculating results:', calcError)
        return new NextResponse(
          'Could not calculate assessment results', 
          { status: 500 }
        )
      }
    } else {
      results = savedResult.scores
      console.log('✅ Results loaded from saved data')
    }

    // 6. Buscar comparação com time
    const teamComparison = await getTeamAverageScore(
      assessment.workspace_id,
      assessment.test_type
    )

    // 7. Obter nome do usuário
    const userName = evaluatedUser?.full_name || evaluatedUser?.email || 'Usuário'

    // 8. Gerar PDF
    const pdfElement = React.createElement(AssessmentPDF, {
      assessment,
      results,
      userName,
      teamComparison
    })
    
    // @ts-expect-error - Type mismatch but works at runtime
    const stream = await renderToStream(pdfElement)

    // 9. Converter stream para buffer para Next.js
    const chunks: Buffer[] = []
    
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    
    const buffer = Buffer.concat(chunks)

    // 10. Retornar PDF com headers corretos
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="avaliacao-${assessment.test_type}-${assessmentId.slice(0, 8)}.pdf"`,
        'Content-Length': buffer.length.toString(),
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
