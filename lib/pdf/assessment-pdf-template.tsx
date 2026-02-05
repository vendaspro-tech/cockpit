import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    color: '#64748b',
  },
  value: {
    color: '#1e293b',
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
    marginVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  bigScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  comparisonContainer: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  comparisonValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  breakdownItem: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 10,
    color: '#1e293b',
  },
  itemScore: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  barContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barFillGreen: {
    backgroundColor: '#16a34a',
  },
  barFillYellow: {
    backgroundColor: '#ca8a04',
  },
  barFillRed: {
    backgroundColor: '#dc2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 8,
  },
})

interface AssessmentPDFProps {
  assessment: {
    id: string
    test_type: string
    created_at?: string
  }
  results: {
    percentage?: number
    globalPercentage?: number
    score?: number
    maxScore?: number
    items?: Array<{
      id: string
      name: string
      score: number
      maxScore?: number
    }>
    categories?: Array<{
      name: string
      items: Array<{
        id: string
        name: string
        score: number
        maxScore?: number
      }>
    }>
  }
  userName: string
  teamComparison?: {
    average: number
    max: number
    min: number
  } | null
}

export function AssessmentPDF({ assessment, results, userName, teamComparison }: AssessmentPDFProps) {
  // Calcular score geral
  const getOverallScore = () => {
    if (results.percentage) return results.percentage
    if (results.globalPercentage) return results.globalPercentage
    if (results.score && results.maxScore) {
      return (results.score / results.maxScore) * 100
    }
    return 0
  }

  const overallScore = getOverallScore()

  // Obter nome do tipo de teste
  const getTestTypeName = () => {
    const types: Record<string, string> = {
      'seniority_seller': 'Senioridade de Vendedor',
      'seniority_leader': 'Senioridade de Líder',
      'def_method': 'Método DEF',
      'values_8d': 'Mapa de Valores (8D)',
      'disc': 'DISC',
      'leadership_style': 'Estilo de Liderança'
    }
    return types[assessment.test_type] || assessment.test_type
  }

  // Obter itens para breakdown
  const getBreakdownItems = () => {
    const items = []
    
    if (results.categories) {
      // DEF tem categorias
      for (const category of results.categories) {
        if (category.items) {
          items.push(...category.items.map(item => ({
            ...item,
            category: category.name
          })))
        }
      }
    } else if (results.items) {
      // Senioridade e Values têm items diretos
      items.push(...results.items)
    }
    
    return items
  }

  const breakdownItems = getBreakdownItems()

  // Determinar cor da barra baseado no score
  const getBarColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return styles.barFillGreen
    if (percentage >= 60) return styles.barFillYellow
    return styles.barFillRed
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Avaliação</Text>
          <Text style={styles.subtitle}>{getTestTypeName()}</Text>
        </View>

        {/* Informações do Avaliado */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Avaliado:</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>
              {new Date().toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Score Geral */}
        <View style={styles.scoreContainer}>
          <Text style={styles.bigScore}>{overallScore.toFixed(1)}</Text>
          <Text style={styles.scoreLabel}>pontos</Text>
        </View>

        {/* Comparação com Time */}
        {teamComparison && (
          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonTitle}>Comparação com o Time</Text>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Seu Score:</Text>
              <Text style={styles.comparisonValue}>{overallScore.toFixed(1)} pts</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Média do Time:</Text>
              <Text style={styles.comparisonValue}>{teamComparison.average.toFixed(1)} pts</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Top Performer:</Text>
              <Text style={styles.comparisonValue}>{teamComparison.max.toFixed(1)} pts</Text>
            </View>
          </View>
        )}

        {/* Detalhamento por Competências */}
        {breakdownItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhamento por Competência</Text>
            {breakdownItems.map((item, index) => {
              const maxScore = item.maxScore || 100
              const percentage = (item.score / maxScore) * 100
              
              return (
                <View key={item.id || index} style={styles.breakdownItem}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemScore}>
                      {item.score.toFixed(1)} / {maxScore}
                    </Text>
                  </View>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.barFill,
                        getBarColor(item.score, maxScore),
                        { width: `${Math.min(percentage, 100)}%` }
                      ]} 
                    />
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Gerado em {new Date().toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
