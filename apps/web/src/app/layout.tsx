import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScopeBomb — Review app access and credentials",
  description:
    "Review supplied permissions and configuration, understand possible exposure, and plan provider-specific cleanup. No live account changes.",
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
