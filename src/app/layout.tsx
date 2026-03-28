import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
