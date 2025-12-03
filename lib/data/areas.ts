export interface Area {
  area_id: string
  area_name: string
  latitude: number
  longitude: number
  created_at: string
  status: "active" | "inactive"
}

// Static data - replace with API calls later
export const areasData: Area[] = [
  {
    area_id: "AREA-001",
    area_name: "North Sector Zone A",
    latitude: 28.6139,
    longitude: 77.209,
    created_at: "2025-01-15",
    status: "active",
  },
  {
    area_id: "AREA-002",
    area_name: "South Perimeter Block",
    latitude: 28.5355,
    longitude: 77.391,
    created_at: "2025-02-20",
    status: "active",
  },
  {
    area_id: "AREA-003",
    area_name: "East Industrial Zone",
    latitude: 28.6692,
    longitude: 77.4538,
    created_at: "2025-03-10",
    status: "inactive",
  },
  {
    area_id: "AREA-004",
    area_name: "West Residential Area",
    latitude: 28.4595,
    longitude: 77.0266,
    created_at: "2025-04-05",
    status: "active",
  },
  {
    area_id: "AREA-005",
    area_name: "Central Command Hub",
    latitude: 28.6129,
    longitude: 77.2295,
    created_at: "2025-05-12",
    status: "active",
  },
]
