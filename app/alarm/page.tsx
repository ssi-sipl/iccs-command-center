"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { alarmsData, getAreaNameById } from "@/lib/data/alarms"
import { Plus, Search, Eye, Edit, Trash2, Bell, BellOff, AlertTriangle } from "lucide-react"

export default function AlarmListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAlarms = alarmsData.filter(
    (alarm) =>
      alarm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alarm.alarm_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAreaNameById(alarm.area_id).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeCount = alarmsData.filter((a) => a.status).length
  const inactiveCount = alarmsData.filter((a) => !a.status).length
  const totalTriggers = alarmsData.reduce((sum, a) => sum + a.triggered_count, 0)

  const handleDelete = (alarmId: string) => {
    // TODO: Replace with actual API call
    console.log("Deleting alarm:", alarmId)
    alert(`Delete alarm ${alarmId}? (This is a demo)`)
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="ALARM" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">Alarm Management</h1>
              <Link href="/alarm/add">
                <Button className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Alarm
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Alarms</p>
                      <p className="text-2xl font-bold text-white">{alarmsData.length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-[#4A9FD4]" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active</p>
                      <p className="text-2xl font-bold text-green-500">{activeCount}</p>
                    </div>
                    <Bell className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Inactive</p>
                      <p className="text-2xl font-bold text-gray-500">{inactiveCount}</p>
                    </div>
                    <BellOff className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#252525]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Triggers</p>
                      <p className="text-2xl font-bold text-orange-500">{totalTriggers}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search alarms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-[#444] bg-[#2a2a2a] pl-10 text-white placeholder:text-gray-500 focus:border-[#4A9FD4]"
                />
              </div>
            </div>

            {/* Table for larger screens */}
            <div className="hidden overflow-hidden rounded-lg border border-[#333] md:block">
              <table className="w-full">
                <thead className="bg-[#252525]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Alarm ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Area</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Triggers</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Triggered</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {filteredAlarms.map((alarm) => (
                    <tr key={alarm.alarm_id} className="bg-[#1e1e1e] hover:bg-[#252525]">
                      <td className="px-4 py-3 font-mono text-sm text-[#4A9FD4]">{alarm.alarm_id}</td>
                      <td className="px-4 py-3 text-white">{alarm.name}</td>
                      <td className="px-4 py-3 text-gray-300">{getAreaNameById(alarm.area_id)}</td>
                      <td className="px-4 py-3">
                        <Badge className={alarm.status ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                          {alarm.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{alarm.triggered_count}</td>
                      <td className="px-4 py-3 text-gray-300">{alarm.last_triggered || "Never"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/alarm/${alarm.alarm_id}`}>
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/alarm/${alarm.alarm_id}/edit`}>
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(alarm.alarm_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards for mobile */}
            <div className="grid gap-4 md:hidden">
              {filteredAlarms.map((alarm) => (
                <Card key={alarm.alarm_id} className="border-[#333] bg-[#252525]">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm text-[#4A9FD4]">{alarm.alarm_id}</p>
                        <h3 className="text-lg font-medium text-white">{alarm.name}</h3>
                      </div>
                      <Badge className={alarm.status ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                        {alarm.status ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mb-3 space-y-1 text-sm text-gray-400">
                      <p>Area: {getAreaNameById(alarm.area_id)}</p>
                      <p>Triggers: {alarm.triggered_count}</p>
                      <p>Last Triggered: {alarm.last_triggered || "Never"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/alarm/${alarm.alarm_id}`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-[#444] text-gray-300 bg-transparent"
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </Link>
                      <Link href={`/alarm/${alarm.alarm_id}/edit`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-[#444] text-gray-300 bg-transparent"
                        >
                          <Edit className="mr-1 h-4 w-4" /> Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 bg-transparent"
                        onClick={() => handleDelete(alarm.alarm_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAlarms.length === 0 && (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <p className="text-gray-400">No alarms found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
