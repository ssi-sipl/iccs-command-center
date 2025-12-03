"use client"

import { useState } from "react"
import { Plus, Minus, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MapView() {
  const [zoom, setZoom] = useState(15)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 20))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 1))

  return (
    <div className="relative h-full w-full">
      {/* Satellite Map Background */}
      <div
        className="h-full w-full bg-cover bg-center"
        style={{
          backgroundImage: `url('/satellite-aerial-view-of-city-urban-area-from-abov.jpg')`,
        }}
      />

      <div className="absolute left-2 top-2 flex flex-col gap-1 md:left-4 md:top-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-white text-black hover:bg-gray-200"
          onClick={handleZoomIn}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-white text-black hover:bg-gray-200"
          onClick={handleZoomOut}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-500 shadow-lg md:h-10 md:w-10">
          <Camera className="h-4 w-4 text-white md:h-5 md:w-5" />
        </div>
      </div>

      {/* Additional Markers */}
      <div className="absolute left-[20%] top-[30%]">
        <div className="h-3 w-3 rounded border border-blue-400 bg-blue-500/50 md:h-4 md:w-4" />
      </div>
      <div className="absolute bottom-[15%] left-[25%]">
        <div className="h-2 w-2 rounded-full bg-blue-400 md:h-3 md:w-3" />
      </div>
      <div className="absolute bottom-[12%] right-[30%]">
        <div className="h-2 w-2 rounded-full bg-blue-400 md:h-3 md:w-3" />
      </div>
    </div>
  )
}
