import { NextResponse } from 'next/server'

export async function GET() {
    const appId = process.env.INSTAGRAM_APP_ID
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI

    console.log('Instagram connect called:', {
        appId: appId ? 'SET' : 'MISSING',
        redirectUri
    })

    if (!appId) {
        return NextResponse.json(
            { error: 'INSTAGRAM_APP_ID environment variable is not set' },
            { status: 500 }
        )
    }

    if (!redirectUri) {
        return NextResponse.json(
            { error: 'INSTAGRAM_REDIRECT_URI environment variable is not set' },
            { status: 500 }
        )
    }

    // CORRECT: Instagram Login API scopes
    // NOT Facebook Login API scopes
    const scope = [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish'
    ].join(',')

    // CORRECT: api.instagram.com NOT facebook.com
    const authUrl =
        `https://api.instagram.com/oauth/authorize` +
        `?client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${scope}` +
        `&response_type=code`

    console.log('Redirecting to Instagram OAuth URL:', authUrl)

    return NextResponse.redirect(authUrl)
}
