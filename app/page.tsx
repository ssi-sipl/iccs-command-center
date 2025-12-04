"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MapView } from "@/components/map-view";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="relative flex-1">
          <MapView />
        </main>
      </div>
    </div>
  );
}
