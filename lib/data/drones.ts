export interface Drone {
  drone_id: string
  drone_os_name: string
  drone_type: string
  gps_fix: string
  min_hdop: number
  min_sat_count: number
  max_wind_speed: number
  drone_speed: number
  target_altitude: number
  gps_lost_action: string
  telemetry_lost_action: string
  min_battery_level: number
  usb_address: string
  battery_fail_safe: string
  gps_name: string
  max_altitude: number
  status: "connected" | "disconnected" | "maintenance"
  created_at: string
}

// Static data - replace with API calls later
export const dronesData: Drone[] = [
  {
    drone_id: "DRONE-001",
    drone_os_name: "DroneOS v3.5",
    drone_type: "Quadcopter",
    gps_fix: "3D",
    min_hdop: 0.8,
    min_sat_count: 6,
    max_wind_speed: 15,
    drone_speed: 12,
    target_altitude: 100,
    gps_lost_action: "Return to Launch",
    telemetry_lost_action: "Hover",
    min_battery_level: 20,
    usb_address: "/dev/ttyUSB0",
    battery_fail_safe: "RTL",
    gps_name: "u-blox NEO-M8N",
    max_altitude: 150,
    status: "connected",
    created_at: "2025-01-10",
  },
  {
    drone_id: "DRONE-002",
    drone_os_name: "DroneOS v3.4",
    drone_type: "Hexacopter",
    gps_fix: "3D",
    min_hdop: 0.7,
    min_sat_count: 7,
    max_wind_speed: 20,
    drone_speed: 10,
    target_altitude: 80,
    gps_lost_action: "Land",
    telemetry_lost_action: "Return to Launch",
    min_battery_level: 25,
    usb_address: "/dev/ttyUSB1",
    battery_fail_safe: "Land",
    gps_name: "u-blox NEO-M9N",
    max_altitude: 120,
    status: "connected",
    created_at: "2025-02-15",
  },
  {
    drone_id: "DRONE-003",
    drone_os_name: "DroneOS v3.5",
    drone_type: "Quadcopter",
    gps_fix: "2D",
    min_hdop: 0.9,
    min_sat_count: 5,
    max_wind_speed: 12,
    drone_speed: 15,
    target_altitude: 120,
    gps_lost_action: "Hover",
    telemetry_lost_action: "Land",
    min_battery_level: 15,
    usb_address: "/dev/ttyUSB2",
    battery_fail_safe: "RTL",
    gps_name: "u-blox NEO-M8N",
    max_altitude: 180,
    status: "disconnected",
    created_at: "2025-03-20",
  },
  {
    drone_id: "DRONE-004",
    drone_os_name: "DroneOS v3.3",
    drone_type: "Octocopter",
    gps_fix: "3D",
    min_hdop: 0.6,
    min_sat_count: 8,
    max_wind_speed: 25,
    drone_speed: 8,
    target_altitude: 60,
    gps_lost_action: "Return to Launch",
    telemetry_lost_action: "Return to Launch",
    min_battery_level: 30,
    usb_address: "/dev/ttyUSB3",
    battery_fail_safe: "Land",
    gps_name: "u-blox ZED-F9P",
    max_altitude: 100,
    status: "maintenance",
    created_at: "2025-04-05",
  },
]

export const gpsLostActions = ["Return to Launch", "Land", "Hover", "Continue Mission"]
export const telemetryLostActions = ["Return to Launch", "Land", "Hover", "Continue Mission"]
export const batteryFailSafeActions = ["RTL", "Land"]
export const droneTypes = ["Quadcopter", "Hexacopter", "Octocopter", "Fixed Wing"]
