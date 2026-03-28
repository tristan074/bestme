import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BestMe - Fred的学习助手",
  description: "Learning app for kids",
  appleWebApp: {
    capable: true,
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`h-full antialiased ${pressStart2P.variable}`}>
      <body className="min-h-full flex flex-col pb-20 bg-[#2D2D2D] text-white">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
