"use client";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <Header />

        <main className="flex-1 p-6 bg-base-200">{children}</main>

        <Footer />
      </div>

      <div className="drawer-side">
        <label
          htmlFor="sidebar-toggle"
          className="drawer-overlay"
          aria-label="close sidebar"
        />
        <Sidebar />
      </div>
    </div>
  );
}
