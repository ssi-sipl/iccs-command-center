import { areasData } from "./areas"

export interface Sensor {
  sensor_id: string
  name: string
  area_id: string
  sensor_type: string
  alarm: string
  ip_address: string
  latitude: number
  longitude: number
  battery: string
  status: "online" | "offline" | "warning"
  send_drone: string
  active: string
  created_at: string
}

// Static data - replace with API calls later
export const sensorsData: Sensor[] = [
  {
    sensor_id: "SENSOR-001",
    name: "Perimeter Sensor Alpha",
    area_id: "AREA-001",
    sensor_type: "Motion",
    alarm: "Alarm-1",
    ip_address: "192.168.1.101",
    latitude: 28.6139,
    longitude: 77.209,
    battery: "85%",
    status: "online",
    send_drone: "Yes",
    active: "Active",
    created_at: "2025-01-15",
  },
  {
    sensor_id: "SENSOR-002",
    name: "Thermal Detector Beta",
    area_id: "AREA-002",
    sensor_type: "Thermal",
    alarm: "Alarm-2",
    ip_address: "192.168.1.102",
    latitude: 28.5355,
    longitude: 77.391,
    battery: "72%",
    status: "online",
    send_drone: "Yes",
    active: "Active",
    created_at: "2025-02-10",
  },
  {
    sensor_id: "SENSOR-003",
    name: "Vibration Sensor Gamma",
    area_id: "AREA-003",
    sensor_type: "Vibration",
    alarm: "None",
    ip_address: "192.168.1.103",
    latitude: 28.6692,
    longitude: 77.4538,
    battery: "45%",
    status: "warning",
    send_drone: "No",
    active: "Inactive",
    created_at: "2025-03-05",
  },
  {
    sensor_id: "SENSOR-004",
    name: "Acoustic Sensor Delta",
    area_id: "AREA-001",
    sensor_type: "Acoustic",
    alarm: "Alarm-1",
    ip_address: "192.168.1.104",
    latitude: 28.4595,
    longitude: 77.0266,
    battery: "92%",
    status: "online",
    send_drone: "Yes",
    active: "Active",
    created_at: "2025-04-12",
  },
  {
    sensor_id: "SENSOR-005",
    name: "Infrared Sensor Epsilon",
    area_id: "AREA-004",
    sensor_type: "Infrared",
    alarm: "Alarm-3",
    ip_address: "192.168.1.105",
    latitude: 28.6129,
    longitude: 77.2295,
    battery: "15%",
    status: "offline",
    send_drone: "No",
    active: "Inactive",
    created_at: "2025-05-20",
  },
]

export const sensorTypes = ["Motion", "Thermal", "Vibration", "Acoustic", "Infrared", "Pressure", "Radar"]
export const alarmOptions = ["None", "Alarm-1", "Alarm-2", "Alarm-3", "Alarm-4"]
export const statusOptions = ["online", "offline", "warning"]
export const sendDroneOptions = ["Yes", "No"]
export const activeOptions = ["Active", "Inactive"]

// Helper function to get area name by ID
export function getAreaNameById(areaId: string): string {
  const area = areasData.find((a) => a.area_id === areaId)
  return area ? area.area_name : "Unknown Area"
}
