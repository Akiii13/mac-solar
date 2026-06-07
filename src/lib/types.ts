export interface ApplianceQty {
  day: number;
  night: number;
}

export interface AirconData {
  hp_0_5: ApplianceQty;
  hp_1: ApplianceQty;
  hp_1_5: ApplianceQty;
  hp_2: ApplianceQty;
  hp_2_5_plus: ApplianceQty;
}

export interface WaterPumpData {
  hp_0_5: ApplianceQty;
  hp_1: ApplianceQty;
  hp_1_5: ApplianceQty;
  hp_2: ApplianceQty;
  hp_3_plus: ApplianceQty;
}

export interface AssessmentFormData {
  // Lighting & Fans
  lights: ApplianceQty;
  fan: ApplianceQty;
  // Entertainment & Work
  tv: ApplianceQty;
  desktop: ApplianceQty;
  // Kitchen & Cooking
  ref: ApplianceQty;
  rice_cooker: ApplianceQty;
  induction_cooker: ApplianceQty;
  electric_oven: ApplianceQty;
  coffee_maker: ApplianceQty;
  water_dispenser: ApplianceQty;
  // Cooling
  aircon: AirconData;
  water_pump: WaterPumpData;
  // Personal Care & Utilities
  shower_heater: ApplianceQty;
  flat_iron: ApplianceQty;
  // Electric Vehicle
  has_electric_car: boolean;
  electric_car_qty: number;
  // Electricity & Location
  monthly_bill_avg: string;
  monthly_kwh: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  email: string;
}

export type AssessmentStatus = "pending" | "reviewed";

export interface Assessment {
  id: string;
  created_at: string;
  // Lighting & Fans
  lights_day: number;
  lights_night: number;
  fan_day: number;
  fan_night: number;
  // Entertainment & Work
  tv_day: number;
  tv_night: number;
  desktop_day: number;
  desktop_night: number;
  // Kitchen & Cooking
  ref_day: number;
  ref_night: number;
  rice_cooker_day: number;
  rice_cooker_night: number;
  induction_day: number;
  induction_night: number;
  electric_oven_day: number;
  electric_oven_night: number;
  coffee_maker_day: number;
  coffee_maker_night: number;
  water_dispenser_day: number;
  water_dispenser_night: number;
  // Air Conditioner
  ac_05hp_day: number;
  ac_05hp_night: number;
  ac_1hp_day: number;
  ac_1hp_night: number;
  ac_15hp_day: number;
  ac_15hp_night: number;
  ac_2hp_day: number;
  ac_2hp_night: number;
  ac_25hp_day: number;
  ac_25hp_night: number;
  // Water Pump
  wp_05hp_day: number;
  wp_05hp_night: number;
  wp_1hp_day: number;
  wp_1hp_night: number;
  wp_15hp_day: number;
  wp_15hp_night: number;
  wp_2hp_day: number;
  wp_2hp_night: number;
  wp_3hp_day: number;
  wp_3hp_night: number;
  // Personal Care & Utilities
  heater_day: number;
  heater_night: number;
  flat_iron_day: number;
  flat_iron_night: number;
  // Electric Vehicle
  has_electric_car: boolean;
  electric_car_qty: number;
  // Electricity & Location
  monthly_bill_avg: number;
  monthly_kwh: number;
  location_address: string;
  location_lat: number;
  location_lng: number;
  email: string | null;
  status: AssessmentStatus;
  email_sent_at: string | null;
  admin_note: string | null;
}

export const INITIAL_FORM_DATA: AssessmentFormData = {
  lights: { day: 0, night: 0 },
  fan: { day: 0, night: 0 },
  tv: { day: 0, night: 0 },
  desktop: { day: 0, night: 0 },
  ref: { day: 0, night: 0 },
  rice_cooker: { day: 0, night: 0 },
  induction_cooker: { day: 0, night: 0 },
  electric_oven: { day: 0, night: 0 },
  coffee_maker: { day: 0, night: 0 },
  water_dispenser: { day: 0, night: 0 },
  aircon: {
    hp_0_5: { day: 0, night: 0 },
    hp_1: { day: 0, night: 0 },
    hp_1_5: { day: 0, night: 0 },
    hp_2: { day: 0, night: 0 },
    hp_2_5_plus: { day: 0, night: 0 },
  },
  water_pump: {
    hp_0_5: { day: 0, night: 0 },
    hp_1: { day: 0, night: 0 },
    hp_1_5: { day: 0, night: 0 },
    hp_2: { day: 0, night: 0 },
    hp_3_plus: { day: 0, night: 0 },
  },
  shower_heater: { day: 0, night: 0 },
  flat_iron: { day: 0, night: 0 },
  has_electric_car: false,
  electric_car_qty: 0,
  monthly_bill_avg: "",
  monthly_kwh: "",
  location_address: "",
  location_lat: null,
  location_lng: null,
  email: "",
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface StepBreakdown {
  step: number;
  label: string;
  exitCount: number;
  exitRate: number; // fraction of total /assessment sessions that exited here
}

export interface PageStat {
  page: string;
  visits: number;
  avgDuration: number | null;  // seconds
  exitCount: number;
  exitRate: number;            // 0–1
  isFriction: boolean;         // high time + high exit rate
  stepBreakdown?: StepBreakdown[]; // only present for /assessment
}

export interface AnalyticsData {
  todayVisits: number;
  monthVisits: number;
  avgSessionDuration: number | null; // seconds; resets each month
  momVisitChange: number | null;     // % vs last month, null = no prior data
  momDurationChange: number | null;
  pageStats: PageStat[];
}

// ─── Activity Log ──────────────────────────────────────────────────────────────

export type ActivityActionType =
  | "email_sent"
  | "deleted"
  | "blocked"
  | "unblocked"
  | "password_changed"
  | "email_changed"
  | "contact_updated";

export interface ActivityEntry {
  id: string;
  created_at: string;
  action_type: ActivityActionType;
  target_email: string | null;
  details: string | null;
  assessment_id: string | null;
}

// ─── Site Settings ─────────────────────────────────────────────────────────────

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  facebook: string;
}

export const DEFAULT_CONTACT: ContactInfo = {
  address: "Alangalang, Leyte 6517",
  phone: "0950 607 4094",
  email: "marvs9714@gmail.com",
  facebook: "https://www.facebook.com/profile.php?id=61556207160231",
};
