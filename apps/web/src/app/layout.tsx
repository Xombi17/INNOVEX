import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScopeBomb — OAuth Blast-Radius & Multi-Issuer Containment Arena",
  description:
    "Deterministic OAuth & Shadow-AI Blast-Radius Domino Simulator, RFC 7009 HTTP 200 Trap Analyzer, and PKCE-Safe Pre-Consent Guard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-rose-500/30 selection:text-rose-100">
        {children}
      </body>
    </html>
  );
}
