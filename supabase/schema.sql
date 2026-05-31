-- =============================================
-- MAC Solar — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS assessments (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Electric Fan
  fan_day         INT         DEFAULT 0 NOT NULL,
  fan_night       INT         DEFAULT 0 NOT NULL,

  -- TV
  tv_day          INT         DEFAULT 0 NOT NULL,
  tv_night        INT         DEFAULT 0 NOT NULL,

  -- Refrigerator
  ref_day         INT         DEFAULT 0 NOT NULL,
  ref_night       INT         DEFAULT 0 NOT NULL,

  -- Aircon
  ac_05hp_day     INT         DEFAULT 0 NOT NULL,
  ac_05hp_night   INT         DEFAULT 0 NOT NULL,
  ac_1hp_day      INT         DEFAULT 0 NOT NULL,
  ac_1hp_night    INT         DEFAULT 0 NOT NULL,
  ac_15hp_day     INT         DEFAULT 0 NOT NULL,
  ac_15hp_night   INT         DEFAULT 0 NOT NULL,
  ac_2hp_day      INT         DEFAULT 0 NOT NULL,
  ac_2hp_night    INT         DEFAULT 0 NOT NULL,
  ac_25hp_day     INT         DEFAULT 0 NOT NULL,
  ac_25hp_night   INT         DEFAULT 0 NOT NULL,

  -- Shower Heater
  heater_day      INT         DEFAULT 0 NOT NULL,
  heater_night    INT         DEFAULT 0 NOT NULL,

  -- Electric Car
  has_electric_car BOOLEAN    DEFAULT FALSE NOT NULL,
  electric_car_qty INT        DEFAULT 0 NOT NULL,

  -- Monthly Electricity Bill
  monthly_bill_avg NUMERIC(10, 2),
  monthly_kwh      NUMERIC(10, 2),

  -- Location
  location_address TEXT,
  location_lat     NUMERIC(10, 7),
  location_lng     NUMERIC(10, 7)
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can INSERT — customers submit the form
CREATE POLICY "Public can insert assessments"
  ON assessments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated admins can SELECT
CREATE POLICY "Admins can read assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (true);

-- Prevent public read
CREATE POLICY "Block public read"
  ON assessments
  FOR SELECT
  TO anon
  USING (false);
