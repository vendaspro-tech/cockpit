"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getAdminAssessments(filters?: {
  search?: string;
  workspaceId?: string;
  testType?: string;
  status?: string;
  hasPdi?: boolean;
  dateRange?: { from: Date; to: Date };
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("assessments")
    .select(
      `
      *,
      evaluated_user:users!assessments_evaluated_user_id_fkey(id, full_name, email),
      evaluator_user:users!assessments_evaluator_user_id_fkey(id, full_name, email),
      workspace:workspaces!assessments_workspace_id_fkey(id, name, plan),
      pdi:pdi_plans!assessments_pdi_id_fkey(id)
    `
    )
    .order("started_at", { ascending: false });

  if (filters?.workspaceId && filters.workspaceId !== "all") {
    query = query.eq("workspace_id", filters.workspaceId);
  }

  if (filters?.testType && filters.testType !== "all") {
    query = query.eq("test_type", filters.testType);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.hasPdi !== undefined) {
    if (filters.hasPdi) {
      query = query.not("pdi", "is", null);
    } else {
      query = query.is("pdi", null);
    }
  }

  if (filters?.dateRange?.from) {
    query = query.gte("started_at", filters.dateRange.from.toISOString());
  }

  if (filters?.dateRange?.to) {
    query = query.lte("started_at", filters.dateRange.to.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin assessments:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  // Client-side filtering for search (since it involves joined tables)
  // Or we could use RPC if performance becomes an issue
  let filteredData = data || [];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter(
      (item: any) =>
        item.evaluated_user?.full_name?.toLowerCase().includes(searchLower) ||
        item.evaluated_user?.email?.toLowerCase().includes(searchLower) ||
        item.workspace?.name?.toLowerCase().includes(searchLower)
    );
  }

  return filteredData;
}

export async function getAdminPDIs(filters?: {
  search?: string;
  workspaceId?: string;
  status?: string;
  dateRange?: { from: Date; to: Date };
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("pdi_plans")
    .select(
      `
      *,
      user:users!pdi_plans_user_id_fkey(id, full_name, email),
      workspace:workspaces!pdi_plans_workspace_id_fkey(id, name, plan),
      source_assessment:assessments!pdi_plans_source_assessment_id_fkey(id, test_type)
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.workspaceId && filters.workspaceId !== "all") {
    query = query.eq("workspace_id", filters.workspaceId);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.dateRange?.from) {
    query = query.gte("created_at", filters.dateRange.from.toISOString());
  }

  if (filters?.dateRange?.to) {
    query = query.lte("created_at", filters.dateRange.to.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching admin PDIs:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return [];
  }

  let filteredData = data || [];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter(
      (item: any) =>
        item.user?.full_name?.toLowerCase().includes(searchLower) ||
        item.user?.email?.toLowerCase().includes(searchLower) ||
        item.workspace?.name?.toLowerCase().includes(searchLower)
    );
  }

  return filteredData;
}

export async function getWorkspaces() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, plan")
    .order("name");

  if (error) {
    console.error("Error fetching workspaces:", error);
    return [];
  }

  return data;
}
