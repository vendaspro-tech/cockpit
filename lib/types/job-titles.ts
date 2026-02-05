export interface JobTitleNodeData {
  id: string
  name: string
  slug: string
  hierarchy_level: number
  sector: string | null
  allows_seniority: boolean
  mission: string | null
}
