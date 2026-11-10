import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScopeBomb - OAuth Blast-Radius & Multi-Issuer Containment Workbench",
  description:
    "Deterministic OAuth and shadow-AI blast-radius simulator, RFC 7009 HTTP 200 trap analyzer, and PKCE-safe pre-consent browser guard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f9fbfc] text-[#131416]">
        {children}
      </body>
    </html>
  );
}
