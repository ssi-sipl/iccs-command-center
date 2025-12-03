"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { alarmsData } from "@/lib/data/alarms"
import { areasData } from "@/lib/data/areas"

export default function EditAlarmPage() {
  const params = useParams()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({
    alarm_id: "",
    name: "",
    area_id: "",
    status: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const alarm = alarmsData.find((a) => a.alarm_id === params.id)
    if (alarm) {
      setFormData({
        alarm_id: alarm.alarm_id,
        name: alarm.name,
        area_id: alarm.area_id,
        status: alarm.status,
      })
    }
  }, [params.id])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // TODO: Replace with actual API call
    console.log("Updating alarm:", formData)

    setIsSubmitting(false)
    router.push(`/alarm/${alarm.alarm_id}`)
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex h-screen flex-col bg-[#1a1a1a]">
      <DashboardHeader activeItem="ALARM" />
      <div className="relative flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            {/* Header with Title and Back Button */}
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-[#4A9FD4]">Edit Alarm</h1>
              <Link href={`/alarm/${alarm.alarm_id}`}>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  BACK
                </Button>
              </Link>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Form Grid - 2 columns */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Alarm ID - Locked */}
                <div className="space-y-2">
                  <Label htmlFor="alarm_id" className="text-gray-300">
                    Alarm ID:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="alarm_id"
                    value={formData.alarm_id}
                    disabled
                    className="border-[#444] bg-[#333] text-gray-400"
                  />
                  <p className="text-xs text-gray-500">Alarm ID cannot be changed</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Name:<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter alarm name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="border-[#444] bg-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#4A9FD4] focus:ring-[#4A9FD4]"
                  />
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label className="text-gray-300">
                    Area:<span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.area_id} onValueChange={(value) => handleChange("area_id", value)}>
                    <SelectTrigger className="border-[#444] bg-[#2a2a2a] text-white focus:ring-[#4A9FD4]">
                      <SelectValue placeholder="Select an Area" />
                    </SelectTrigger>
                    <SelectContent className="border-[#333] bg-[#222]">
                      {areasData.map((area) => (
                        <SelectItem
                          key={area.area_id}
                          value={area.area_id}
                          className="text-white focus:bg-[#333] focus:text-white"
                        >
                          {area.area_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center space-x-3 pt-8">
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => handleChange("status", checked)}
                    className="data-[state=checked]:bg-[#4A9FD4]"
                  />
                  <Label htmlFor="status" className="text-gray-300">
                    Status: {formData.status ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>

              {/* Submit Button - Centered */}
              <div className="mt-10 flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2563EB] px-8 text-white hover:bg-[#1D4ED8]"
                >
                  {isSubmitting ? "Updating..." : "UPDATE"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
