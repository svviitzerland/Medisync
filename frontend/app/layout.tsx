import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medisync — AI-Powered Healthcare Synchronization",
  description:
    "Medisync connects patients and healthcare providers through intelligent record synchronization, AI-driven health insights, and seamless appointment management.",
  openGraph: {
    title: "Medisync",
    description: "AI-Powered Healthcare Synchronization Platform",
    type: "website",
  },
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
