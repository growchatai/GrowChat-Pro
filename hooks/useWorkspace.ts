import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useWorkspace() {
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [workspace, setWorkspace] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchWorkspace = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('workspace_id, workspaces(*)')
                .eq('id', user.id)
                .single()

            if (profile) {
                setWorkspaceId(profile.workspace_id)
                setWorkspace(profile.workspaces)
            }
            setLoading(false)
        }
        fetchWorkspace()
    }, [])

    return { workspaceId, workspace, loading }
}
