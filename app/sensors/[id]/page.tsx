"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Radio,
  MapPin,
  Battery,
  Wifi,
  Activity,
  Globe,
  Bell,
  Plane,
  Power,
} from "lucide-react"
import { sensorsData, getAreaNameById } from "@/lib/data/sensors"

export default function ViewSensorPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sensor = sensorsData.find((s) => s.sensor_id === params.id)

  if (!sensor) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="SENSORS" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Radio className="mx-auto h-16 w-16 text-gray-500" />
            <h2 className="mt-4 text-xl text-white">Sensor not found</h2>
            <Link href="/sensors">
              <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">Back to Sensors</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-600 hover:bg-green-700">Online</Badge>
      case "offline":
        return <Badge className="bg-red-600 hover:bg-red-700">Offline</Badge>
      case "warning":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Warning</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDelete = () => {
    // TODO: Replace with actual API call
    console.log("Deleting sensor:", sensor.sensor_id)
    router.push("/sensors")
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="SENSORS" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Back Link */}
            <Link href="/sensors" className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Sensors
            </Link>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-[#4A9FD4]">{sensor.name}</h1>
                  {getStatusBadge(sensor.status)}
                </div>
                <p className="mt-1 font-mono text-sm text-gray-400">{sensor.sensor_id}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/sensors/${sensor.sensor_id}/edit`}>
                  <Button className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" className="gap-2" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-blue-500/20 p-3">
                    <Radio className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Type</p>
                    <p className="text-lg font-semibold text-white">{sensor.sensor_type}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-green-500/20 p-3">
                    <Battery className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Battery</p>
                    <p className="text-lg font-semibold text-white">{sensor.battery}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-purple-500/20 p-3">
                    <MapPin className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Area</p>
                    <p className="text-lg font-semibold text-white">{getAreaNameById(sensor.area_id)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-yellow-500/20 p-3">
                    <Activity className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active</p>
                    <p className="text-lg font-semibold text-white">{sensor.active}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sensor Information */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Radio className="h-5 w-5 text-[#4A9FD4]" />
                    Sensor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Sensor ID</span>
                    <span className="font-mono text-white">{sensor.sensor_id}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{sensor.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Sensor Type</span>
                    <span className="text-white">{sensor.sensor_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-white">{sensor.created_at}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Network & Status */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Wifi className="h-5 w-5 text-[#4A9FD4]" />
                    Network & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">IP Address</span>
                    <span className="font-mono text-white">{sensor.ip_address}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Status</span>
                    {getStatusBadge(sensor.status)}
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Battery</span>
                    <span className="text-white">{sensor.battery}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active</span>
                    <Badge className={sensor.active === "Active" ? "bg-green-600" : "bg-gray-600"}>
                      {sensor.active}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Globe className="h-5 w-5 text-[#4A9FD4]" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Area</span>
                    <span className="text-white">{getAreaNameById(sensor.area_id)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="text-gray-400">Latitude</span>
                    <span className="font-mono text-white">{sensor.latitude}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Longitude</span>
                    <span className="font-mono text-white">{sensor.longitude}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Automation Settings */}
              <Card className="border-[#333] bg-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Power className="h-5 w-5 text-[#4A9FD4]" />
                    Automation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333] pb-3">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Bell className="h-4 w-4" />
                      Alarm
                    </span>
                    <span className="text-white">{sensor.alarm}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Plane className="h-4 w-4" />
                      Send Drone
                    </span>
                    <Badge className={sensor.send_drone === "Yes" ? "bg-green-600" : "bg-gray-600"}>
                      {sensor.send_drone}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Preview */}
            <Card className="mt-6 border-[#333] bg-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-[#4A9FD4]" />
                  Location Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-48 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-64">
                  <img
                    src="/satellite-aerial-view-of-city-urban-area-from-abov.jpg"
                    alt="Map preview"
                    className="h-full w-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4A9FD4] shadow-lg">
                        <Radio className="h-5 w-5 text-white" />
                      </div>
                      <span className="rounded bg-black/50 px-2 py-1 text-xs text-white">
                        {sensor.latitude.toFixed(4)}, {sensor.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
