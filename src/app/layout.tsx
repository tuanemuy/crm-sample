import type { Metadata } from "next";
import "@/styles/index.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "CRM System",
  description: "顧客関係管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-base-100 text-base-content">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
