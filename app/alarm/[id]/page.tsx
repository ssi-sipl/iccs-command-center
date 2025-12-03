"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { alarmsData, getAreaNameById } from "@/lib/data/alarms"
import { ArrowLeft, Edit, Bell, MapPin, Calendar, AlertTriangle, Clock } from "lucide-react"

export default function ViewAlarmPage() {
  const params = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const alarm = alarmsData.find((a) => a.alarm_id === params.id)

  if (!alarm) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="ALARM" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-white">Alarm Not Found</h1>
            <Link href="/alarm">
              <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Back to Alarms</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="ALARM" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Link href="/alarm">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-[#4A9FD4]">{alarm.name}</h1>
                  <p className="font-mono text-sm text-gray-400">{alarm.alarm_id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={`${alarm.status ? "bg-green-600" : "bg-gray-600"} px-3 py-1 text-white`}>
                  {alarm.status ? "Active" : "Inactive"}
                </Badge>
                <Link href={`/alarm/${alarm.alarm_id}/edit`}>
                  <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-8 w-8 text-[#4A9FD4]" />
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="text-lg font-semibold text-white">{alarm.status ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-400">Triggered</p>
                      <p className="text-lg font-semibold text-white">{alarm.triggered_count} times</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-400">Last Triggered</p>
                      <p className="text-lg font-semibold text-white">{alarm.last_triggered || "Never"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-lg font-semibold text-white">{alarm.created_at}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Cards */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-[#333] bg-[#252525]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bell className="h-5 w-5 text-[#4A9FD4]" />
                    Alarm Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Alarm ID</span>
                    <span className="font-mono text-[#4A9FD4]">{alarm.alarm_id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{alarm.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Status</span>
                    <Badge className={`${alarm.status ? "bg-green-600" : "bg-gray-600"} text-white`}>
                      {alarm.status ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created Date</span>
                    <span className="text-white">{alarm.created_at}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#252525]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MapPin className="h-5 w-5 text-[#4A9FD4]" />
                    Area Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Area ID</span>
                    <span className="font-mono text-[#4A9FD4]">{alarm.area_id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#333] pb-2">
                    <span className="text-gray-400">Area Name</span>
                    <span className="text-white">{getAreaNameById(alarm.area_id)}</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex h-32 items-center justify-center rounded-lg bg-[#1a1a1a]">
                      <div className="text-center">
                        <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                        <p className="text-sm text-gray-500">Area location preview</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#252525] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Trigger History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-[#1a1a1a] p-4 text-center">
                      <p className="text-3xl font-bold text-orange-500">{alarm.triggered_count}</p>
                      <p className="text-sm text-gray-400">Total Triggers</p>
                    </div>
                    <div className="rounded-lg bg-[#1a1a1a] p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-500">{alarm.last_triggered || "N/A"}</p>
                      <p className="text-sm text-gray-400">Last Triggered</p>
                    </div>
                    <div className="rounded-lg bg-[#1a1a1a] p-4 text-center">
                      <p className="text-3xl font-bold text-green-500">{alarm.status ? "Monitoring" : "Paused"}</p>
                      <p className="text-sm text-gray-400">Current State</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
