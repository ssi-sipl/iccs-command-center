"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Pencil, MapPin, Calendar, Hash, Navigation } from "lucide-react"
import { areasData } from "@/lib/data/areas"

export default function ViewAreaPage() {
  const params = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const area = areasData.find((a) => a.area_id === params.id)

  if (!area) {
    return (
      <div className="flex h-screen flex-col bg-[#1a1a1a]">
        <DashboardHeader activeItem="AREA" />
        <div className="relative flex flex-1 overflow-hidden">
          <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h1 className="mb-2 text-xl font-bold text-white">Area Not Found</h1>
              <p className="mb-4 text-gray-400">The requested area does not exist.</p>
              <Link href="/area">
                <Button className="bg-[#8B0000] text-white hover:bg-[#6B0000]">Back to Areas</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="AREA" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            {/* Back Button */}
            <Link href="/area" className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Areas
            </Link>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white md:text-3xl">{area.area_name}</h1>
                  <Badge
                    className={
                      area.status === "active" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                    }
                  >
                    {area.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{area.area_id}</p>
              </div>
              <Link href={`/area/${area.area_id}/edit`}>
                <Button className="gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000]">
                  <Pencil className="h-4 w-4" />
                  Edit Area
                </Button>
              </Link>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#333] bg-[#222]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Hash className="h-4 w-4" />
                    Area ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-white">{area.area_id}</p>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#222]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Calendar className="h-4 w-4" />
                    Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-white">{area.created_at}</p>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#222]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Navigation className="h-4 w-4" />
                    Latitude
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-lg font-semibold text-white">{area.latitude.toFixed(4)}</p>
                </CardContent>
              </Card>

              <Card className="border-[#333] bg-[#222]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Navigation className="h-4 w-4 rotate-90" />
                    Longitude
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-lg font-semibold text-white">{area.longitude.toFixed(4)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Map Preview */}
            <Card className="mt-6 border-[#333] bg-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5" />
                  Location Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#1a1a1a]">
                  <img
                    src="/satellite-aerial-view-of-city-urban-area-from-abov.jpg"
                    alt="Satellite view of area"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B0000] shadow-lg">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 px-3 py-2">
                    <p className="font-mono text-sm text-white">
                      {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                    </p>
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
