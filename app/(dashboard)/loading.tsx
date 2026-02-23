export default function DashboardLoading() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #2a2a40',
                borderTop: '3px solid #6c63ff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
