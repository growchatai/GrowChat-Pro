import Link from "next/link";
import { ArrowRight, MessageCircle, GitBranch, BarChart3, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Navigation */}
      <nav className="w-full max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-text" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrowChat</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-text2 hover:text-text transition-colors font-medium">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-accent hover:bg-accent/90 text-text px-5 py-2.5 rounded-full font-medium transition-all"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl px-6 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <section className="py-24 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface2 border border-border mb-8 text-sm text-text2">
            <span className="w-2 h-2 rounded-full bg-accent3"></span>
            GrowChat Pro is now in beta
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Automate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent2 to-accent3">Instagram Growth</span>
          </h1>
          <p className="text-xl text-text2 mb-10 max-w-2xl leading-relaxed">
            Turn your followers into customers with intelligent DM automation, flow builders, and rich analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-text px-8 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2 text-lg"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#pricing"
              className="w-full sm:w-auto bg-surface2 hover:bg-surface border border-border text-text px-8 py-4 rounded-full font-medium transition-all flex items-center justify-center text-lg"
            >
              View Pricing
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Everything you need to scale</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-2xl border border-border hover:border-accent/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">DM Automation</h3>
              <p className="text-text2 leading-relaxed">
                Automatically reply to DMs, story mentions, and comments with personalized responses.
              </p>
            </div>
            <div className="bg-surface p-8 rounded-2xl border border-border hover:border-accent2/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-accent2/20 flex items-center justify-center mb-6 group-hover:bg-accent2/30 transition-colors">
                <GitBranch className="w-6 h-6 text-accent2" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Flow Builder</h3>
              <p className="text-text2 leading-relaxed">
                Design complex conversational paths with our intuitive drag-and-drop visual interface.
              </p>
            </div>
            <div className="bg-surface p-8 rounded-2xl border border-border hover:border-accent3/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-accent3/20 flex items-center justify-center mb-6 group-hover:bg-accent3/30 transition-colors">
                <BarChart3 className="w-6 h-6 text-accent3" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Analytics</h3>
              <p className="text-text2 leading-relaxed">
                Track open rates, click-throughs, and conversions to optimize your messaging strategy.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 w-full">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple, transparent pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-surface p-8 rounded-3xl border border-border flex flex-col">
              <h3 className="text-2xl font-semibold mb-2">Starter</h3>
              <p className="text-text2 mb-6">Perfect for growing creators</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">$29</span>
                <span className="text-text2">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['1 Instagram Account', 'Up to 5,000 DMs/mo', 'Basic Flow Builder', 'Standard Support'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent3" />
                    <span className="text-text2">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full bg-surface2 hover:bg-border text-center py-3 rounded-xl font-medium transition-colors">
                Start Free Trial
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-surface2 p-8 rounded-3xl border-2 border-accent flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-2xl font-semibold mb-2">Pro</h3>
              <p className="text-text2 mb-6">For serious marketers</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">$79</span>
                <span className="text-text2">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['3 Instagram Accounts', 'Up to 25,000 DMs/mo', 'Advanced Flow Builder', 'Analytics Dashboard', 'Priority Support'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    <span className="text-text2">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full bg-accent hover:bg-accent/90 text-center py-3 rounded-xl font-medium transition-colors shadow-lg shadow-accent/25">
                Get Started
              </Link>
            </div>
            {/* Agency */}
            <div className="bg-surface p-8 rounded-3xl border border-border flex flex-col">
              <h3 className="text-2xl font-semibold mb-2">Agency</h3>
              <p className="text-text2 mb-6">For teams and agencies</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">$199</span>
                <span className="text-text2">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited Accounts', 'Unlimited DMs', 'Custom Integrations', 'White-label Reports', '24/7 Phone Support'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent2" />
                    <span className="text-text2">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full bg-surface2 hover:bg-border text-center py-3 rounded-xl font-medium transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-12 mt-12 bg-surface">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            <span className="font-semibold">GrowChat</span>
          </div>
          <p className="text-text2 text-sm">© 2026 GrowChat Pro. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-text2">
            <Link href="#" className="hover:text-text transition-colors">Terms</Link>
            <Link href="#" className="hover:text-text transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
