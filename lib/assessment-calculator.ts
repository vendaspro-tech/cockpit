interface Question {
  id: string
  weight?: number
  text?: string
  type?: string
  options?: Array<{ value: number | string; label: string }>
  scale_descriptors?: Array<{ value: number; label: string; description?: string }>
  matrix_config?: {
    scale?: {
      min: number
      max: number
      descriptors?: Array<{ value: number; label: string; description?: string }>
    }
    statements: Array<{
      id: string
      text: string
      order: number
      metadata?: {
        profile?: string
        scoring_key?: string
        [key: string]: any
      }
    }>
  }
}

interface ScoringConfig {
  scale?: {
    min: number
    max: number
  }
}

interface Category {
  id: string
  name: string
  questions: Question[]
}

interface TestStructure {
  categories: Category[]
  scoring?: ScoringConfig
  seniority_levels?: {
    label: string
    min_score: number
    max_score: number
    description?: string
  }[]
  results?: {
    range: { min: number; max: number }
    label: string
    description: string
  }[]
}

/**
 * Generic function to extract maximum score from a question based on its type
 * Priority order: scale_descriptors → matrix_config.scale → options → scoring.scale (fallback)
 */
function getMaxScore(question: Question, globalScoring?: ScoringConfig): number {
  // 1. For scale questions (DEF Method, Values 8D)
  if (question.scale_descriptors && question.scale_descriptors.length > 0) {
    return Math.max(...question.scale_descriptors.map(d => d.value))
  }

  // 2. For matrix rating questions (DISC)
  if (question.matrix_config?.scale) {
    return question.matrix_config.scale.max
  }

  // 3. For choice questions (Seniority, Leadership)
  if (question.options && question.options.length > 0) {
    return Math.max(...question.options.map(o => Number(o.value)))
  }

  // 4. Fallback: use global scoring configuration
  if (globalScoring?.scale) {
    return globalScoring.scale.max
  }

  throw new Error(`No scale information found for question ${question.id}`)
}

export function calculateResult(testType: string, answers: Record<string, number>, structure: TestStructure) {
  if (!answers || Object.keys(answers).length === 0) return null

  switch (testType) {
    case 'disc':
      return calculateDISC(answers, structure)
    case 'seniority_seller':
    case 'seniority_leader':
      return calculateSeniority(answers, structure)
    case 'leadership_style':
      return calculateLeadershipStyle(answers, structure)
    case 'def_method':
      return calculateDefMethod(answers, structure)
    case 'values_8d':
      return calculateValues8D(answers, structure)
    default:
      return null
  }
}

function calculateDISC(answers: Record<string, number>, structure: TestStructure) {
  // DISC scoring: Sum values by profile (D, I, S, C) from metadata.profile
  const profileScores: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 }
  const detailedItems: any[] = []

  // Build a lookup map: statement_id -> profile
  const statementProfileMap: Record<string, string> = {}
  const statementMaxScore: Record<string, number> = {}

  structure.categories.forEach(category => {
    category.questions.forEach(question => {
      // For matrix_rating questions, extract profile from statement metadata
      if (question.matrix_config && question.matrix_config.statements) {
        const maxScore = getMaxScore(question, structure.scoring)

        question.matrix_config.statements.forEach(statement => {
          if (statement.metadata?.profile) {
            // Map both formats: direct ID and questionID_statementID
            statementProfileMap[statement.id] = statement.metadata.profile
            statementMaxScore[statement.id] = maxScore
            // Also map with composite key format (q1_q1_d)
            statementProfileMap[`${question.id}_${statement.id}`] = statement.metadata.profile
            statementMaxScore[`${question.id}_${statement.id}`] = maxScore
          }
        })
      }
    })
  })

  // Sum scores by profile using the lookup map
  Object.entries(answers).forEach(([answerKey, score]) => {
    const profile = statementProfileMap[answerKey]
    const maxScore = statementMaxScore[answerKey]

    if (profile && profileScores.hasOwnProperty(profile)) {
      profileScores[profile] += score

      detailedItems.push({
        id: answerKey,
        profile: profile,
        score: score,
        maxScore: maxScore
      })
    }
  })

  // Calculate profile: combination of 2 highest scores
  const sortedProfiles = Object.entries(profileScores)
    .sort(([, a], [, b]) => b - a)

  const dominantProfile = sortedProfiles[0][0]
  const secondaryProfile = sortedProfiles[1][0]
  const profile = dominantProfile + secondaryProfile

  return {
    scores: profileScores,
    profile,
    items: detailedItems
  }
}

function calculateSeniority(answers: Record<string, number>, structure: TestStructure) {
  let totalScore = 0
  let maxPossibleScore = 0
  const detailedItems: any[] = []

  structure.categories.forEach(category => {
    category.questions.forEach(question => {
      const answer = answers[question.id] || 0
      const questionMaxScore = getMaxScore(question, structure.scoring)

      totalScore += answer
      maxPossibleScore += questionMaxScore

      detailedItems.push({
        id: question.id,
        name: question.text || question.id,
        score: answer,
        maxScore: questionMaxScore,
        category: category.name
      })
    })
  })

  const percentage = (totalScore / maxPossibleScore) * 100

  // Determine level
  let level = 'N/A'
  let description = ''

  if (structure.seniority_levels) {
    const foundLevel = structure.seniority_levels.find(l => totalScore >= l.min_score && totalScore <= l.max_score)
    if (foundLevel) {
      level = foundLevel.label
      description = foundLevel.description || ''
    }
  } else {
    // Fallback if levels not defined in JSON (e.g. seniority_seller)
    if (percentage < 50) level = 'Júnior'
    else if (percentage < 80) level = 'Pleno'
    else level = 'Sênior'
  }

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: Math.round(percentage),
    level,
    description,
    items: detailedItems
  }
}

function calculateLeadershipStyle(answers: Record<string, number>, structure: TestStructure) {
  let totalScore = 0
  
  Object.values(answers).forEach(val => {
    totalScore += val
  })

  let style = 'Indefinido'
  let description = ''

  if (structure.results) {
    const found = structure.results.find(r => totalScore >= r.range.min && totalScore <= r.range.max)
    if (found) {
      style = found.label
      description = found.description
    }
  }

  return {
    score: totalScore,
    style,
    description
  }
}

function calculateDefMethod(answers: Record<string, number>, structure: TestStructure) {
  const categories = structure.categories.map(category => {
    let catScore = 0
    let catMax = 0

    const items = category.questions.map(question => {
      const val = answers[question.id] || 0
      const questionMaxScore = getMaxScore(question, structure.scoring)

      catScore += val
      catMax += questionMaxScore

      return {
        id: question.id,
        name: question.text || question.id,
        score: val,
        maxScore: questionMaxScore
      }
    })

    return {
      name: category.name,
      score: {
        score: catScore,
        maxScore: catMax,
        percentage: catMax > 0 ? Math.round((catScore / catMax) * 100) : 0
      },
      items
    }
  })

  const globalScore = categories.reduce((acc, cat) => acc + cat.score.score, 0)
  const globalMax = categories.reduce((acc, cat) => acc + cat.score.maxScore, 0)

  return {
    globalScore,
    globalMax,
    globalPercentage: globalMax > 0 ? Math.round((globalScore / globalMax) * 100) : 0,
    categories
  }
}

function calculateValues8D(answers: Record<string, number>, structure: TestStructure) {
  // For Values 8D, we want the score per category (dimension)
  const dimensionScores: Record<string, number> = {}
  const detailedItems: any[] = []

  structure.categories.forEach(category => {
    let catScore = 0
    let count = 0

    category.questions.forEach(question => {
      const val = answers[question.id] || 0
      const questionMaxScore = getMaxScore(question, structure.scoring)

      catScore += val
      count++

      detailedItems.push({
        id: question.id,
        name: question.text || question.id,
        score: val,
        maxScore: questionMaxScore,
        category: category.name
      })
    })

    // Average score per dimension
    dimensionScores[category.name] = count > 0 ? Number((catScore / count).toFixed(1)) : 0
  })

  return {
    dimensions: dimensionScores,
    items: detailedItems
  }
}
