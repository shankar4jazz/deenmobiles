import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Track Your Service - Deen Mobiles",
  description:
    "Track your mobile phone repair status at Deen Mobiles. Get real-time updates on your device repair.",
  keywords: [
    "mobile repair",
    "phone repair tracking",
    "service status",
    "Deen Mobiles",
  ],
  openGraph: {
    title: "Track Your Service - Deen Mobiles",
    description:
      "Check the real-time status of your mobile phone repair at Deen Mobiles.",
    type: "website",
    siteName: "Deen Mobiles",
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Service - Deen Mobiles",
    description: "Check the real-time status of your mobile phone repair.",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
