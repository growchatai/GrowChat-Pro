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

    // Handle errors from OAuth
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

        // Step 1: Exchange code for access token via Facebook Graph API
        console.log('Exchanging code for token via Facebook Graph API...')
        const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token` +
            `?client_id=${appId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&client_secret=${appSecret}` +
            `&code=${code}`

        const tokenResponse = await fetch(tokenUrl)
        const tokenData = await tokenResponse.json()
        console.log('Token response status:', tokenResponse.status)

        if (tokenData.error) {
            console.error('Token exchange failed:', tokenData.error)
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(tokenData.error.message || 'token_exchange_failed')}`)
        }

        const accessToken = tokenData.access_token
        console.log('Got access token, fetching Instagram business accounts...')

        // Step 2: Get Facebook Pages connected to this user
        const pagesResponse = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
        )
        const pagesData = await pagesResponse.json()
        console.log('Pages data:', JSON.stringify(pagesData, null, 2))

        let igUserId: string | null = null
        let igUsername: string | null = null
        let igName: string | null = null
        let igProfilePic: string | null = null
        let igAccountType: string = 'BUSINESS'
        let igAccessToken: string = accessToken

        if (pagesData.data && pagesData.data.length > 0) {
            // Step 3: For each page, check if it has an Instagram Business Account
            for (const page of pagesData.data) {
                console.log(`Checking page: ${page.name} (${page.id})`)
                const igResponse = await fetch(
                    `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token || accessToken}`
                )
                const igData = await igResponse.json()

                if (igData.instagram_business_account) {
                    igUserId = igData.instagram_business_account.id
                    igAccessToken = page.access_token || accessToken
                    console.log(`Found Instagram Business Account: ${igUserId}`)

                    // Step 4: Get Instagram profile details
                    const profileResponse = await fetch(
                        `https://graph.facebook.com/v21.0/${igUserId}?fields=username,name,profile_picture_url,ig_id,account_type&access_token=${igAccessToken}`
                    )
                    const profileData = await profileResponse.json()
                    console.log('Instagram profile:', JSON.stringify(profileData, null, 2))

                    igUsername = profileData.username || null
                    igName = profileData.name || igUsername
                    igProfilePic = profileData.profile_picture_url || null
                    break
                }
            }
        }

        // If no business account found through pages, try direct Instagram user endpoint
        if (!igUserId) {
            console.log('No IG business account via pages, trying direct user info...')
            const meResponse = await fetch(
                `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`
            )
            const meData = await meResponse.json()
            console.log('Facebook user data:', JSON.stringify(meData, null, 2))

            // Try Instagram Graph API user node directly
            const igMeResponse = await fetch(
                `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,profile_picture_url,account_type&access_token=${accessToken}`
            )
            const igMeData = await igMeResponse.json()
            console.log('Instagram me data:', JSON.stringify(igMeData, null, 2))

            if (igMeData.user_id || igMeData.id) {
                igUserId = igMeData.user_id || igMeData.id
                igUsername = igMeData.username
                igName = igMeData.name || igUsername
                igProfilePic = igMeData.profile_picture_url || null
                igAccountType = igMeData.account_type || 'BUSINESS'
            } else {
                // Last resort — use FB user ID
                igUserId = meData.id
                igUsername = meData.name?.replace(/\s+/g, '_').toLowerCase() || `user_${meData.id}`
                igName = meData.name || igUsername
            }
        }

        if (!igUserId) {
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent('Could not find Instagram account. Make sure your Facebook page has an Instagram Business account connected.')}`)
        }

        // Step 5: Find workspace
        const { data: existingWorkspaces } = await supabase
            .from('workspaces')
            .select('id')
            .limit(1)

        let workspaceId: string
        if (existingWorkspaces && existingWorkspaces.length > 0) {
            workspaceId = existingWorkspaces[0].id
        } else {
            const { data: newWorkspace } = await supabase
                .from('workspaces')
                .insert({ name: 'Default Workspace' })
                .select('id')
                .single()
            workspaceId = newWorkspace!.id
        }

        // Step 6: Upsert Instagram account
        console.log('Saving Instagram account to database...')
        const { data: igAccount, error: upsertError } = await supabase
            .from('instagram_accounts')
            .upsert({
                workspace_id: workspaceId,
                ig_user_id: String(igUserId),
                username: igUsername || `user_${igUserId}`,
                full_name: igName || igUsername || `User ${igUserId}`,
                profile_picture_url: igProfilePic,
                access_token: igAccessToken,
                token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
                is_active: true,
                account_type: igAccountType,
            }, {
                onConflict: 'ig_user_id',
            })
            .select()
            .single()

        if (upsertError) {
            console.error('Failed to save Instagram account:', upsertError)
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(upsertError.message)}`)
        }

        console.log('Instagram account saved:', { id: igAccount?.id, username: igUsername })

        return NextResponse.redirect(`${appUrl}/settings?success=connected&username=${igUsername || 'unknown'}`)

    } catch (err: any) {
        console.error('Instagram callback error:', err)
        return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(err.message || 'unknown_error')}`)
    }
}
