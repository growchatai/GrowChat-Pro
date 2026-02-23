'use client'
import { useEffect } from 'react'

export default function DashboardError({
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
            minHeight: '60vh',
            color: '#f0f0ff',
            gap: '16px'
        }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
                Page Error
            </h2>
            <p style={{ color: '#9090b0', fontSize: '14px' }}>
                {error.message}
            </p>
            <button
                onClick={reset}
                style={{
                    background: '#6c63ff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px'
                }}
            >
                Try again
            </button>
        </div>
    )
}
