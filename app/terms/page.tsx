export default function TermsOfServicePage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Terms of Service</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Last updated: February 25, 2026</p>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>1. Acceptance of Terms</h2>
                <p>By using GrowChat Pro, you agree to these Terms of Service. If you do not agree, please do not use our service.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>2. Service Description</h2>
                <p>GrowChat Pro is an Instagram automation platform that enables businesses to create automated message flows, keyword triggers, and manage their Instagram DM inbox.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>3. User Responsibilities</h2>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>You must have a valid Instagram business or creator account</li>
                    <li>You are responsible for the content of your automated messages</li>
                    <li>You must comply with Instagram&apos;s terms of service and community guidelines</li>
                    <li>You must not use the service for spam or harassment</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>4. Limitation of Liability</h2>
                <p>GrowChat Pro is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from the use of our service, including but not limited to Instagram account restrictions.</p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>5. Contact</h2>
                <p>For questions about these terms, contact us at: <a href="mailto:growchat.official@gmail.com">growchat.official@gmail.com</a></p>
            </section>
        </div>
    );
}
