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

export interface AssessmentFormData {
  fan: ApplianceQty;
  tv: ApplianceQty;
  ref: ApplianceQty;
  aircon: AirconData;
  shower_heater: ApplianceQty;
  has_electric_car: boolean;
  electric_car_qty: number;
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
  fan_day: number;
  fan_night: number;
  tv_day: number;
  tv_night: number;
  ref_day: number;
  ref_night: number;
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
  heater_day: number;
  heater_night: number;
  has_electric_car: boolean;
  electric_car_qty: number;
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
  fan: { day: 0, night: 0 },
  tv: { day: 0, night: 0 },
  ref: { day: 0, night: 0 },
  aircon: {
    hp_0_5: { day: 0, night: 0 },
    hp_1: { day: 0, night: 0 },
    hp_1_5: { day: 0, night: 0 },
    hp_2: { day: 0, night: 0 },
    hp_2_5_plus: { day: 0, night: 0 },
  },
  shower_heater: { day: 0, night: 0 },
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

export interface PageStat {
  page: string;
  visits: number;
  avgDuration: number | null; // seconds
  exitCount: number;
  exitRate: number;           // 0–1
  isFriction: boolean;        // high time + high exit rate
}

export interface AnalyticsData {
  todayVisits: number;
  monthVisits: number;
  avgSessionDuration: number | null; // seconds; resets each month
  momVisitChange: number | null;     // % vs last month, null = no prior data
  momDurationChange: number | null;
  pageStats: PageStat[];
}
