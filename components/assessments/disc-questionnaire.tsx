"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createAssessmentResponse, completeAssessment } from "@/app/actions/assessments"
import { AssessmentHero } from "./assessment-hero"

interface Question {
  id: number
  text: string
  options: {
    type: 'D' | 'I' | 'S' | 'C'
    text: string
  }[]
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Quando recebo uma lista de leads para prospectar, eu:",
    options: [
      { type: 'D', text: "Começo imediatamente pelos contatos de maior potencial, priorizando resultados rápidos" },
      { type: 'I', text: "Pesquiso sobre as empresas para encontrar formas criativas de iniciar conversas" },
      { type: 'S', text: "Organizo metodicamente minha abordagem, seguindo o script e processo estabelecido" },
      { type: 'C', text: "Analiso detalhadamente cada lead, segmentando por critérios específicos antes de começar" }
    ]
  },
  {
    id: 2,
    text: "Em uma negociação difícil com objeções fortes, eu:",
    options: [
      { type: 'D', text: "Confronto as objeções diretamente, mostrando dados que provam o valor da solução" },
      { type: 'I', text: "Uso storytelling e casos de sucesso para reconquistar o interesse do prospect" },
      { type: 'S', text: "Escuto pacientemente todas as preocupações e busco construir confiança gradualmente" },
      { type: 'C', text: "Preparo respostas técnicas detalhadas para cada objeção específica" }
    ]
  },
  {
    id: 3,
    text: "Quando trabalho em equipe comercial, eu:",
    options: [
      { type: 'D', text: "Assumo a liderança e direciono o time para bater as metas estabelecidas" },
      { type: 'I', text: "Motivo o grupo e crio um ambiente colaborativo e energizante" },
      { type: 'S', text: "Apoio os colegas e mantenho a harmonia, garantindo que todos contribuam" },
      { type: 'C', text: "Organizo processos e garanto que seguimos as melhores práticas" }
    ]
  },
  {
    id: 4,
    text: "Diante de uma meta agressiva no trimestre, minha reação é:",
    options: [
      { type: 'D', text: "\"Vamos acelerar! Quero ser o top performer e vou fazer o que for necessário\"" },
      { type: 'I', text: "\"Que desafio empolgante! Vou usar minha criatividade para encontrar novas oportunidades\"" },
      { type: 'S', text: "\"Vou manter meu ritmo consistente e contar com o apoio do time\"" },
      { type: 'C', text: "\"Preciso analisar os números e criar uma estratégia realista e mensurável\"" }
    ]
  },
  {
    id: 5,
    text: "Ao fazer follow-up com prospects, eu:",
    options: [
      { type: 'D', text: "Sou direto e objetivo, perguntando claramente sobre a decisão de compra" },
      { type: 'I', text: "Uso mensagens personalizadas e amigáveis para manter o relacionamento aquecido" },
      { type: 'S', text: "Respeito o tempo do prospect e aguardo o momento certo para retomar contato" },
      { type: 'C', text: "Sigo um cronograma estruturado de follow-ups com informações relevantes" }
    ]
  },
  {
    id: 6,
    text: "Quando recebo feedback negativo do gestor, eu:",
    options: [
      { type: 'D', text: "Questiono os critérios e defendo meus resultados se acho que estou certo" },
      { type: 'I', text: "Fico chateado inicialmente, mas busco transformar isso em motivação" },
      { type: 'S', text: "Aceito o feedback e peço orientação sobre como melhorar" },
      { type: 'C', text: "Analiso os dados objetivamente para entender onde preciso ajustar" }
    ]
  },
  {
    id: 7,
    text: "Em uma reunião de discovery com cliente, eu:",
    options: [
      { type: 'D', text: "Vou direto ao ponto, identificando rapidamente o problema e propondo soluções" },
      { type: 'I', text: "Crio conexão pessoal, contando histórias e fazendo o cliente se sentir à vontade" },
      { type: 'S', text: "Escuto atentamente todas as necessidades antes de sugerir qualquer coisa" },
      { type: 'C', text: "Faço perguntas específicas e técnicas para mapear completamente o cenário" }
    ]
  },
  {
    id: 8,
    text: "Quando perco uma venda importante, eu:",
    options: [
      { type: 'D', text: "Parto imediatamente para o próximo prospect, sem perder tempo lamentando" },
      { type: 'I', text: "Compartilho com o time, busco apoio emocional e rapidamente recupero o entusiasmo" },
      { type: 'S', text: "Reflito sobre o que aconteceu e peço conselhos antes de seguir em frente" },
      { type: 'C', text: "Analiso detalhadamente o que deu errado para evitar erros futuros" }
    ]
  },
  {
    id: 9,
    text: "Ao apresentar uma proposta comercial, eu:",
    options: [
      { type: 'D', text: "Foco nos resultados, ROI e impacto direto no negócio do cliente" },
      { type: 'I', text: "Crio apresentações visualmente atraentes e apresento com entusiasmo" },
      { type: 'S', text: "Garanto que o cliente se sinta confortável e respondo todas as dúvidas pacientemente" },
      { type: 'C', text: "Preparo dados detalhados, comparativos e demonstrações técnicas" }
    ]
  },
  {
    id: 10,
    text: "Em situações de pressão para fechar o mês, eu:",
    options: [
      { type: 'D', text: "Acelero o ritmo, faço mais ligações e empurro negociações para o fechamento" },
      { type: 'I', text: "Uso minha rede de contatos e networking para gerar oportunidades rápidas" },
      { type: 'S', text: "Mantenho a calma e continuo seguindo meu processo, sem desespero" },
      { type: 'C', text: "Analiso meu pipeline e priorizo os deals com maior probabilidade de conversão" }
    ]
  },
  {
    id: 11,
    text: "Quando vejo um colega com dificuldades, eu:",
    options: [
      { type: 'D', text: "Dou dicas diretas e objetivas sobre o que ele precisa mudar" },
      { type: 'I', text: "Ofereço ajuda de forma entusiasmada e tento motivá-lo" },
      { type: 'S', text: "Me coloco à disposição e ofereço suporte sem julgamentos" },
      { type: 'C', text: "Compartilho técnicas e processos que funcionaram para mim" }
    ]
  },
  {
    id: 12,
    text: "Ao lidar com um cliente insatisfeito, eu:",
    options: [
      { type: 'D', text: "Busco resolver o problema rapidamente, oferecendo soluções práticas e compensações" },
      { type: 'I', text: "Uso empatia e carisma para acalmar a situação e reconquistar a confiança" },
      { type: 'S', text: "Escuto todas as reclamações com paciência e demonstro genuína preocupação" },
      { type: 'C', text: "Investigo os detalhes do problema e apresento um plano de ação estruturado" }
    ]
  },
  {
    id: 13,
    text: "Meu ambiente de trabalho ideal é:",
    options: [
      { type: 'D', text: "Competitivo, com metas desafiadoras e reconhecimento por performance" },
      { type: 'I', text: "Dinâmico, com interação social constante e liberdade criativa" },
      { type: 'S', text: "Estável, com relações de confiança e processos bem definidos" },
      { type: 'C', text: "Organizado, com sistemas claros e critérios objetivos de avaliação" }
    ]
  },
  {
    id: 14,
    text: "Quando preciso aprender um novo CRM ou ferramenta, eu:",
    options: [
      { type: 'D', text: "Pulo direto para usar, aprendo fazendo e com tentativa e erro" },
      { type: 'I', text: "Peço dicas aos colegas e aprendo de forma colaborativa" },
      { type: 'S', text: "Sigo o treinamento oficial passo a passo com paciência" },
      { type: 'C', text: "Estudo a documentação completa antes de começar a usar" }
    ]
  },
  {
    id: 15,
    text: "Em uma reunião comercial que está travada, eu:",
    options: [
      { type: 'D', text: "Assumo o controle e redirecionei a conversa para objetivos concretos" },
      { type: 'I', text: "Uso humor ou uma história para aliviar a tensão e reengajar" },
      { type: 'S', text: "Permito que os outros falem e busco pontos de consenso" },
      { type: 'C', text: "Trago dados e informações técnicas para esclarecer dúvidas" }
    ]
  },
  {
    id: 16,
    text: "Ao receber uma promoção ou reconhecimento, eu:",
    options: [
      { type: 'D', text: "Vejo como validação da minha competência e busco o próximo desafio" },
      { type: 'I', text: "Comemoro com o time e compartilho minha alegria abertamente" },
      { type: 'S', text: "Agradeço humildemente e penso em como posso ajudar mais pessoas" },
      { type: 'C', text: "Avalio se o reconhecimento foi justo e baseado em critérios claros" }
    ]
  },
  {
    id: 17,
    text: "Quando um prospect me pede \"mais um desconto\", eu:",
    options: [
      { type: 'D', text: "Nego firmemente e defendo o valor do produto sem hesitar" },
      { type: 'I', text: "Negocio de forma flexível, buscando um meio termo que agrade ambos" },
      { type: 'S', text: "Consulto meu gestor antes de tomar qualquer decisão" },
      { type: 'C', text: "Apresento dados que justificam o preço e os limites de desconto disponíveis" }
    ]
  },
  {
    id: 18,
    text: "Minha maior motivação na área comercial é:",
    options: [
      { type: 'D', text: "Atingir metas agressivas e ser reconhecido como top performer" },
      { type: 'I', text: "Construir relacionamentos genuínos e ter impacto positivo nos clientes" },
      { type: 'S', text: "Fazer parte de um time forte e contribuir para resultados coletivos" },
      { type: 'C', text: "Dominar técnicas de vendas e ter um processo impecável" }
    ]
  },
  {
    id: 19,
    text: "Ao organizar minha rotina comercial, eu:",
    options: [
      { type: 'D', text: "Priorizo atividades de alto impacto, mesmo que isso signifique pular etapas" },
      { type: 'I', text: "Vario minhas atividades para manter o dia interessante e energizante" },
      { type: 'S', text: "Sigo uma rotina consistente que me deixa confortável e produtivo" },
      { type: 'C', text: "Crio checklists detalhados e sigo um planejamento rigoroso" }
    ]
  },
  {
    id: 20,
    text: "Quando recebo um lead de entrada (inbound), eu:",
    options: [
      { type: 'D', text: "Ligo imediatamente para qualificar e avançar rapidamente" },
      { type: 'I', text: "Pesquiso nas redes sociais para personalizar minha abordagem" },
      { type: 'S', text: "Aguardo um momento apropriado e preparo uma abordagem consultiva" },
      { type: 'C', text: "Analiso o histórico de interações e estudo o fit antes do contato" }
    ]
  },
  {
    id: 21,
    text: "Em uma negociação B2B complexa com múltiplos stakeholders, eu:",
    options: [
      { type: 'D', text: "Identifico o decisor principal e foco minha estratégia nele" },
      { type: 'I', text: "Construo relacionamento com todas as partes envolvidas" },
      { type: 'S', text: "Garanto que todos os envolvidos estejam alinhados e confortáveis" },
      { type: 'C', text: "Mapeio a estrutura de decisão e preparo argumentos para cada perfil" }
    ]
  },
  {
    id: 22,
    text: "Ao definir minhas metas pessoais de vendas, eu:",
    options: [
      { type: 'D', text: "Estabeleço números acima da meta oficial para me desafiar" },
      { type: 'I', text: "Foco em metas que me permitam reconhecimento e crescimento" },
      { type: 'S', text: "Prefiro metas realistas que posso atingir consistentemente" },
      { type: 'C', text: "Baseio minhas metas em análise histórica e capacidade real" }
    ]
  },
  {
    id: 23,
    text: "Quando o mercado está difícil e as vendas caem, eu:",
    options: [
      { type: 'D', text: "Intensifico meus esforços e busco novos mercados agressivamente" },
      { type: 'I', text: "Uso criatividade para encontrar abordagens diferentes e inovadoras" },
      { type: 'S', text: "Mantenho a persistência e confio que as coisas vão melhorar" },
      { type: 'C', text: "Analiso tendências e ajusto minha estratégia com base em dados" }
    ]
  },
  {
    id: 24,
    text: "Meu estilo de comunicação com prospects é:",
    options: [
      { type: 'D', text: "Direto, confiante e focado em resultados" },
      { type: 'I', text: "Entusiasmado, amigável e voltado para conexão pessoal" },
      { type: 'S', text: "Calmo, paciente e focado em construir confiança" },
      { type: 'C', text: "Preciso, técnico e baseado em fatos e evidências" }
    ]
  }
]

import { useRouter } from "next/navigation"

interface DiscQuestionnaireProps {
  assessmentId: string
  workspaceId: string
}

export function DiscQuestionnaire({ assessmentId, workspaceId }: DiscQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, Record<string, number>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const currentQuestion = QUESTIONS[currentQuestionIndex]
  const progress = ((currentQuestionIndex) / QUESTIONS.length) * 100
  const answeredCount = Object.keys(answers).length

  const handleScoreChange = (type: string, score: number) => {
    setAnswers(prev => {
      const currentQuestionAnswers = prev[currentQuestion.id] || {}
      
      // Check if this score is already used by another option in this question
      const typeWithThisScore = Object.keys(currentQuestionAnswers).find(
        key => currentQuestionAnswers[key] === score && key !== type
      )

      const newAnswers = { ...currentQuestionAnswers, [type]: score }
      
      // If another option had this score, clear it
      if (typeWithThisScore) {
        delete newAnswers[typeWithThisScore]
      }

      return {
        ...prev,
        [currentQuestion.id]: newAnswers
      }
    })

    // Save response incrementally
    createAssessmentResponse(assessmentId, `${currentQuestion.id}_${type}`, score)
      .catch(err => console.error("Error saving response:", err))

    // Auto-advance logic
    if (autoAdvance) {
      // We need to check if the question is complete AFTER this state update
      // Since state updates are async, we can check the *new* state logic here
      // But for simplicity, we'll use a timeout or effect. 
      // Actually, let's just check if we have 4 scores in the newAnswers object
      // We need to reconstruct the newAnswers object here to check
      const currentQuestionAnswers = answers[currentQuestion.id] || {}
      const typeWithThisScore = Object.keys(currentQuestionAnswers).find(
        key => currentQuestionAnswers[key] === score && key !== type
      )
      const newAnswers = { ...currentQuestionAnswers, [type]: score }
      if (typeWithThisScore) delete newAnswers[typeWithThisScore]
      
      const scores = Object.values(newAnswers)
      const isComplete = scores.length === 4 && scores.includes(1) && scores.includes(2) && scores.includes(3) && scores.includes(4)

      if (isComplete && currentQuestionIndex < QUESTIONS.length - 1) {
        setTimeout(() => {
          handleNext()
        }, 500)
      }
    }
  }

  const isQuestionComplete = () => {
    const currentQuestionAnswers = answers[currentQuestion.id] || {}
    const scores = Object.values(currentQuestionAnswers)
    return scores.length === 4 && scores.includes(1) && scores.includes(2) && scores.includes(3) && scores.includes(4)
  }

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      // window.scrollTo(0, 0) // No longer needed with fixed layout
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Calculate final scores
      const scores = { D: 0, I: 0, S: 0, C: 0 }
      Object.values(answers).forEach(answer => {
        scores.D += answer.D || 0
        scores.I += answer.I || 0
        scores.S += answer.S || 0
        scores.C += answer.C || 0
      })

      // Identify profile
      const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a)
      const profile = sortedScores[0][0] + sortedScores[1][0]

      // Save results
      await completeAssessment(assessmentId, {
        answers,
        scores,
        profile,
        completed_at: new Date().toISOString()
      })

      toast({
        title: "Avaliação concluída!",
        description: "Seu perfil DISC foi gerado com sucesso.",
      })

      router.push(`/${workspaceId}/assessments/disc/${assessmentId}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar sua avaliação. Tente novamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col overflow-hidden bg-background">
      {/* Hero + Navigation - Sticky Together */}
      <div className="shrink-0 bg-background z-10">
        <AssessmentHero
          testType="disc"
          testTitle="Análise de Perfil Comportamental"
          testDescription="Descubra seu perfil comportamental DISC."
          currentCategory="Perfil Comportamental"
          categoryIndex={0}
          totalCategories={1}
          progress={progress}
          answeredQuestions={currentQuestionIndex} // Using index as proxy for answered count in linear flow
          totalQuestions={QUESTIONS.length}
          currentQuestionNumber={currentQuestionIndex + 1}
          workspaceId={workspaceId}
        />
      </div>

      {/* Questions Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col justify-center">
          
          {/* Auto Advance Toggle - Right Aligned */}
          <div className="flex justify-end mb-2">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
              <Label htmlFor="auto-advance" className="text-xs font-medium text-muted-foreground cursor-pointer uppercase tracking-wider">
                Avanço automático
              </Label>
              <Switch
                id="auto-advance"
                checked={autoAdvance}
                onCheckedChange={setAutoAdvance}
                className="scale-75 origin-right"
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="border-none shadow-xl bg-card flex-1 flex flex-col min-h-0 overflow-hidden ring-1 ring-border/50">
            <CardHeader className="pb-4 shrink-0 bg-muted/30 border-b border-border/50">
              <CardTitle className="text-xl md:text-2xl font-semibold leading-tight text-foreground">
                {currentQuestion.text}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Classifique de 1 (Menos você) a 4 (Mais você). Não repita números.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {currentQuestion.options.map((option) => (
                <div 
                  key={option.type} 
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                >
                  <div className="flex-1 font-medium text-base md:text-lg text-foreground/90 group-hover:text-foreground transition-colors">
                    {option.text}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {[1, 2, 3, 4].map((score) => {
                      const isSelected = answers[currentQuestion.id]?.[option.type] === score
                      const isUsedElsewhere = Object.entries(answers[currentQuestion.id] || {}).some(
                        ([key, val]) => val === score && key !== option.type
                      )

                      return (
                        <Button
                          key={score}
                          variant={isSelected ? "default" : "outline"}
                          size="icon"
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-full text-lg font-medium transition-all duration-200 ${
                            isSelected 
                              ? "shadow-md scale-105" 
                              : "hover:border-primary hover:text-primary bg-transparent"
                          } ${isUsedElsewhere && !isSelected ? "opacity-20 cursor-not-allowed" : ""}`}
                          onClick={() => handleScoreChange(option.type, score)}
                          disabled={isUsedElsewhere && !isSelected}
                        >
                          {score}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {!isQuestionComplete() && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Atribua uma nota única (1-4) para cada opção para continuar.</span>
                </div>
              )}
            </CardContent>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border/50 bg-muted/10 flex items-center justify-between shrink-0">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isQuestionComplete() || isSubmitting}
                size="lg"
                className="min-w-[140px] shadow-lg hover:shadow-xl transition-all"
              >
                {currentQuestionIndex === QUESTIONS.length - 1 ? (
                  isSubmitting ? "Finalizando..." : "Finalizar Avaliação"
                ) : (
                  <>
                    Próxima Questão
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
