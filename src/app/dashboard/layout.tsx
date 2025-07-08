import React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { LiveChat } from "@/components/chat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <LiveChat />
    </div>
  );
}
