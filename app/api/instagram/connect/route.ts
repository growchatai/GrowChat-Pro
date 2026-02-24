import { NextResponse } from 'next/server'

export async function GET() {
    const appId = process.env.INSTAGRAM_APP_ID
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://growchat-app-production-fbcd.up.railway.app'}/api/instagram/callback`

    if (!appId) {
        console.error('INSTAGRAM_APP_ID not configured')
        return NextResponse.json(
            { error: 'Instagram App ID not configured. Please add INSTAGRAM_APP_ID to environment variables.' },
            { status: 500 }
        )
    }

    const scope = [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
    ].join(',')

    const authUrl =
        `https://www.instagram.com/oauth/authorize` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&response_type=code` +
        `&enable_fb_login=0` +
        `&force_authentication=1`

    console.log('Redirecting to Instagram OAuth:', authUrl)

    return NextResponse.redirect(authUrl)
}
