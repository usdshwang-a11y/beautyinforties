import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "40대 맞춤 피부관리 플래너",
  description: "피부 고민·이벤트 일정에 맞춘 화장품·영양제 To-do 와 병원 비교 분석",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
