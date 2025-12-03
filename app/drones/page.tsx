"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Eye, Pencil, Trash2, Search, Plane, Battery, Gauge } from "lucide-react"
import { dronesData, type Drone } from "@/lib/data/drones"

export default function DronesListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [drones, setDrones] = useState<Drone[]>(dronesData)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredDrones = drones.filter(
    (drone) =>
      drone.drone_os_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drone.drone_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drone.drone_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (droneId: string) => {
    setDrones(drones.filter((drone) => drone.drone_id !== droneId))
  }

  const getStatusBadge = (status: Drone["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30">Connected</Badge>
      case "disconnected":
        return <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30">Disconnected</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">Maintenance</Badge>
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="DRONES" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white md:text-3xl">Drone Management</h1>
                <p className="mt-1 text-sm text-gray-400">Manage and configure all surveillance drones</p>
              </div>
              <Link href="/drones/add">
                <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
                  <Plus className="h-4 w-4" />
                  Add New Drone
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search drones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-[#333] bg-[#222] pl-10 text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                />
              </div>
              <p className="text-sm text-gray-400">
                Showing {filteredDrones.length} of {drones.length} drones
              </p>
            </div>

            {/* Table - Desktop */}
            <div className="hidden rounded-lg border border-[#333] bg-[#222] lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#333] hover:bg-transparent">
                    <TableHead className="text-gray-400">Drone ID</TableHead>
                    <TableHead className="text-gray-400">OS Name</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Speed (m/s)</TableHead>
                    <TableHead className="text-gray-400">Max Alt (m)</TableHead>
                    <TableHead className="text-gray-400">Battery Min</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrones.map((drone) => (
                    <TableRow key={drone.drone_id} className="border-[#333] hover:bg-[#2a2a2a]">
                      <TableCell className="font-medium text-white">{drone.drone_id}</TableCell>
                      <TableCell className="text-gray-300">{drone.drone_os_name}</TableCell>
                      <TableCell className="text-gray-300">{drone.drone_type}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-400">{drone.drone_speed}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-400">{drone.max_altitude}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-400">{drone.min_battery_level}%</TableCell>
                      <TableCell>{getStatusBadge(drone.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/drones/${drone.drone_id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:bg-[#333] hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/drones/${drone.drone_id}/edit`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:bg-[#333] hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:bg-red-600/20 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-[#333] bg-[#222]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Drone</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to delete "{drone.drone_id}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(drone.drone_id)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cards - Mobile/Tablet */}
            <div className="flex flex-col gap-4 lg:hidden">
              {filteredDrones.map((drone) => (
                <div key={drone.drone_id} className="rounded-lg border border-[#333] bg-[#222] p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{drone.drone_id}</p>
                      <h3 className="font-medium text-white">{drone.drone_os_name}</h3>
                      <p className="text-sm text-gray-400">{drone.drone_type}</p>
                    </div>
                    {getStatusBadge(drone.status)}
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Gauge className="h-4 w-4" />
                      <span>{drone.drone_speed} m/s</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Plane className="h-4 w-4" />
                      <span>{drone.max_altitude}m</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Battery className="h-4 w-4" />
                      <span>{drone.min_battery_level}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/drones/${drone.drone_id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-[#333] bg-transparent text-white hover:bg-[#333]"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/drones/${drone.drone_id}/edit`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-[#333] bg-transparent text-white hover:bg-[#333]"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-[#333] bg-transparent text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-[#333] bg-[#222]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Drone</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete "{drone.drone_id}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-[#333] bg-transparent text-white hover:bg-[#333]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(drone.drone_id)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            {filteredDrones.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-[#333] bg-[#222] py-12">
                <Plane className="mb-4 h-12 w-12 text-gray-600" />
                <p className="text-lg font-medium text-gray-400">No drones found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or add a new drone</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
