import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    console.log('Instagram callback received:', {
        code: code ? `${code.substring(0, 10)}...` : null,
        error,
        errorReason,
        errorDescription,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://growchat-app-production-fbcd.up.railway.app'

    if (error) {
        console.error('OAuth error:', { error, errorReason, errorDescription })
        return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(errorDescription || error)}`)
    }

    if (!code) {
        console.error('No authorization code received')
        return NextResponse.redirect(`${appUrl}/settings?error=no_code`)
    }

    try {
        const appId = process.env.INSTAGRAM_APP_ID!
        const appSecret = process.env.INSTAGRAM_APP_SECRET!
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI ||
            `${appUrl}/api/instagram/callback`

        // Step 1: Exchange code for short-lived token via Instagram API
        console.log('Exchanging code for short-lived token...')
        const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: appId,
                client_secret: appSecret,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code: code,
            }),
        })

        const tokenData = await tokenResponse.json()
        console.log('Token response status:', tokenResponse.status, JSON.stringify(tokenData))

        if (tokenData.error_type || tokenData.error_message) {
            console.error('Token exchange failed:', tokenData)
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(tokenData.error_message || 'token_exchange_failed')}`)
        }

        const { access_token: shortLivedToken, user_id: igUserId } = tokenData
        console.log('Got short-lived token for IG user:', igUserId)

        // Step 2: Exchange short-lived for long-lived token
        console.log('Exchanging for long-lived token...')
        const longLivedResponse = await fetch(
            `https://graph.instagram.com/access_token` +
            `?grant_type=ig_exchange_token` +
            `&client_secret=${appSecret}` +
            `&access_token=${shortLivedToken}`
        )
        const longLivedData = await longLivedResponse.json()
        console.log('Long-lived token response:', longLivedResponse.status)

        const accessToken = longLivedData.access_token || shortLivedToken
        const expiresIn = longLivedData.expires_in || 3600

        // Step 3: Get user profile
        console.log('Fetching user profile...')
        const profileResponse = await fetch(
            `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url,account_type&access_token=${accessToken}`
        )
        const profileData = await profileResponse.json()
        console.log('Profile data:', JSON.stringify(profileData))

        if (profileData.error) {
            console.error('Profile fetch failed:', profileData.error)
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(profileData.error.message || 'profile_fetch_failed')}`)
        }

        const username = profileData.username || `user_${igUserId}`
        const fullName = profileData.name || username
        const profilePic = profileData.profile_picture_url || null
        const accountType = profileData.account_type || 'BUSINESS'

        // Step 4: Find workspace
        const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .limit(1)

        let workspaceId: string
        if (workspaces && workspaces.length > 0) {
            workspaceId = workspaces[0].id
        } else {
            const { data: newWorkspace } = await supabase
                .from('workspaces')
                .insert({ name: 'Default Workspace' })
                .select('id')
                .single()
            workspaceId = newWorkspace!.id
        }

        // Step 5: Upsert Instagram account
        console.log('Saving Instagram account to database...')
        const { data: igAccount, error: upsertError } = await supabase
            .from('instagram_accounts')
            .upsert({
                workspace_id: workspaceId,
                ig_user_id: String(igUserId),
                username: username,
                full_name: fullName,
                profile_picture_url: profilePic,
                access_token: accessToken,
                token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                is_active: true,
                account_type: accountType,
            }, {
                onConflict: 'ig_user_id',
            })
            .select()
            .single()

        if (upsertError) {
            console.error('Failed to save Instagram account:', upsertError)
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(upsertError.message)}`)
        }

        console.log('Instagram account saved:', { id: igAccount?.id, username })

        return NextResponse.redirect(`${appUrl}/settings?success=connected&username=${username}`)

    } catch (err: any) {
        console.error('Instagram callback error:', err)
        return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(err.message || 'unknown_error')}`)
    }
}
