import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/common/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PikU",
  description: "나만의 캐릭터로 기록하는 하루 한 장",
  keywords: ["다이어리", "캐릭터", "일기", "PikU", "픽유", "감정 기록"],
  authors: [{ name: "PikU Team" }],
  creator: "PikU Team",
  publisher: "PikU",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.piku.store'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
    },
  },
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PikU",
  },
  openGraph: {
    type: "website",
    siteName: "PikU",
    title: "PikU - 나만의 캐릭터 다이어리",
    description: "나만의 캐릭터로 기록하는 하루 한 장",
    locale: "ko_KR",
    images: [
      {
        url: "/piku-og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "PikU - 나만의 캐릭터 다이어리",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@PikU",
    creator: "@PikU",
    title: "PikU - 나만의 캐릭터 다이어리",
    description: "나만의 캐릭터로 기록하는 하루 한 장",
    images: [
      {
        url: "/piku-og-1200x630.png",
        alt: "PikU - 나만의 캐릭터 다이어리",
      }
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import ReactQueryProvider from '@/providers/ReactQueryProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReactQueryProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ReactQueryProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              url: baseUrl,
              name: 'PikU',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${baseUrl}/search?query={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PikU',
              url: baseUrl,
              logo: `${baseUrl}/android-chrome-512x512.png`,
            }),
          }}
        />
      </body>
    </html>
  );
}
