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

    // Facebook Login for Business requires FB Graph API permission names
    // (not instagram_business_* which are for Instagram Login endpoint)
    const scope = [
        'pages_show_list',
        'pages_manage_metadata',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_manage_messages',
        'instagram_manage_comments',
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
