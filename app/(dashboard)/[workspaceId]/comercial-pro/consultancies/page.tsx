import { getConsultancies } from "@/app/actions/comercial-pro"
import { ConsultanciesView } from "@/components/comercial-pro/consultancies-view"

interface ConsultanciesPageProps {
  params: Promise<{ workspaceId: string }>
}

export default async function ConsultanciesPage({ params }: ConsultanciesPageProps) {
  const { workspaceId } = await params
  const consultancies = await getConsultancies(workspaceId)

  return (
    <div className="container mx-auto py-6">
      <ConsultanciesView 
        initialConsultancies={consultancies} 
        workspaceId={workspaceId} 
      />
    </div>
  )
}
