import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hệ Thống Thi Đua Học Đường - TDHD",
  description: "Hệ thống quản lý thi đua học tập và nề nếp học đường",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Roboto:wght@100;300;400;500;700;900&family=PT+Mono&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="dark-theme">
        {children}
      </body>
    </html>
  );
}
