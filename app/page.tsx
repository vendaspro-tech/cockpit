import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSupabaseUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic'

async function getUserFirstWorkspace(authUserId: string) {
  try {
    const { userId: supabaseUserId, error } = await ensureSupabaseUser(authUserId)

    if (!supabaseUserId) {
      console.error('Error syncing user before workspace lookup:', error)
      return null
    }

    const supabase = createAdminClient()

    // Get first workspace for this user
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', supabaseUserId)
      .limit(1)
      .maybeSingle()

    if (memberError) {
      console.error('Error fetching first workspace:', memberError)
    }

    return member?.workspace_id || null
  } catch (error) {
    console.error('Error getting workspace:', error)
    return null
  }
}

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  
  if (user) {
    const workspaceId = await getUserFirstWorkspace(user.id)
    if (workspaceId) {
      redirect(`/${workspaceId}/overview`)
    } else {
      redirect('/onboarding')
    }
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#A08D5A] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[9999] border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A08D5A] to-[#7a6b43] flex items-center justify-center text-white">
              C
            </div>
            Cockpit Comercial
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Login
            </Link>
            <Button asChild className="bg-[#A08D5A] hover:bg-[#8c7b4d] text-white border-0">
              <Link href="/signup">
                Começar Agora
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#A08D5A]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#A08D5A] text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A08D5A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A08D5A]"></span>
            </span>
            Nova Versão 2.0 Disponível
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent max-w-4xl mx-auto">
            Transforme sua <br />
            <span className="text-[#A08D5A]">Gestão Comercial</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A plataforma definitiva de Sales Enablement. Avalie performance, desenvolva talentos e escale seus resultados com inteligência.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-lg bg-[#A08D5A] hover:bg-[#8c7b4d] text-white border-0 shadow-[0_0_20px_rgba(160,141,90,0.3)] transition-all hover:shadow-[0_0_30px_rgba(160,141,90,0.5)]">
              <Link href="/signup">
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8 text-lg border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white hover:border-white/30 backdrop-blur-sm">
              <Link href="/login">
                Já tenho conta
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-[#A08D5A]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(160,141,90,0.1)]">
              <div className="w-12 h-12 rounded-lg bg-[#A08D5A]/10 flex items-center justify-center mb-6 group-hover:bg-[#A08D5A] transition-colors duration-300">
                <BarChart3 className="w-6 h-6 text-[#A08D5A] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Avaliações 360°</h3>
              <p className="text-gray-400 leading-relaxed">
                5 tipos de testes especializados incluindo Senioridade, Método DEF, Valores e Liderança para um raio-x completo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-[#A08D5A]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(160,141,90,0.1)]">
              <div className="w-12 h-12 rounded-lg bg-[#A08D5A]/10 flex items-center justify-center mb-6 group-hover:bg-[#A08D5A] transition-colors duration-300">
                <Target className="w-6 h-6 text-[#A08D5A] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">PDI Estruturado</h3>
              <p className="text-gray-400 leading-relaxed">
                Planos de Desenvolvimento Individual gerados automaticamente com tracking de evolução e prazos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-[#A08D5A]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(160,141,90,0.1)]">
              <div className="w-12 h-12 rounded-lg bg-[#A08D5A]/10 flex items-center justify-center mb-6 group-hover:bg-[#A08D5A] transition-colors duration-300">
                <Users className="w-6 h-6 text-[#A08D5A] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Gestão de Times</h3>
              <p className="text-gray-400 leading-relaxed">
                Dashboards táticos e estratégicos para líderes acompanharem a evolução de cada membro da equipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#050505]">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-500 text-sm">
            © 2024 Cockpit Comercial. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-gray-500 hover:text-[#A08D5A] transition-colors text-sm">Termos</Link>
            <Link href="#" className="text-gray-500 hover:text-[#A08D5A] transition-colors text-sm">Privacidade</Link>
            <Link href="#" className="text-gray-500 hover:text-[#A08D5A] transition-colors text-sm">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
