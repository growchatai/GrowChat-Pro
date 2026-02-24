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

    // Use Facebook Login for Business endpoint (required for apps using
    // "Instagram API with Instagram Login" use case)
    const scope = [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
    ].join(',')

    const authUrl =
        `https://www.facebook.com/v21.0/dialog/oauth` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&response_type=code`

    console.log('Redirecting to Facebook/Instagram OAuth:', authUrl)

    return NextResponse.redirect(authUrl)
}
