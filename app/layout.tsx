import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/common/LayoutWrapper";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

// === 절대 URL 고정 (마지막 슬래시 제거) ===
const BASE_URL =
  (process.env.NEXT_PUBLIC_BASE_URL || "https://piku.store").replace(/\/+$/, "");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 절대 기준 URL
  metadataBase: new URL(BASE_URL),

  // 기본 메타
  title: "PikU",
  description: "나만의 캐릭터로 기록하는 하루 한 장",
  keywords: ["다이어리", "캐릭터", "일기", "PikU", "픽유", "감정 기록"],
  authors: [{ name: "PikU Team" }],
  creator: "PikU Team",
  publisher: "PikU",

  // canonical 은 metadataBase와 합쳐져 절대 URL로 출력됨
  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      "naver-site-verification":
        process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },

  referrer: "origin-when-cross-origin",

  // 아이콘/매니페스트도 절대 URL 사용 (안전)
  icons: {
    icon: [
      { url: `${BASE_URL}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
      { url: `${BASE_URL}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: `${BASE_URL}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: `${BASE_URL}/site.webmanifest`,

  // PWA: iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PikU",
  },

  // === Open Graph (절대 URL 고정) ===
  openGraph: {
    type: "website",
    url: BASE_URL, // og:url
    siteName: "PikU",
    title: "PikU - 나만의 캐릭터 다이어리",
    description: "나만의 캐릭터로 기록하는 하루 한 장",
    locale: "ko_KR",
    images: [
      {
        url: `${BASE_URL}/piku-og-1200x630.png`, // og:image 절대 경로
        width: 1200,
        height: 630,
        alt: "PikU - 나만의 캐릭터 다이어리",
      },
    ],
  },

  // === Twitter Card (절대 URL 고정) ===
  twitter: {
    card: "summary_large_image",
    // site/creator 핸들이 실제 운영 중이 아니면 생략해도 됩니다.
    title: "PikU - 나만의 캐릭터 다이어리",
    description: "나만의 캐릭터로 기록하는 하루 한 장",
    images: [`${BASE_URL}/piku-og-1200x630.png`], // twitter:image
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <ReactQueryProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ReactQueryProvider>

        {/* WebSite 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: BASE_URL,
              name: "PikU",
              potentialAction: {
                "@type": "SearchAction",
                target: `${BASE_URL}/search?query={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* Organization 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PikU",
              url: BASE_URL,
              logo: `${BASE_URL}/android-chrome-512x512.png`,
            }),
          }}
        />
      </body>
    </html>
  );
}
