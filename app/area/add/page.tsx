"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, MapPin } from "lucide-react"

export default function AddAreaPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({
    area_id: "",
    area_name: "",
    latitude: "",
    longitude: "",
    status: "active",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Replace with actual API call
    console.log("Creating area:", formData)

    setIsSubmitting(false)
    router.push("/area")
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="AREA" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-2xl">
            {/* Back Button */}
            <Link href="/area" className="mb-6 inline-flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Areas
            </Link>

            <Card className="border-[#333] bg-[#222]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B0000]">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Add New Area</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create a new surveillance area with coordinates
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="area_id" className="text-gray-300">
                        Area ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="area_id"
                        placeholder="e.g., AREA-006"
                        value={formData.area_id}
                        onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                        required
                        className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-gray-300">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="border-[#333] bg-[#1a1a1a] text-white focus:ring-[#8B0000]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[#333] bg-[#222]">
                          <SelectItem value="active" className="text-white focus:bg-[#333] focus:text-white">
                            Active
                          </SelectItem>
                          <SelectItem value="inactive" className="text-white focus:bg-[#333] focus:text-white">
                            Inactive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_name" className="text-gray-300">
                      Area Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="area_name"
                      placeholder="e.g., North Sector Zone B"
                      value={formData.area_name}
                      onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                      required
                      className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-gray-300">
                        Latitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 28.6139"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        required
                        className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                      <p className="text-xs text-gray-500">Range: -90 to 90</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-gray-300">
                        Longitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 77.2090"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        required
                        className="border-[#333] bg-[#1a1a1a] text-white placeholder:text-gray-500 focus:border-[#8B0000] focus:ring-[#8B0000]"
                      />
                      <p className="text-xs text-gray-500">Range: -180 to 180</p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Link href="/area">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-[#333] bg-transparent text-white hover:bg-[#333] sm:w-auto"
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full gap-2 bg-[#8B0000] text-white hover:bg-[#6B0000] sm:w-auto"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Creating..." : "Create Area"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
