import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JVision 포트폴리오 허브",
  description: "비전대 학생들의 이력서·자소서·포트폴리오 모음",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <NextAuthSessionProvider>
          <Header />
          <div className="flex-1">{children}</div>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
