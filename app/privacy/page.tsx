export default function PrivacyPolicyPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Privacy Policy</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Last updated: February 25, 2026</p>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>1. Information We Collect</h2>
                <p>GrowChat Pro collects the following information when you connect your Instagram account:</p>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Instagram username and profile information</li>
                    <li>Instagram account ID</li>
                    <li>Messages sent to your Instagram business account</li>
                    <li>Comments on your Instagram posts (when automation is enabled)</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>2. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Process and respond to Instagram DMs via your configured automation flows</li>
                    <li>Monitor keyword triggers in messages and comments</li>
                    <li>Display conversation history in your GrowChat inbox</li>
                    <li>Provide analytics on message engagement</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>3. Data Storage</h2>
                <p>Your data is stored securely using Supabase (PostgreSQL) with row-level security. Access tokens are encrypted and stored with expiration tracking.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>4. Data Sharing</h2>
                <p>We do not sell or share your personal data with third parties. Data is only shared with Meta/Instagram as required to provide our services.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>5. Data Deletion</h2>
                <p>You can request deletion of your data at any time by disconnecting your Instagram account from GrowChat Pro settings. Upon disconnection, all associated messages, flows, and tokens will be permanently deleted.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>6. Contact</h2>
                <p>For privacy inquiries, contact us at: <a href="mailto:growchat.official@gmail.com">growchat.official@gmail.com</a></p>
            </section>
        </div>
    );
}
