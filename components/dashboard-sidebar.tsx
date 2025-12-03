"use client"

import { useState } from "react"
import { Wifi, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function DashboardSidebar({ isOpen, onToggle }: DashboardSidebarProps) {
  const [droneStatus] = useState<"connected" | "disconnected">("connected")

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onToggle} />}

      <aside
        className={`fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col border-r border-[#333] bg-[#1a1a1a] p-4 transition-transform duration-300 lg:static lg:z-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-72 md:w-80`}
      >
        {/* Alarm Section */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">ALARM</h2>
          <Badge className="bg-red-600 px-4 py-1 text-sm font-medium text-white hover:bg-red-700">Alarm-1</Badge>
          <div className="mt-4 border-b border-[#333]" />
        </section>

        {/* Drone Section */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">DRONE</h2>
          <div className="rounded-lg border border-[#333] bg-[#222] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#333]">
                  <Wifi className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white">Drone-1</p>
                  <p className="text-xs text-gray-500">Tap for details</p>
                </div>
              </div>
              <Badge
                className={`shrink-0 ${
                  droneStatus === "connected" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } text-xs text-white`}
              >
                Connected
              </Badge>
            </div>
          </div>

          <Button
            className="mt-4 w-full border border-[#444] bg-transparent text-white hover:bg-[#333]"
            variant="outline"
          >
            PATROL
          </Button>
          <div className="mt-4 border-b border-[#333]" />
        </section>

        {/* Alert Section */}
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-white">ALERT</h2>
          <p className="text-sm text-gray-500">No Active Alerts Found...</p>
        </section>
      </aside>

      <Button
        variant="secondary"
        size="icon"
        className={`fixed z-40 h-10 w-10 bg-[#333] text-white hover:bg-[#444] lg:hidden transition-all duration-300 ${
          isOpen ? "left-[17rem] md:left-[19rem]" : "left-2"
        } top-[4.5rem]`}
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </Button>
    </>
  )
}
