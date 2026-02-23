import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface PlanLimits {
    plan: string
    workspaceType: 'personal' | 'agency'
    maxInstagramAccounts: number
    maxTeamMembers: number
    maxSubscribers: number
    maxFlows: number
    currentInstagramAccounts: number
    currentTeamMembers: number
    currentSubscribers: number
    currentFlows: number
    canAddInstagram: boolean
    canAddTeamMember: boolean
    canAddFlow: boolean
    isAgency: boolean
}

export function usePlanLimits() {
    const [limits, setLimits] = useState<PlanLimits | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLimits = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('workspace_id')
                .eq('id', user.id)
                .single()

            if (!profile?.workspace_id) return

            const { data: workspace } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', profile.workspace_id)
                .single()

            if (!workspace) return

            // Get current counts
            const [igResult, teamResult, subResult, flowResult] =
                await Promise.all([
                    supabase
                        .from('instagram_accounts')
                        .select('id', { count: 'exact' })
                        .eq('workspace_id', workspace.id)
                        .eq('is_active', true),
                    supabase
                        .from('team_members')
                        .select('id', { count: 'exact' })
                        .eq('workspace_id', workspace.id)
                        .eq('status', 'active'),
                    supabase
                        .from('subscribers')
                        .select('id', { count: 'exact' })
                        .eq('workspace_id', workspace.id)
                        .eq('is_subscribed', true),
                    supabase
                        .from('flows')
                        .select('id', { count: 'exact' })
                        .eq('workspace_id', workspace.id)
                        .neq('status', 'archived'),
                ])

            const currentIG = igResult.count || 0
            const currentTeam = teamResult.count || 0
            const currentSubs = subResult.count || 0
            const currentFlows = flowResult.count || 0

            setLimits({
                plan: workspace.plan,
                workspaceType: workspace.workspace_type,
                maxInstagramAccounts: workspace.max_instagram_accounts,
                maxTeamMembers: workspace.max_team_members,
                maxSubscribers: workspace.max_subscribers,
                maxFlows: workspace.max_flows,
                currentInstagramAccounts: currentIG,
                currentTeamMembers: currentTeam,
                currentSubscribers: currentSubs,
                currentFlows: currentFlows,
                canAddInstagram: currentIG < workspace.max_instagram_accounts,
                canAddTeamMember: currentTeam < workspace.max_team_members,
                canAddFlow: currentFlows < workspace.max_flows,
                isAgency: workspace.workspace_type === 'agency',
            })
            setLoading(false)
        }
        fetchLimits()
    }, [])

    return { limits, loading }
}
