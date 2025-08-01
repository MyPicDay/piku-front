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
  },
  twitter: {
    card: "summary_large_image",
    title: "PikU - 나만의 캐릭터 다이어리",
    description: "나만의 캐릭터로 기록하는 하루 한 장",
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
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReactQueryProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
