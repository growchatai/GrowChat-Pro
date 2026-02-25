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
        // STEP 1: Exchange code for short-lived token
        // Instagram Login API uses POST to api.instagram.com
        const tokenResponse = await fetch(
            'https://api.instagram.com/oauth/access_token',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.INSTAGRAM_APP_ID!,
                    client_secret: process.env.INSTAGRAM_APP_SECRET!,
                    grant_type: 'authorization_code',
                    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
                    code: code,
                }).toString(),
            }
        )

        const tokenData = await tokenResponse.json()
        console.log('Token exchange response:', tokenData)

        if (!tokenData.access_token) {
            console.error('No access token received:', tokenData)
            return NextResponse.redirect(`${appUrl}/settings?error=token_failed`)
        }

        // STEP 2: Exchange for long-lived token (60 days)
        // Uses graph.instagram.com for long-lived token
        const longTokenResponse = await fetch(
            `https://graph.instagram.com/access_token` +
            `?grant_type=ig_exchange_token` +
            `&client_secret=${process.env.INSTAGRAM_APP_SECRET}` +
            `&access_token=${tokenData.access_token}`
        )

        const longTokenData = await longTokenResponse.json()
        console.log('Long-lived token response:', longTokenData)

        const accessToken = longTokenData.access_token || tokenData.access_token
        const expiresIn = longTokenData.expires_in || 5183944

        // STEP 3: Get Instagram profile
        // Uses graph.instagram.com for all data after auth
        const profileResponse = await fetch(
            `https://graph.instagram.com/v21.0/me` +
            `?fields=user_id,username,name,profile_picture_url,account_type` +
            `&access_token=${accessToken}`
        )

        const profileData = await profileResponse.json()
        console.log('Profile data:', profileData)

        if (profileData.error) {
            console.error('Profile fetch failed:', profileData.error)
            return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(profileData.error.message || 'profile_fetch_failed')}`)
        }

        const igUserId = profileData.user_id || profileData.id || tokenData.user_id
        const username = profileData.username || `user_${igUserId}`
        const fullName = profileData.name || username
        const profilePic = profileData.profile_picture_url || null
        const accountType = profileData.account_type || 'BUSINESS'

        // STEP 4: Find workspace — prefer "GrowChat Official", fallback to first
        const { data: namedWorkspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('name', 'GrowChat Official')
            .single()

        let workspaceId: string
        if (namedWorkspace) {
            workspaceId = namedWorkspace.id
        } else {
            const { data: workspaces } = await supabase
                .from('workspaces')
                .select('id')
                .limit(1)
            if (workspaces && workspaces.length > 0) {
                workspaceId = workspaces[0].id
            } else {
                const { data: newWorkspace } = await supabase
                    .from('workspaces')
                    .insert({ name: 'GrowChat Official' })
                    .select('id')
                    .single()
                workspaceId = newWorkspace!.id
            }
        }

        // STEP 5: Upsert Instagram account
        console.log('Saving Instagram account to database...')
        const { data: igAccount, error: upsertError } = await supabase
            .from('instagram_accounts')
            .upsert({
                workspace_id: workspaceId,
                ig_user_id: String(igUserId),
                username: username,
                full_name: fullName,
                profile_pic_url: profilePic,
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
