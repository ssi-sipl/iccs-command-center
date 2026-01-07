"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MapView } from "@/components/map-view";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return <MapView />;
}
