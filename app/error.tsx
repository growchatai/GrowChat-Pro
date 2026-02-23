'use client'
import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

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
            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                Something went wrong
            </h2>
            <p style={{ color: '#9090b0' }}>{error.message}</p>
            <button
                onClick={reset}
                style={{
                    background: '#6c63ff',
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}
            >
                Try again
            </button>
        </div>
    )
}
