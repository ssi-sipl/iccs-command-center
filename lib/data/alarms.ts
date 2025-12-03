import { areasData } from "./areas"

export interface Alarm {
  alarm_id: string
  name: string
  area_id: string
  status: boolean
  created_at: string
  triggered_count: number
  last_triggered: string | null
}

// Static data - replace with API calls later
export const alarmsData: Alarm[] = [
  {
    alarm_id: "ALARM-001",
    name: "Perimeter Breach Alert",
    area_id: "AREA-001",
    status: true,
    created_at: "2025-01-10",
    triggered_count: 12,
    last_triggered: "2025-11-28",
  },
  {
    alarm_id: "ALARM-002",
    name: "Motion Detection Alpha",
    area_id: "AREA-002",
    status: true,
    created_at: "2025-02-15",
    triggered_count: 8,
    last_triggered: "2025-11-25",
  },
  {
    alarm_id: "ALARM-003",
    name: "Thermal Anomaly Warning",
    area_id: "AREA-003",
    status: false,
    created_at: "2025-03-20",
    triggered_count: 3,
    last_triggered: "2025-10-15",
  },
  {
    alarm_id: "ALARM-004",
    name: "Intrusion Alert Beta",
    area_id: "AREA-001",
    status: true,
    created_at: "2025-04-08",
    triggered_count: 25,
    last_triggered: "2025-11-29",
  },
  {
    alarm_id: "ALARM-005",
    name: "Vibration Sensor Alarm",
    area_id: "AREA-004",
    status: true,
    created_at: "2025-05-12",
    triggered_count: 5,
    last_triggered: "2025-11-20",
  },
  {
    alarm_id: "ALARM-006",
    name: "Emergency Response Trigger",
    area_id: "AREA-005",
    status: false,
    created_at: "2025-06-01",
    triggered_count: 0,
    last_triggered: null,
  },
]

// Helper function to get area name by ID
export function getAreaNameById(areaId: string): string {
  const area = areasData.find((a) => a.area_id === areaId)
  return area ? area.area_name : "Unknown Area"
}
