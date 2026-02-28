import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediSync - AI Hospital Orchestration",
  description:
    "AI Hospital Orchestration platform that intelligently coordinates patient care workflows through automated triage, diagnostic assistance, and care coordination across medical staff.",
  openGraph: {
    title: "MediSync - AI Hospital Orchestration",
    description: "Intelligent orchestration platform for hospital operations",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#141411",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body className="antialiased dark">{children}</body>
    </html>
  );
}
