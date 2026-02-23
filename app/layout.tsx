import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GrowChat Pro - Instagram Automation SaaS",
  description: "Automate your Instagram growth with intelligent flows and rich analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-bg text-text antialiased selection:bg-accent/30`}>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
