"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Eye, Pencil, Trash2, Radio, MapPin, Battery, Wifi } from "lucide-react"
import { sensorsData, getAreaNameById } from "@/lib/data/sensors"

export default function SensorsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSensors = sensorsData.filter(
    (sensor) =>
      sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.sensor_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.sensor_type.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

  const handleDelete = (sensorId: string) => {
    // TODO: Replace with actual API call
    console.log("Deleting sensor:", sensorId)
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="SENSORS" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#4A9FD4]">Sensors</h1>
                <p className="mt-1 text-sm text-gray-400">Manage and monitor all sensors</p>
              </div>
              <Link href="/sensors/add">
                <Button className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                  <Plus className="h-4 w-4" />
                  Add Sensor
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search sensors by name, ID, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-blue-500/20 p-3">
                    <Radio className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Sensors</p>
                    <p className="text-2xl font-bold text-white">{sensorsData.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-green-500/20 p-3">
                    <Wifi className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Online</p>
                    <p className="text-2xl font-bold text-white">
                      {sensorsData.filter((s) => s.status === "online").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-yellow-500/20 p-3">
                    <Battery className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Warning</p>
                    <p className="text-2xl font-bold text-white">
                      {sensorsData.filter((s) => s.status === "warning").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#333] bg-[#222]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="rounded-full bg-red-500/20 p-3">
                    <MapPin className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Offline</p>
                    <p className="text-2xl font-bold text-white">
                      {sensorsData.filter((s) => s.status === "offline").length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Table */}
            <div className="hidden rounded-lg border border-[#333] bg-[#222] lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333] hover:bg-[#2a2a2a]">
                    <TableHead className="text-gray-400">Sensor ID</TableHead>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Area</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Battery</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSensors.map((sensor) => (
                    <TableRow key={sensor.sensor_id} className="border-[#333] hover:bg-[#2a2a2a]">
                      <TableCell className="font-mono text-sm text-white">{sensor.sensor_id}</TableCell>
                      <TableCell className="text-white">{sensor.name}</TableCell>
                      <TableCell className="text-gray-300">{getAreaNameById(sensor.area_id)}</TableCell>
                      <TableCell className="text-gray-300">{sensor.sensor_type}</TableCell>
                      <TableCell className="text-gray-300">{sensor.battery}</TableCell>
                      <TableCell>{getStatusBadge(sensor.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/sensors/${sensor.sensor_id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/sensors/${sensor.sensor_id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            onClick={() => handleDelete(sensor.sensor_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 lg:hidden">
              {filteredSensors.map((sensor) => (
                <Card key={sensor.sensor_id} className="border-[#333] bg-[#222]">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm text-gray-400">{sensor.sensor_id}</p>
                        <h3 className="text-lg font-medium text-white">{sensor.name}</h3>
                      </div>
                      {getStatusBadge(sensor.status)}
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Area: </span>
                        <span className="text-gray-300">{getAreaNameById(sensor.area_id)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Type: </span>
                        <span className="text-gray-300">{sensor.sensor_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Battery: </span>
                        <span className="text-gray-300">{sensor.battery}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">IP: </span>
                        <span className="text-gray-300">{sensor.ip_address}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/sensors/${sensor.sensor_id}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-[#444] text-gray-300 hover:bg-[#333] bg-transparent"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/sensors/${sensor.sensor_id}/edit`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-[#444] text-gray-300 hover:bg-[#333] bg-transparent"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-[#444] text-red-500 hover:bg-red-500/10 bg-transparent"
                        onClick={() => handleDelete(sensor.sensor_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSensors.length === 0 && (
              <div className="py-12 text-center">
                <Radio className="mx-auto h-12 w-12 text-gray-500" />
                <p className="mt-4 text-gray-400">No sensors found</p>
                <Link href="/sensors/add">
                  <Button className="mt-4 bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Sensor
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
