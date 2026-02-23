import Link from 'next/link'

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0a0a0f',
            color: '#f0f0ff',
            fontFamily: 'Inter, sans-serif',
            gap: '16px'
        }}>
            <h1 style={{
                fontSize: '80px',
                fontWeight: 800,
                color: '#6c63ff',
                lineHeight: 1
            }}>404</h1>
            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                Page not found
            </h2>
            <p style={{ color: '#9090b0' }}>
                The page you are looking for does not exist.
            </p>
            <Link href="/dashboard" style={{
                background: '#6c63ff',
                color: 'white',
                textDecoration: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px'
            }}>
                Back to Dashboard
            </Link>
        </div>
    )
}
