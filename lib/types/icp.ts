export interface IcpProductLink {
  product_id: string
}

export interface Icp {
  id: string
  workspace_id?: string
  name: string
  image_url?: string | null
  age_range?: string | null
  gender?: string | null
  location?: string | null
  profession?: string | null
  income_range?: string | null
  main_pain?: string | null
  main_goal?: string | null
  objections?: string[] | null
  life_context?: string | null
  urgency?: string | null
  created_at?: string
  updated_at?: string
}

export interface IcpWithProducts extends Icp {
  icp_products?: IcpProductLink[] | null
}

export interface ProductOption {
  id: string
  name: string
}
