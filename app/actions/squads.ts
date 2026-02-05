'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/auth-server'

// =============================================
// TYPES
// =============================================

export interface Squad {
  id: string
  workspace_id: string
  name: string
  leader_id: string | null
  description: string | null
  color: string
  position_x: number
  position_y: number
  created_at: string
  leader?: {
    id: string
    full_name: string | null
    email: string
  }
  members?: SquadMember[]
  _count?: {
    members: number
  }
}

export interface SquadMember {
  id: string
  squad_id: string
  user_id: string
  joined_at: string
  user: {
    id: string
    full_name: string | null
    email: string
  }
}

export interface CreateSquadData {
  name: string
  leader_id?: string
  description?: string
  color?: string
  position_x?: number
  position_y?: number
}

export interface UpdateSquadData {
  name?: string
  leader_id?: string
  description?: string
  color?: string
  position_x?: number
  position_y?: number
}

// =============================================
// SQUAD CRUD OPERATIONS
// =============================================

/**
 * Get all squads in a workspace (with hierarchy)
 */
export async function getWorkspaceSquads(workspaceId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    console.log('🔍 Attempting to fetch squads for workspace:', workspaceId)

    // Try squads table first, fallback to teams if migration not applied
    let { data: squads, error } = await supabase
      .from('squads')
      .select(`
        *,
        leader:users!leader_id (
          id,
          full_name,
          email
        ),
        members:squad_members (
          id,
          user:users (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('name')

    console.log('📊 Query result:', { 
      hasData: !!squads, 
      dataLength: squads?.length, 
      hasError: !!error,
      errorCode: error?.code 
    })

    // If squads table doesn't exist, try teams table
    if (error && error.code === '42P01') {
      console.log('⚠️ Squads table not found, using teams table (migration not applied)')
      const teamsResult = await supabase
        .from('teams')
        .select(`
          *,
          leader:users!leader_id (
            id,
            full_name,
            email
          ),
          members:team_members (
            id,
            user:users (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('name')
      
      if (teamsResult.error) {
        console.error('❌ Error fetching teams:', {
          code: teamsResult.error.code,
          message: teamsResult.error.message,
          details: teamsResult.error.details,
          hint: teamsResult.error.hint
        })
        return { data: [], error: null } // Return empty array instead of erroring
      }

      // Transform teams data to squads format
      type TeamRow = Omit<Squad, 'parent_squad_id' | 'description' | 'color' | 'position_x' | 'position_y'>
      const teamRows = (teamsResult.data ?? []) as TeamRow[]
      squads = teamRows.map((team) => ({
        ...team,
        parent_squad_id: null,
        description: null,
        color: '#3b82f6',
        position_x: 0,
        position_y: 0,
      }))
      error = null
    }

    if (error) {
      console.error('❌ Error fetching squads:')
      console.error('Full error object:', JSON.stringify(error, null, 2))
      console.error('Error properties:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        workspaceId,
        errorKeys: Object.keys(error),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      })
      return { data: [], error: null } // Return empty array gracefully
    }

    // Transform to include member count
    const squadsWithCount = squads?.map(squad => ({
      ...squad,
      _count: {
        members: squad.members?.length || 0
      }
    }))

    return { data: squadsWithCount as Squad[], error: null }
  } catch (error) {
    console.error('🔥 Exception in getWorkspaceSquads:', error)
    return { data: [], error: null } // Return empty array instead of throwing
  }
}

/**
 * Get a single squad by ID
 */
export async function getSquadById(squadId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: squad, error } = await supabase
      .from('squads')
      .select(`
        *,
        leader:users!leader_id (
          id,
          full_name,
          email
        ),
        members:squad_members (
          id,
          user_id,
          joined_at,
          user:users (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', squadId)
      .single()

    if (error) {
      console.error('Error fetching squad:', error)
      return { data: null, error: error.message }
    }

    return { data: squad as Squad, error: null }
  } catch (error) {
    console.error('Exception in getSquadById:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Create a new squad
 */
export async function createSquad(workspaceId: string, data: CreateSquadData) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: squad, error } = await supabase
      .from('squads')
      .insert({
        workspace_id: workspaceId,
        name: data.name,
        leader_id: data.leader_id || null,
        description: data.description || null,
        color: data.color || '#3b82f6',
        position_x: data.position_x || 0,
        position_y: data.position_y || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating squad:', error)
      return { data: null, error: error.message }
    }

    return { data: squad as Squad, error: null }
  } catch (error) {
    console.error('Exception in createSquad:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Update a squad
 */
export async function updateSquad(squadId: string, data: UpdateSquadData) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: squad, error } = await supabase
      .from('squads')
      .update(data)
      .eq('id', squadId)
      .select()
      .single()

    if (error) {
      console.error('Error updating squad:', error)
      return { data: null, error: error.message }
    }

    return { data: squad as Squad, error: null }
  } catch (error) {
    console.error('Exception in updateSquad:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Delete a squad
 */
export async function deleteSquad(squadId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('squads')
      .delete()
      .eq('id', squadId)

    if (error) {
      console.error('Error deleting squad:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Exception in deleteSquad:', error)
    return { error: 'Internal server error' }
  }
}

// =============================================
// SQUAD MEMBER OPERATIONS
// =============================================

/**
 * Add a member to a squad
 */
export async function addSquadMember(squadId: string, userId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squadId,
        user_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding squad member:', error)
      return { error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Exception in addSquadMember:', error)
    return { error: 'Internal server error' }
  }
}

/**
 * Remove a member from a squad
 */
export async function removeSquadMember(squadId: string, userId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('squad_members')
      .delete()
      .eq('squad_id', squadId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing squad member:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Exception in removeSquadMember:', error)
    return { error: 'Internal server error' }
  }
}

/**
 * Get all members of a squad
 */
export async function getSquadMembers(squadId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: members, error } = await supabase
      .from('squad_members')
      .select(`
        *,
        user:users (
          id,
          full_name,
          email
        )
      `)
      .eq('squad_id', squadId)
      .order('joined_at')

    if (error) {
      console.error('Error fetching squad members:', error)
      return { data: null, error: error.message }
    }

    return { data: members as SquadMember[], error: null }
  } catch (error) {
    console.error('Exception in getSquadMembers:', error)
    return { data: null, error: 'Internal server error' }
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get squads where user is a leader
 */
export async function getLeaderSquads(userId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: squads, error } = await supabase
      .from('squads')
      .select('*')
      .eq('leader_id', userId)
      .order('name')

    if (error) {
      console.error('Error fetching leader squads:', error)
      return { data: null, error: error.message }
    }

    return { data: squads as Squad[], error: null }
  } catch (error) {
    console.error('Exception in getLeaderSquads:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Get squad for a specific user (member)
 */
export async function getUserSquad(userId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    const { data: membership, error } = await supabase
      .from('squad_members')
      .select(`
        squad:squads (
          *,
          leader:users!leader_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user squad:', error)
      return { data: null, error: error.message }
    }

    return { data: membership?.squad as unknown as Squad, error: null }
  } catch (error) {
    console.error('Exception in getUserSquad:', error)
    return { data: null, error: 'Internal server error' }
  }
}

/**
 * Get available users (not in any squad) for a workspace
 */
export async function getAvailableUsersForSquad(workspaceId: string) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return { data: null, error: 'Unauthorized' }
    }

    const supabase = createAdminClient()

    // Get all workspace members
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        user:users (
          id,
          full_name,
          email
        )
      `)
      .eq('workspace_id', workspaceId)

    if (membersError) {
      return { data: null, error: membersError.message }
    }

    // Get squads in this workspace first
    const { data: workspaceSquads } = await supabase
      .from('squads')
      .select('id')
      .eq('workspace_id', workspaceId)
    
    const workspaceSquadIds = workspaceSquads?.map(s => s.id) || []

    // Get users already in squads
    let squadMemberIds = new Set<string>()
    if (workspaceSquadIds.length > 0) {
      const { data: squadMembers } = await supabase
        .from('squad_members')
        .select('user_id')
        .in('squad_id', workspaceSquadIds)
      
      squadMemberIds = new Set(squadMembers?.map(sm => sm.user_id) || [])
    }
    
    // Filter out users already in squads
    type UserData = { id: string; full_name: string | null; email: string }
    const availableUsers = members
      ?.map(m => (m.user as unknown as UserData))
      .filter(u => u && !squadMemberIds.has(u.id))

    return { data: availableUsers, error: null }
  } catch (error) {
    console.error('Exception in getAvailableUsersForSquad:', error)
    return { data: null, error: 'Internal server error' }
  }
}
