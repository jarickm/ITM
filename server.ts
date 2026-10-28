import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  SEED_ASSETS, 
  SEED_ONBOARDINGS, 
  SEED_OFFBOARDINGS, 
  SEED_REQUESTS, 
  SEED_BORROWINGS, 
  SEED_PREVENTIVE_MAINTENANCE, 
  SEED_LIABILITIES, 
  SEED_ACTIVITY_LOGS, 
  INITIAL_SETTINGS,
  DEFAULT_DROPDOWN_OPTIONS,
  SEED_KPI_2026 
} from './src/data/seedData.ts';

dotenv.config({ override: true });

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function parseDatabaseUrl(raw: string): string {
  let cleaned = raw.trim();
  // Handle double @ if password contains unencoded @
  const atCount = (cleaned.match(/@/g) || []).length;
  if (atCount > 1) {
    const lastAtIdx = cleaned.lastIndexOf('@');
    const pre = cleaned.substring(0, lastAtIdx);
    const post = cleaned.substring(lastAtIdx + 1);
    const fixedPre = pre.replace(/^postgresql:\/\/([^:]+):?/, (_m, user) => {
      return `postgresql://${user}:`;
    }).replace(/(?<=:[^@]*?)@/g, '%40');
    cleaned = `${fixedPre}@${post}`;
  }

  // Handle direct db.<project>.supabase.co:
  // Supabase direct hosts resolve to IPv6-only addresses.
  // In IPv4 environments (such as cloud containers), we map to Supabase's official IPv4 pooler gateway.
  const match = cleaned.match(/postgresql:\/\/([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?\/(.*)/);
  if (match) {
    const [, user, pass, projectRef, db] = match;
    const cleanUser = user.includes('.') ? user : `${user}.${projectRef}`;
    return `postgresql://${cleanUser}:${pass}@aws-0-ap-northeast-1.pooler.supabase.com:5432/${db || 'postgres'}`;
  }
  return cleaned;
}

const DEFAULT_SUPABASE = 'postgresql://postgres:Coolaire%40502022@db.byasmykumlpzrldseest.supabase.co:5432/postgres';
let envUrl = process.env.DATABASE_URL || '';
if (!envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
  envUrl = DEFAULT_SUPABASE;
}
const RAW_DATABASE_URL = envUrl;
const RESOLVED_DATABASE_URL = parseDatabaseUrl(RAW_DATABASE_URL);

export const pool = new Pool({
  connectionString: RESOLVED_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[Supabase Pool Error]:', err.message);
});

// Auto-create database tables on Supabase
async function initDatabase() {
  console.log('[Supabase] Initializing PostgreSQL schemas on Supabase...');
  try {
    const client = await pool.connect();
    try {
      // 1. Assets Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS assets (
          id VARCHAR(255) PRIMARY KEY,
          asset_code VARCHAR(255),
          status VARCHAR(100),
          location VARCHAR(255),
          department VARCHAR(255),
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. Onboardings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS onboardings (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 3. Offboardings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS offboardings (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 4. Requests Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS requests (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 5. Borrowings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS borrowings (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 6. Preventive Maintenance Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS preventive_maintenance (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 7. Liabilities Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS liabilities (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 8. Activity Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 9. System Settings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 10. Dropdown Options Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS dropdown_options (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 11. KPI Records Table (2026 Corporate Targets)
      await client.query(`
        CREATE TABLE IF NOT EXISTS kpi_records (
          id VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Ensure all tables have full relational columns in Supabase so Supabase Studio Table Editor displays all data
      await client.query(`
        -- 1. assets columns
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS employee_or_device_name VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS category VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS specification_or_sn TEXT;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_code VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS department VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_date VARCHAR(100);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS cost NUMERIC;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_expiry VARCHAR(100);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS location VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_defective BOOLEAN DEFAULT FALSE;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS defective_details TEXT;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS repair_vendor VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS rma_number VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS custody_history JSONB;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS pms_completed BOOLEAN DEFAULT FALSE;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS pms_date VARCHAR(100);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS pms_half VARCHAR(100);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS pms_technician VARCHAR(255);
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS pms_remarks TEXT;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 2. onboardings columns
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS department VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS position VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS start_date VARCHAR(100);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS control_number VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS date_of_onboarding VARCHAR(100);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS device_issued VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS serial_number VARCHAR(255);
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS remarks TEXT;
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS assigned_assets JSONB;
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 3. offboardings columns
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS department VARCHAR(255);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS position VARCHAR(255);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS separation_date VARCHAR(100);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS control_number VARCHAR(255);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS returned_devices JSONB;
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS it_clearance_by VARCHAR(255);
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS remarks TEXT;
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 4. requests columns
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS date_reported VARCHAR(100);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(100);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS reference_no VARCHAR(255);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS employee_or_requester_name VARCHAR(255);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS department_or_branches VARCHAR(255);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS actions_taken_or_remarks TEXT;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS date_created VARCHAR(100);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS date_resolved VARCHAR(100);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS days NUMERIC;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS major_or_minor VARCHAR(100);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS assigned_technician VARCHAR(255);
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS estimated_amount NUMERIC;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 5. borrowings columns
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS borrower_name VARCHAR(255);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS department VARCHAR(255);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS item_category VARCHAR(255);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS item_name_or_code VARCHAR(255);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS asset_code VARCHAR(255);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS borrow_date VARCHAR(100);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS return_date VARCHAR(100);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS actual_return_date VARCHAR(100);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS purpose TEXT;
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS remarks TEXT;
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 6. preventive_maintenance columns
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS description VARCHAR(255);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS date VARCHAR(100);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS date_purchase VARCHAR(100);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS asset_code VARCHAR(255);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS activity_work_done TEXT;
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS performed_by VARCHAR(255);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS recommendation TEXT;
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS department VARCHAR(255);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS next_maintenance_date VARCHAR(100);
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 7. liabilities columns
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS qty NUMERIC DEFAULT 1;
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS uom VARCHAR(50);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS item_description VARCHAR(255);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS date_issued VARCHAR(100);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS department VARCHAR(255);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS asset_code VARCHAR(255);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS status VARCHAR(100);
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS remarks TEXT;
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

        -- 8. activity_logs columns
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS timestamp VARCHAR(100);
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor VARCHAR(255);
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS target_entity VARCHAR(255);
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS target_id VARCHAR(255);
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS details TEXT;
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS data JSONB;

        -- 9. settings, dropdown_options, kpi_records
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE dropdown_options ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE kpi_records ADD COLUMN IF NOT EXISTS data JSONB;
      `);

      // Relax legacy not-null constraints if tables were previously created with rigid columns
      await client.query(`
        DO $$
        BEGIN
          -- assets
          BEGIN ALTER TABLE assets ALTER COLUMN employee_or_device_name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE assets ALTER COLUMN category DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE assets ALTER COLUMN specification_or_sn DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE assets ALTER COLUMN asset_code DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE assets ALTER COLUMN status DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE assets ALTER COLUMN department DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE assets ALTER COLUMN purchase_date DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- borrowings
          BEGIN ALTER TABLE borrowings ALTER COLUMN borrower_name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE borrowings ALTER COLUMN department DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE borrowings ALTER COLUMN item_category DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE borrowings ALTER COLUMN borrow_date DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE borrowings ALTER COLUMN return_date DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE borrowings ALTER COLUMN status DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- liabilities
          BEGIN ALTER TABLE liabilities ALTER COLUMN uom DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE liabilities ALTER COLUMN item_description DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE liabilities ALTER COLUMN date_issued DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE liabilities ALTER COLUMN employee_name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE liabilities ALTER COLUMN department DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE liabilities ALTER COLUMN asset_code DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE liabilities ALTER COLUMN company DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- offboardings
          BEGIN ALTER TABLE offboardings ALTER COLUMN employee_name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE offboardings ALTER COLUMN department DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE offboardings ALTER COLUMN position DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE offboardings ALTER COLUMN separation_date DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE offboardings ALTER COLUMN company DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE offboardings ALTER COLUMN control_number DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE offboardings ALTER COLUMN status DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- onboardings
          BEGIN ALTER TABLE onboardings ALTER COLUMN employee_name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN department DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN position DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN start_date DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN company DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN control_number DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN status DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE onboardings ALTER COLUMN date_of_onboarding DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- preventive_maintenance
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN description DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN date DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN date_purchase DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN asset_code DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN activity_work_done DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN performed_by DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN status DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN recommendation DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE preventive_maintenance ALTER COLUMN department DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- requests
          BEGIN ALTER TABLE requests ALTER COLUMN date_reported DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN request_type DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN reference_no DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN employee_or_requester_name DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN department_or_branches DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN actions_taken_or_remarks DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN date_created DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN major_or_minor DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE requests ALTER COLUMN status DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;

          -- activity_logs
          BEGIN ALTER TABLE activity_logs ALTER COLUMN timestamp DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE activity_logs ALTER COLUMN actor DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE activity_logs ALTER COLUMN action DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE activity_logs ALTER COLUMN target_entity DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
          BEGIN ALTER TABLE activity_logs ALTER COLUMN details DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
        END $$;
      `);

      // Backfill migration: Populate all individual relational columns from data JSONB
      await client.query(`
        -- assets backfill
        UPDATE assets SET
          employee_or_device_name = COALESCE(employee_or_device_name, data->>'employeeOrDeviceName'),
          category = COALESCE(category, data->>'category', 'Laptop'),
          specification_or_sn = COALESCE(specification_or_sn, data->>'specificationOrSN'),
          asset_code = COALESCE(asset_code, data->>'assetCode'),
          status = COALESCE(status, data->>'status', 'Available'),
          department = COALESCE(department, data->>'department'),
          purchase_date = COALESCE(purchase_date, data->>'purchaseDate'),
          cost = COALESCE(cost, NULLIF(data->>'cost', '')::numeric),
          warranty_expiry = COALESCE(warranty_expiry, data->>'warrantyExpiry'),
          location = COALESCE(location, data->>'location'),
          notes = COALESCE(notes, data->>'notes'),
          is_defective = COALESCE(is_defective, NULLIF(data->>'isDefective', '')::boolean, false),
          defective_details = COALESCE(defective_details, data->>'defectiveDetails'),
          repair_vendor = COALESCE(repair_vendor, data->>'repairVendor'),
          rma_number = COALESCE(rma_number, data->>'rmaNumber'),
          custody_history = COALESCE(custody_history, data->'custodyHistory'),
          pms_completed = COALESCE(pms_completed, NULLIF(data->>'pmsCompleted', '')::boolean, false),
          pms_date = COALESCE(pms_date, data->>'pmsDate'),
          pms_half = COALESCE(pms_half, data->>'pmsHalf'),
          pms_technician = COALESCE(pms_technician, data->>'pmsTechnician'),
          pms_remarks = COALESCE(pms_remarks, data->>'pmsRemarks'),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- onboardings backfill
        UPDATE onboardings SET
          employee_name = COALESCE(employee_name, data->>'employeeName'),
          department = COALESCE(department, data->>'department'),
          position = COALESCE(position, data->>'position'),
          start_date = COALESCE(start_date, data->>'startDate'),
          company = COALESCE(company, data->>'company'),
          control_number = COALESCE(control_number, data->>'controlNumber'),
          status = COALESCE(status, data->>'status', 'Pending'),
          date_of_onboarding = COALESCE(date_of_onboarding, data->>'dateOfOnboarding'),
          device_issued = COALESCE(device_issued, data->>'deviceIssued'),
          serial_number = COALESCE(serial_number, data->>'serialNumber'),
          remarks = COALESCE(remarks, data->>'remarks'),
          notes = COALESCE(notes, data->>'notes'),
          assigned_assets = COALESCE(assigned_assets, data->'assignedAssets'),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- offboardings backfill
        UPDATE offboardings SET
          employee_name = COALESCE(employee_name, data->>'employeeName'),
          department = COALESCE(department, data->>'department'),
          position = COALESCE(position, data->>'position'),
          separation_date = COALESCE(separation_date, data->>'separationDate'),
          company = COALESCE(company, data->>'company'),
          control_number = COALESCE(control_number, data->>'controlNumber'),
          status = COALESCE(status, data->>'status', 'Pending'),
          returned_devices = COALESCE(returned_devices, data->'returnedDevices'),
          it_clearance_by = COALESCE(it_clearance_by, data->>'itClearanceBy'),
          remarks = COALESCE(remarks, data->>'remarks'),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- requests backfill
        UPDATE requests SET
          date_reported = COALESCE(date_reported, data->>'dateReported'),
          request_type = COALESCE(request_type, data->>'requestType', 'PR'),
          reference_no = COALESCE(reference_no, data->>'referenceNo'),
          employee_or_requester_name = COALESCE(employee_or_requester_name, data->>'employeeOrRequesterName'),
          department_or_branches = COALESCE(department_or_branches, data->>'departmentOrBranches'),
          actions_taken_or_remarks = COALESCE(actions_taken_or_remarks, data->>'actionsTakenOrRemarks'),
          date_created = COALESCE(date_created, data->>'dateCreated'),
          date_resolved = COALESCE(date_resolved, data->>'dateResolved'),
          days = COALESCE(days, NULLIF(data->>'days', '')::numeric),
          major_or_minor = COALESCE(major_or_minor, data->>'majorOrMinor', 'Minor'),
          status = COALESCE(status, data->>'status', 'Pending'),
          assigned_technician = COALESCE(assigned_technician, data->>'assignedTechnician'),
          estimated_amount = COALESCE(estimated_amount, NULLIF(data->>'estimatedAmount', '')::numeric),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- borrowings backfill
        UPDATE borrowings SET
          borrower_name = COALESCE(borrower_name, data->>'borrowerName'),
          department = COALESCE(department, data->>'department'),
          item_category = COALESCE(item_category, data->>'itemCategory'),
          item_name_or_code = COALESCE(item_name_or_code, data->>'itemNameOrCode', data->>'itemCategory'),
          asset_code = COALESCE(asset_code, data->>'assetCode'),
          borrow_date = COALESCE(borrow_date, data->>'borrowDate'),
          return_date = COALESCE(return_date, data->>'returnDate'),
          actual_return_date = COALESCE(actual_return_date, data->>'actualReturnDate'),
          status = COALESCE(status, data->>'status', 'Active / Borrowed'),
          purpose = COALESCE(purpose, data->>'purpose'),
          remarks = COALESCE(remarks, data->>'remarks'),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- preventive_maintenance backfill
        UPDATE preventive_maintenance SET
          description = COALESCE(description, data->>'description'),
          date = COALESCE(date, data->>'date'),
          date_purchase = COALESCE(date_purchase, data->>'datePurchase'),
          asset_code = COALESCE(asset_code, data->>'assetCode'),
          activity_work_done = COALESCE(activity_work_done, data->>'activityWorkDone'),
          performed_by = COALESCE(performed_by, data->>'performedBy'),
          status = COALESCE(status, data->>'status', 'Completed'),
          recommendation = COALESCE(recommendation, data->>'recommendation'),
          department = COALESCE(department, data->>'department'),
          next_maintenance_date = COALESCE(next_maintenance_date, data->>'nextMaintenanceDate'),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- liabilities backfill
        UPDATE liabilities SET
          qty = COALESCE(qty, NULLIF(data->>'qty', '')::numeric, 1),
          uom = COALESCE(uom, data->>'uom', 'UNIT'),
          item_description = COALESCE(item_description, data->>'itemDescription'),
          date_issued = COALESCE(date_issued, data->>'dateIssued'),
          employee_name = COALESCE(employee_name, data->>'employeeName'),
          department = COALESCE(department, data->>'department'),
          asset_code = COALESCE(asset_code, data->>'assetCode'),
          company = COALESCE(company, data->>'company'),
          status = COALESCE(status, data->>'status', 'Active Liability'),
          remarks = COALESCE(remarks, data->>'remarks'),
          raw_data = COALESCE(raw_data, data)
        WHERE data IS NOT NULL;

        -- activity_logs backfill
        UPDATE activity_logs SET
          timestamp = COALESCE(timestamp, data->>'timestamp'),
          actor = COALESCE(actor, data->>'actor'),
          action = COALESCE(action, data->>'action'),
          target_entity = COALESCE(target_entity, data->>'targetEntity'),
          target_id = COALESCE(target_id, data->>'targetId'),
          details = COALESCE(details, data->>'details')
        WHERE data IS NOT NULL;
      `);

      console.log('[Supabase] All PostgreSQL tables, relational columns, and backfills verified.');

      // Check if tables need initial seeding
      const countRes = await client.query('SELECT COUNT(*) FROM assets;');
      const assetCount = parseInt(countRes.rows[0].count, 10);

      if (assetCount === 0) {
        console.log('[Supabase] Database is empty. Seeding initial enterprise dataset into Supabase...');
        await seedDatabase(client);
      } else {
        console.log(`[Supabase] Database already contains ${assetCount} asset records.`);
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Supabase Init Error]:', err.message);
  }
}

async function seedDatabase(client: any) {
  // 1. Assets
  for (const asset of SEED_ASSETS) {
    await client.query(
      `INSERT INTO assets (
        id, employee_or_device_name, category, specification_or_sn, asset_code,
        status, department, purchase_date, cost, warranty_expiry, location,
        notes, is_defective, defective_details, custody_history,
        pms_completed, pms_date, pms_half, pms_technician, pms_remarks,
        raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_or_device_name = EXCLUDED.employee_or_device_name,
        category = EXCLUDED.category,
        specification_or_sn = EXCLUDED.specification_or_sn,
        asset_code = EXCLUDED.asset_code,
        status = EXCLUDED.status,
        department = EXCLUDED.department,
        purchase_date = EXCLUDED.purchase_date,
        cost = EXCLUDED.cost,
        warranty_expiry = EXCLUDED.warranty_expiry,
        location = EXCLUDED.location,
        notes = EXCLUDED.notes,
        is_defective = EXCLUDED.is_defective,
        defective_details = EXCLUDED.defective_details,
        custody_history = EXCLUDED.custody_history,
        pms_completed = EXCLUDED.pms_completed,
        pms_date = EXCLUDED.pms_date,
        pms_half = EXCLUDED.pms_half,
        pms_technician = EXCLUDED.pms_technician,
        pms_remarks = EXCLUDED.pms_remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        asset.id,
        asset.employeeOrDeviceName,
        asset.category,
        asset.specificationOrSN,
        asset.assetCode,
        asset.status,
        asset.department,
        asset.purchaseDate,
        asset.cost,
        asset.warrantyExpiry,
        asset.location,
        asset.notes,
        Boolean(asset.isDefective),
        asset.defectiveDetails || null,
        JSON.stringify(asset.custodyHistory || []),
        Boolean(asset.pmsCompleted),
        asset.pmsDate || null,
        asset.pmsHalf || null,
        asset.pmsTechnician || null,
        asset.pmsRemarks || null,
        JSON.stringify(asset),
        JSON.stringify(asset)
      ]
    );
  }

  // 2. Onboardings
  for (const item of SEED_ONBOARDINGS) {
    await client.query(
      `INSERT INTO onboardings (
        id, employee_name, department, position, start_date, company,
        control_number, status, date_of_onboarding, device_issued,
        serial_number, remarks, notes, assigned_assets, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_name = EXCLUDED.employee_name,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        start_date = EXCLUDED.start_date,
        company = EXCLUDED.company,
        control_number = EXCLUDED.control_number,
        status = EXCLUDED.status,
        date_of_onboarding = EXCLUDED.date_of_onboarding,
        device_issued = EXCLUDED.device_issued,
        serial_number = EXCLUDED.serial_number,
        remarks = EXCLUDED.remarks,
        notes = EXCLUDED.notes,
        assigned_assets = EXCLUDED.assigned_assets,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        item.id,
        item.employeeName,
        item.department,
        item.position,
        item.startDate,
        item.company,
        item.controlNumber,
        item.status,
        item.dateOfOnboarding,
        (item as any).deviceIssued || (item.assignedAssets?.[0]) || null,
        (item as any).serialNumber || null,
        (item as any).remarks || item.notes || null,
        item.notes || null,
        JSON.stringify(item.assignedAssets || []),
        JSON.stringify(item),
        JSON.stringify(item)
      ]
    );
  }

  // 3. Offboardings
  for (const item of SEED_OFFBOARDINGS) {
    await client.query(
      `INSERT INTO offboardings (
        id, employee_name, department, position, separation_date, company,
        control_number, status, returned_devices, it_clearance_by,
        remarks, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_name = EXCLUDED.employee_name,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        separation_date = EXCLUDED.separation_date,
        company = EXCLUDED.company,
        control_number = EXCLUDED.control_number,
        status = EXCLUDED.status,
        returned_devices = EXCLUDED.returned_devices,
        it_clearance_by = EXCLUDED.it_clearance_by,
        remarks = EXCLUDED.remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        item.id,
        item.employeeName,
        item.department,
        item.position,
        item.separationDate,
        item.company,
        item.controlNumber,
        item.status,
        JSON.stringify((item as any).returnedDevices || item.clearedAssets || []),
        (item as any).itClearanceBy || null,
        (item as any).remarks || item.notes || null,
        JSON.stringify(item),
        JSON.stringify(item)
      ]
    );
  }

  // 4. Requests
  for (const item of SEED_REQUESTS) {
    await client.query(
      `INSERT INTO requests (
        id, date_reported, request_type, reference_no, employee_or_requester_name,
        department_or_branches, actions_taken_or_remarks, date_created, date_resolved,
        days, major_or_minor, status, assigned_technician, estimated_amount,
        raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        date_reported = EXCLUDED.date_reported,
        request_type = EXCLUDED.request_type,
        reference_no = EXCLUDED.reference_no,
        employee_or_requester_name = EXCLUDED.employee_or_requester_name,
        department_or_branches = EXCLUDED.department_or_branches,
        actions_taken_or_remarks = EXCLUDED.actions_taken_or_remarks,
        date_created = EXCLUDED.date_created,
        date_resolved = EXCLUDED.date_resolved,
        days = EXCLUDED.days,
        major_or_minor = EXCLUDED.major_or_minor,
        status = EXCLUDED.status,
        assigned_technician = EXCLUDED.assigned_technician,
        estimated_amount = EXCLUDED.estimated_amount,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        item.id,
        item.dateReported,
        item.requestType,
        item.referenceNo,
        item.employeeOrRequesterName,
        item.departmentOrBranches,
        item.actionsTakenOrRemarks,
        item.dateCreated,
        item.dateResolved || null,
        item.days || 0,
        item.majorOrMinor,
        item.status,
        item.assignedTechnician || null,
        item.estimatedAmount || null,
        JSON.stringify(item),
        JSON.stringify(item)
      ]
    );
  }

  // 5. Borrowings
  for (const item of SEED_BORROWINGS) {
    await client.query(
      `INSERT INTO borrowings (
        id, borrower_name, department, item_category, item_name_or_code,
        asset_code, borrow_date, return_date, actual_return_date,
        status, purpose, remarks, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        borrower_name = EXCLUDED.borrower_name,
        department = EXCLUDED.department,
        item_category = EXCLUDED.item_category,
        item_name_or_code = EXCLUDED.item_name_or_code,
        asset_code = EXCLUDED.asset_code,
        borrow_date = EXCLUDED.borrow_date,
        return_date = EXCLUDED.return_date,
        actual_return_date = EXCLUDED.actual_return_date,
        status = EXCLUDED.status,
        purpose = EXCLUDED.purpose,
        remarks = EXCLUDED.remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        item.id,
        item.borrowerName,
        item.department,
        item.itemCategory,
        (item as any).itemNameOrCode || item.itemCategory,
        item.assetCode || null,
        item.borrowDate,
        item.returnDate,
        item.actualReturnDate || null,
        item.status,
        (item as any).purpose || null,
        item.remarks || null,
        JSON.stringify(item),
        JSON.stringify(item)
      ]
    );
  }

  // 6. Preventive Maintenance
  for (const item of SEED_PREVENTIVE_MAINTENANCE) {
    await client.query(
      `INSERT INTO preventive_maintenance (
        id, description, date, date_purchase, asset_code,
        activity_work_done, performed_by, status, recommendation,
        department, next_maintenance_date, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        date_purchase = EXCLUDED.date_purchase,
        asset_code = EXCLUDED.asset_code,
        activity_work_done = EXCLUDED.activity_work_done,
        performed_by = EXCLUDED.performed_by,
        status = EXCLUDED.status,
        recommendation = EXCLUDED.recommendation,
        department = EXCLUDED.department,
        next_maintenance_date = EXCLUDED.next_maintenance_date,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        item.id,
        item.description,
        item.date,
        item.datePurchase,
        item.assetCode,
        item.activityWorkDone,
        item.performedBy,
        item.status,
        item.recommendation,
        item.department,
        item.nextMaintenanceDate || null,
        JSON.stringify(item),
        JSON.stringify(item)
      ]
    );
  }

  // 7. Liabilities
  for (const item of SEED_LIABILITIES) {
    await client.query(
      `INSERT INTO liabilities (
        id, qty, uom, item_description, date_issued,
        employee_name, department, asset_code, company,
        status, remarks, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        qty = EXCLUDED.qty,
        uom = EXCLUDED.uom,
        item_description = EXCLUDED.item_description,
        date_issued = EXCLUDED.date_issued,
        employee_name = EXCLUDED.employee_name,
        department = EXCLUDED.department,
        asset_code = EXCLUDED.asset_code,
        company = EXCLUDED.company,
        status = EXCLUDED.status,
        remarks = EXCLUDED.remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW()`,
      [
        item.id,
        item.qty || 1,
        item.uom || 'UNIT',
        item.itemDescription,
        item.dateIssued,
        item.employeeName,
        item.department,
        item.assetCode,
        item.company,
        item.status,
        item.remarks || null,
        JSON.stringify(item),
        JSON.stringify(item)
      ]
    );
  }

  // 8. Activity Logs
  for (const item of SEED_ACTIVITY_LOGS) {
    await client.query(
      `INSERT INTO activity_logs (id, timestamp, actor, action, target_entity, target_id, details, data, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       ON CONFLICT (id) DO NOTHING`,
      [
        item.id,
        item.timestamp,
        item.actor,
        item.action,
        item.targetEntity,
        item.targetId,
        item.details,
        JSON.stringify(item)
      ]
    );
  }

  // 9. Settings
  await client.query(
    `INSERT INTO settings (id, data, updated_at) VALUES ($1, $2, NOW()) 
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    ['global', JSON.stringify(INITIAL_SETTINGS)]
  );

  // 10. Dropdowns
  await client.query(
    `INSERT INTO dropdown_options (id, data, updated_at) VALUES ($1, $2, NOW()) 
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    ['global', JSON.stringify(DEFAULT_DROPDOWN_OPTIONS)]
  );

  // 11. KPI 2026
  await client.query(
    `INSERT INTO kpi_records (id, data, updated_at) VALUES ($1, $2, NOW()) 
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    ['2026', JSON.stringify(SEED_KPI_2026)]
  );

  console.log('[Supabase] Enterprise seed completed.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Initialize DB tables
  await initDatabase();

  // Status & Health Endpoint
  app.get('/api/status', async (_req: Request, res: Response) => {
    try {
      const [
        assetsCount,
        onboardingsCount,
        requestsCount,
        borrowingsCount,
        pmCount,
        liabilitiesCount
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as c FROM assets;'),
        pool.query('SELECT COUNT(*) as c FROM onboardings;'),
        pool.query('SELECT COUNT(*) as c FROM requests;'),
        pool.query('SELECT COUNT(*) as c FROM borrowings;'),
        pool.query('SELECT COUNT(*) as c FROM preventive_maintenance;'),
        pool.query('SELECT COUNT(*) as c FROM liabilities;')
      ]);

      const parsedHost = RAW_DATABASE_URL.match(/@([^:/]+)/)?.[1] || 'db.byasmykumlpzrldseest.supabase.co';
      res.json({
        success: true,
        database: 'Supabase PostgreSQL (Main Database)',
        host: parsedHost,
        directHost: 'db.byasmykumlpzrldseest.supabase.co:5432',
        counts: {
          assets: parseInt(assetsCount.rows[0].c, 10),
          onboardings: parseInt(onboardingsCount.rows[0].c, 10),
          requests: parseInt(requestsCount.rows[0].c, 10),
          borrowings: parseInt(borrowingsCount.rows[0].c, 10),
          preventiveMaintenance: parseInt(pmCount.rows[0].c, 10),
          liabilities: parseInt(liabilitiesCount.rows[0].c, 10),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Helper mapping functions to merge explicit SQL columns with JSONB data
  function mapAssetRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      employeeOrDeviceName: row.employee_or_device_name ?? base.employeeOrDeviceName ?? '',
      category: row.category ?? base.category ?? '',
      specificationOrSN: row.specification_or_sn ?? base.specificationOrSN ?? '',
      assetCode: row.asset_code ?? base.assetCode ?? '',
      status: row.status ?? base.status ?? 'In Use',
      department: row.department ?? base.department ?? '',
      purchaseDate: row.purchase_date ?? base.purchaseDate ?? '',
      cost: row.cost !== null && row.cost !== undefined ? Number(row.cost) : (base.cost || 0),
      warrantyExpiry: row.warranty_expiry ?? base.warrantyExpiry ?? '',
      location: row.location ?? base.location ?? '',
      notes: row.notes ?? base.notes ?? '',
      isDefective: row.is_defective ?? base.isDefective ?? false,
      defectiveDetails: row.defective_details ?? base.defectiveDetails ?? '',
      repairVendor: row.repair_vendor ?? base.repairVendor ?? '',
      rmaNumber: row.rma_number ?? base.rmaNumber ?? '',
      condition: row.condition ?? base.condition ?? 'Good',
      supplier: row.supplier ?? base.supplier ?? '',
      company: row.company ?? base.company ?? '',
      lastPmDate: row.last_pm_date ?? base.lastPmDate ?? '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapOnboardingRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      employeeName: row.employee_name ?? base.employeeName ?? '',
      department: row.department ?? base.department ?? '',
      position: row.position ?? base.position ?? '',
      startDate: row.start_date ?? base.startDate ?? '',
      company: row.company ?? base.company ?? '',
      controlNumber: row.control_number ?? base.controlNumber ?? '',
      status: row.status ?? base.status ?? 'Pending',
      dateOfOnboarding: row.date_of_onboarding ?? base.dateOfOnboarding ?? '',
      assignedAssets: row.assigned_assets ? (Array.isArray(row.assigned_assets) ? row.assigned_assets : JSON.parse(row.assigned_assets)) : (base.assignedAssets || []),
      notes: row.notes ?? base.notes ?? '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapOffboardingRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      employeeName: row.employee_name ?? base.employeeName ?? '',
      department: row.department ?? base.department ?? '',
      position: row.position ?? base.position ?? '',
      separationDate: row.separation_date ?? base.separationDate ?? '',
      company: row.company ?? base.company ?? '',
      controlNumber: row.control_number ?? base.controlNumber ?? '',
      status: row.status ?? base.status ?? 'Pending Surrender',
      returnedDevices: row.returned_devices ? (Array.isArray(row.returned_devices) ? row.returned_devices : JSON.parse(row.returned_devices)) : (base.returnedDevices || []),
      clearedAssets: row.returned_devices ? (Array.isArray(row.returned_devices) ? row.returned_devices : JSON.parse(row.returned_devices)) : (base.clearedAssets || []),
      itClearanceSignOff: !!row.it_clearance_by || !!base.itClearanceSignOff,
      notes: row.remarks ?? base.notes ?? '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapRequestRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      dateReported: row.date_reported ?? base.dateReported ?? '',
      requestType: row.request_type ?? base.requestType ?? 'PR',
      referenceNo: row.reference_no ?? base.referenceNo ?? '',
      employeeOrRequesterName: row.employee_or_requester_name ?? base.employeeOrRequesterName ?? '',
      departmentOrBranches: row.department_or_branches ?? base.departmentOrBranches ?? '',
      actionsTakenOrRemarks: row.actions_taken_or_remarks ?? base.actionsTakenOrRemarks ?? '',
      dateCreated: row.date_created ?? base.dateCreated ?? '',
      dateResolved: row.date_resolved ?? base.dateResolved ?? '',
      days: row.days !== null && row.days !== undefined ? Number(row.days) : (base.days || 0),
      majorOrMinor: row.major_or_minor ?? base.majorOrMinor ?? 'Minor',
      status: row.status ?? base.status ?? 'Pending',
      assignedTechnician: row.assigned_technician ?? base.assignedTechnician ?? '',
      estimatedAmount: row.estimated_amount !== null && row.estimated_amount !== undefined ? Number(row.estimated_amount) : (base.estimatedAmount || 0),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapBorrowingRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      borrowerName: row.borrower_name ?? base.borrowerName ?? '',
      department: row.department ?? base.department ?? '',
      itemCategory: row.item_category ?? base.itemCategory ?? '',
      itemNameOrCode: row.item_name_or_code ?? base.itemNameOrCode ?? row.item_category ?? '',
      assetCode: row.asset_code ?? base.assetCode ?? '',
      borrowDate: row.borrow_date ?? base.borrowDate ?? '',
      returnDate: row.return_date ?? base.returnDate ?? '',
      actualReturnDate: row.actual_return_date ?? base.actualReturnDate ?? '',
      status: row.status ?? base.status ?? 'Active / Borrowed',
      purpose: row.purpose ?? base.purpose ?? '',
      remarks: row.remarks ?? base.remarks ?? '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapPMRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      description: row.description ?? base.description ?? '',
      date: row.date ?? base.date ?? '',
      datePurchase: row.date_purchase ?? base.datePurchase ?? '',
      assetCode: row.asset_code ?? base.assetCode ?? '',
      activityWorkDone: row.activity_work_done ?? base.activityWorkDone ?? '',
      performedBy: row.performed_by ?? base.performedBy ?? '',
      status: row.status ?? base.status ?? 'Scheduled',
      recommendation: row.recommendation ?? base.recommendation ?? '',
      department: row.department ?? base.department ?? '',
      nextMaintenanceDate: row.next_maintenance_date ?? base.nextMaintenanceDate ?? '',
      cost: row.cost !== null && row.cost !== undefined ? Number(row.cost) : (base.cost || 0),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapLiabilityRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      qty: row.qty !== null && row.qty !== undefined ? Number(row.qty) : (base.qty || 1),
      uom: row.uom ?? base.uom ?? 'Unit',
      itemDescription: row.item_description ?? base.itemDescription ?? '',
      dateIssued: row.date_issued ?? base.dateIssued ?? '',
      employeeName: row.employee_name ?? base.employeeName ?? '',
      department: row.department ?? base.department ?? '',
      assetCode: row.asset_code ?? base.assetCode ?? '',
      company: row.company ?? base.company ?? '',
      status: row.status ?? base.status ?? 'Active Accountability',
      remarks: row.remarks ?? base.remarks ?? '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (base.updatedAt || new Date().toISOString())
    };
  }

  function mapActivityLogRow(row: any) {
    const base = row.data || {};
    return {
      ...base,
      id: row.id || base.id,
      timestamp: row.timestamp ?? base.timestamp ?? (row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()),
      actor: row.actor ?? base.actor ?? 'System',
      action: row.action ?? base.action ?? '',
      targetEntity: row.target_entity ?? base.targetEntity ?? '',
      targetId: row.target_id ?? base.targetId ?? '',
      details: row.details ?? base.details ?? '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : (base.createdAt || new Date().toISOString())
    };
  }

  // Pull All Data in one round-trip for blazing fast instant UI initialization
  app.get('/api/all-data', async (_req: Request, res: Response) => {
    try {
      const [
        assetsRes,
        onboardingsRes,
        offboardingsRes,
        requestsRes,
        borrowingsRes,
        pmRes,
        liabilitiesRes,
        activityLogsRes,
        settingsRes,
        dropdownsRes,
        kpiRes
      ] = await Promise.all([
        pool.query('SELECT * FROM assets ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM onboardings ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM offboardings ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM requests ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM borrowings ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM preventive_maintenance ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM liabilities ORDER BY updated_at DESC'),
        pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500'),
        pool.query("SELECT data FROM settings WHERE id = 'global'"),
        pool.query("SELECT data FROM dropdown_options WHERE id = 'global'"),
        pool.query("SELECT data FROM kpi_records WHERE id = '2026'")
      ]);

      res.json({
        success: true,
        assets: assetsRes.rows.map(mapAssetRow),
        onboardings: onboardingsRes.rows.map(mapOnboardingRow),
        offboardings: offboardingsRes.rows.map(mapOffboardingRow),
        requests: requestsRes.rows.map(mapRequestRow),
        borrowings: borrowingsRes.rows.map(mapBorrowingRow),
        preventiveMaintenance: pmRes.rows.map(mapPMRow),
        liabilities: liabilitiesRes.rows.map(mapLiabilityRow),
        activityLogs: activityLogsRes.rows.map(mapActivityLogRow),
        settings: settingsRes.rows[0]?.data || INITIAL_SETTINGS,
        dropdownOptions: dropdownsRes.rows[0]?.data || DEFAULT_DROPDOWN_OPTIONS,
        kpi2026: kpiRes.rows[0]?.data || SEED_KPI_2026,
      });
    } catch (err: any) {
      console.error('[API all-data Error]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD ASSETS (Full SQL Columns + JSONB)
  // ==========================================
  async function upsertAsset(asset: any) {
    const q = `
      INSERT INTO assets (
        id, employee_or_device_name, category, specification_or_sn, asset_code,
        status, department, purchase_date, cost, warranty_expiry, location,
        notes, is_defective, defective_details, repair_vendor, rma_number,
        custody_history, pms_completed, pms_date, pms_half, pms_technician, pms_remarks,
        raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22,
        $23, $24, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_or_device_name = EXCLUDED.employee_or_device_name,
        category = EXCLUDED.category,
        specification_or_sn = EXCLUDED.specification_or_sn,
        asset_code = EXCLUDED.asset_code,
        status = EXCLUDED.status,
        department = EXCLUDED.department,
        purchase_date = EXCLUDED.purchase_date,
        cost = EXCLUDED.cost,
        warranty_expiry = EXCLUDED.warranty_expiry,
        location = EXCLUDED.location,
        notes = EXCLUDED.notes,
        is_defective = EXCLUDED.is_defective,
        defective_details = EXCLUDED.defective_details,
        repair_vendor = EXCLUDED.repair_vendor,
        rma_number = EXCLUDED.rma_number,
        custody_history = EXCLUDED.custody_history,
        pms_completed = EXCLUDED.pms_completed,
        pms_date = EXCLUDED.pms_date,
        pms_half = EXCLUDED.pms_half,
        pms_technician = EXCLUDED.pms_technician,
        pms_remarks = EXCLUDED.pms_remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      asset.id,
      asset.employeeOrDeviceName || null,
      asset.category || 'Laptop',
      asset.specificationOrSN || null,
      asset.assetCode || null,
      asset.status || 'Available',
      asset.department || null,
      asset.purchaseDate || null,
      asset.cost !== undefined && asset.cost !== null && !isNaN(Number(asset.cost)) ? Number(asset.cost) : null,
      asset.warrantyExpiry || null,
      asset.location || null,
      asset.notes || null,
      Boolean(asset.isDefective),
      asset.defectiveDetails || null,
      asset.repairVendor || null,
      asset.rmaNumber || null,
      JSON.stringify(asset.custodyHistory || []),
      Boolean(asset.pmsCompleted),
      asset.pmsDate || null,
      asset.pmsHalf || null,
      asset.pmsTechnician || null,
      asset.pmsRemarks || null,
      JSON.stringify(asset),
      JSON.stringify(asset)
    ]);
  }

  app.post('/api/assets', async (req: Request, res: Response) => {
    try {
      const asset = req.body;
      await upsertAsset(asset);
      console.log(`[Supabase Write] Asset saved: ${asset.id} (${asset.assetCode})`);
      res.json({ success: true, asset });
    } catch (err: any) {
      console.error('[Supabase Save Error - Assets]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/assets/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const asset = { ...req.body, id };
      await upsertAsset(asset);
      console.log(`[Supabase Update] Asset updated: ${id} (${asset.assetCode})`);
      res.json({ success: true, asset });
    } catch (err: any) {
      console.error('[Supabase Update Error - Assets]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/assets/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM assets WHERE id = $1', [id]);
      console.log(`[Supabase Delete] Asset removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD ONBOARDINGS
  // ==========================================
  async function upsertOnboarding(item: any) {
    const q = `
      INSERT INTO onboardings (
        id, employee_name, department, position, start_date, company,
        control_number, status, date_of_onboarding, device_issued,
        serial_number, remarks, notes, assigned_assets, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_name = EXCLUDED.employee_name,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        start_date = EXCLUDED.start_date,
        company = EXCLUDED.company,
        control_number = EXCLUDED.control_number,
        status = EXCLUDED.status,
        date_of_onboarding = EXCLUDED.date_of_onboarding,
        device_issued = EXCLUDED.device_issued,
        serial_number = EXCLUDED.serial_number,
        remarks = EXCLUDED.remarks,
        notes = EXCLUDED.notes,
        assigned_assets = EXCLUDED.assigned_assets,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      item.id,
      item.employeeName || null,
      item.department || null,
      item.position || null,
      item.startDate || null,
      item.company || null,
      item.controlNumber || null,
      item.status || 'Pending',
      item.dateOfOnboarding || null,
      item.deviceIssued || null,
      item.serialNumber || null,
      item.remarks || null,
      item.notes || null,
      JSON.stringify(item.assignedAssets || []),
      JSON.stringify(item),
      JSON.stringify(item)
    ]);
  }

  app.post('/api/onboardings', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await upsertOnboarding(item);
      console.log(`[Supabase Write] Onboarding saved: ${item.id} (${item.employeeName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Save Error - Onboardings]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/onboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = { ...req.body, id };
      await upsertOnboarding(item);
      console.log(`[Supabase Update] Onboarding updated: ${id} (${item.employeeName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Update Error - Onboardings]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/onboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM onboardings WHERE id = $1', [id]);
      console.log(`[Supabase Delete] Onboarding removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD OFFBOARDINGS
  // ==========================================
  async function upsertOffboarding(item: any) {
    const q = `
      INSERT INTO offboardings (
        id, employee_name, department, position, separation_date, company,
        control_number, status, returned_devices, it_clearance_by,
        remarks, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        employee_name = EXCLUDED.employee_name,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        separation_date = EXCLUDED.separation_date,
        company = EXCLUDED.company,
        control_number = EXCLUDED.control_number,
        status = EXCLUDED.status,
        returned_devices = EXCLUDED.returned_devices,
        it_clearance_by = EXCLUDED.it_clearance_by,
        remarks = EXCLUDED.remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      item.id,
      item.employeeName || null,
      item.department || null,
      item.position || null,
      item.separationDate || null,
      item.company || null,
      item.controlNumber || null,
      item.status || 'Pending',
      JSON.stringify(item.returnedDevices || []),
      item.itClearanceBy || null,
      item.remarks || null,
      JSON.stringify(item),
      JSON.stringify(item)
    ]);
  }

  app.post('/api/offboardings', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await upsertOffboarding(item);
      console.log(`[Supabase Write] Offboarding saved: ${item.id} (${item.employeeName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Save Error - Offboardings]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/offboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = { ...req.body, id };
      await upsertOffboarding(item);
      console.log(`[Supabase Update] Offboarding updated: ${id} (${item.employeeName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Update Error - Offboardings]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/offboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM offboardings WHERE id = $1', [id]);
      console.log(`[Supabase Delete] Offboarding removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD REQUESTS
  // ==========================================
  async function upsertRequest(item: any) {
    const q = `
      INSERT INTO requests (
        id, date_reported, request_type, reference_no, employee_or_requester_name,
        department_or_branches, actions_taken_or_remarks, date_created, date_resolved,
        days, major_or_minor, status, assigned_technician, estimated_amount,
        raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        date_reported = EXCLUDED.date_reported,
        request_type = EXCLUDED.request_type,
        reference_no = EXCLUDED.reference_no,
        employee_or_requester_name = EXCLUDED.employee_or_requester_name,
        department_or_branches = EXCLUDED.department_or_branches,
        actions_taken_or_remarks = EXCLUDED.actions_taken_or_remarks,
        date_created = EXCLUDED.date_created,
        date_resolved = EXCLUDED.date_resolved,
        days = EXCLUDED.days,
        major_or_minor = EXCLUDED.major_or_minor,
        status = EXCLUDED.status,
        assigned_technician = EXCLUDED.assigned_technician,
        estimated_amount = EXCLUDED.estimated_amount,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      item.id,
      item.dateReported || null,
      item.requestType || 'PR',
      item.referenceNo || null,
      item.employeeOrRequesterName || null,
      item.departmentOrBranches || null,
      item.actionsTakenOrRemarks || null,
      item.dateCreated || null,
      item.dateResolved || null,
      item.days !== undefined && item.days !== null && !isNaN(Number(item.days)) ? Number(item.days) : null,
      item.majorOrMinor || 'Minor',
      item.status || 'Pending',
      item.assignedTechnician || null,
      item.estimatedAmount !== undefined && item.estimatedAmount !== null && !isNaN(Number(item.estimatedAmount)) ? Number(item.estimatedAmount) : null,
      JSON.stringify(item),
      JSON.stringify(item)
    ]);
  }

  app.post('/api/requests', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await upsertRequest(item);
      console.log(`[Supabase Write] Request ticket saved: ${item.id} (${item.referenceNo})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Save Error - Requests]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/requests/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = { ...req.body, id };
      await upsertRequest(item);
      console.log(`[Supabase Update] Request ticket updated: ${id} (${item.referenceNo})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Update Error - Requests]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/requests/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM requests WHERE id = $1', [id]);
      console.log(`[Supabase Delete] Request ticket removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD BORROWINGS
  // ==========================================
  async function upsertBorrowing(item: any) {
    const q = `
      INSERT INTO borrowings (
        id, borrower_name, department, item_category, item_name_or_code,
        asset_code, borrow_date, return_date, actual_return_date,
        status, purpose, remarks, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        borrower_name = EXCLUDED.borrower_name,
        department = EXCLUDED.department,
        item_category = EXCLUDED.item_category,
        item_name_or_code = EXCLUDED.item_name_or_code,
        asset_code = EXCLUDED.asset_code,
        borrow_date = EXCLUDED.borrow_date,
        return_date = EXCLUDED.return_date,
        actual_return_date = EXCLUDED.actual_return_date,
        status = EXCLUDED.status,
        purpose = EXCLUDED.purpose,
        remarks = EXCLUDED.remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      item.id,
      item.borrowerName || null,
      item.department || null,
      item.itemCategory || null,
      item.itemNameOrCode || item.itemCategory || null,
      item.assetCode || null,
      item.borrowDate || null,
      item.returnDate || null,
      item.actualReturnDate || null,
      item.status || 'Active / Borrowed',
      item.purpose || null,
      item.remarks || null,
      JSON.stringify(item),
      JSON.stringify(item)
    ]);
  }

  app.post('/api/borrowings', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await upsertBorrowing(item);
      console.log(`[Supabase Write] Borrowing saved: ${item.id} (${item.borrowerName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Save Error - Borrowings]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/borrowings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = { ...req.body, id };
      await upsertBorrowing(item);
      console.log(`[Supabase Update] Borrowing updated: ${id} (${item.borrowerName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Update Error - Borrowings]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/borrowings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM borrowings WHERE id = $1', [id]);
      console.log(`[Supabase Delete] Borrowing removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD PREVENTIVE MAINTENANCE
  // ==========================================
  async function upsertPM(item: any) {
    const q = `
      INSERT INTO preventive_maintenance (
        id, description, date, date_purchase, asset_code,
        activity_work_done, performed_by, status, recommendation,
        department, next_maintenance_date, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        date_purchase = EXCLUDED.date_purchase,
        asset_code = EXCLUDED.asset_code,
        activity_work_done = EXCLUDED.activity_work_done,
        performed_by = EXCLUDED.performed_by,
        status = EXCLUDED.status,
        recommendation = EXCLUDED.recommendation,
        department = EXCLUDED.department,
        next_maintenance_date = EXCLUDED.next_maintenance_date,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      item.id,
      item.description || null,
      item.date || null,
      item.datePurchase || null,
      item.assetCode || null,
      item.activityWorkDone || null,
      item.performedBy || null,
      item.status || 'Completed',
      item.recommendation || null,
      item.department || null,
      item.nextMaintenanceDate || null,
      JSON.stringify(item),
      JSON.stringify(item)
    ]);
  }

  app.post('/api/preventive-maintenance', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await upsertPM(item);
      console.log(`[Supabase Write] PM saved: ${item.id} (${item.assetCode})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Save Error - PM]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/preventive-maintenance/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = { ...req.body, id };
      await upsertPM(item);
      console.log(`[Supabase Update] PM updated: ${id} (${item.assetCode})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Update Error - PM]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/preventive-maintenance/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM preventive_maintenance WHERE id = $1', [id]);
      console.log(`[Supabase Delete] PM removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRUD LIABILITIES
  // ==========================================
  async function upsertLiability(item: any) {
    const q = `
      INSERT INTO liabilities (
        id, qty, uom, item_description, date_issued,
        employee_name, department, asset_code, company,
        status, remarks, raw_data, data, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        qty = EXCLUDED.qty,
        uom = EXCLUDED.uom,
        item_description = EXCLUDED.item_description,
        date_issued = EXCLUDED.date_issued,
        employee_name = EXCLUDED.employee_name,
        department = EXCLUDED.department,
        asset_code = EXCLUDED.asset_code,
        company = EXCLUDED.company,
        status = EXCLUDED.status,
        remarks = EXCLUDED.remarks,
        raw_data = EXCLUDED.raw_data,
        data = EXCLUDED.data,
        updated_at = NOW();
    `;
    await pool.query(q, [
      item.id,
      item.qty !== undefined && item.qty !== null && !isNaN(Number(item.qty)) ? Number(item.qty) : 1,
      item.uom || 'UNIT',
      item.itemDescription || null,
      item.dateIssued || null,
      item.employeeName || null,
      item.department || null,
      item.assetCode || null,
      item.company || null,
      item.status || 'Active Liability',
      item.remarks || null,
      JSON.stringify(item),
      JSON.stringify(item)
    ]);
  }

  app.post('/api/liabilities', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await upsertLiability(item);
      console.log(`[Supabase Write] Liability saved: ${item.id} (${item.employeeName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Save Error - Liabilities]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/liabilities/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = { ...req.body, id };
      await upsertLiability(item);
      console.log(`[Supabase Update] Liability updated: ${id} (${item.employeeName})`);
      res.json({ success: true, item });
    } catch (err: any) {
      console.error('[Supabase Update Error - Liabilities]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/liabilities/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM liabilities WHERE id = $1', [id]);
      console.log(`[Supabase Delete] Liability removed: ${id}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  app.post('/api/activity-logs', async (req: Request, res: Response) => {
    try {
      const log = req.body;
      await pool.query(
        `INSERT INTO activity_logs (id, timestamp, actor, action, target_entity, target_id, details, data, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
         ON CONFLICT (id) DO NOTHING`,
        [
          log.id,
          log.timestamp || new Date().toISOString(),
          log.actor || 'System',
          log.action || 'ACTIVITY',
          log.targetEntity || 'System',
          log.targetId || 'system',
          log.details || '',
          JSON.stringify(log)
        ]
      );
      res.json({ success: true, log });
    } catch (err: any) {
      console.error('[Supabase Save Error - ActivityLogs]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Settings
  app.post('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      await pool.query(
        `INSERT INTO settings (id, data, updated_at) VALUES ('global', $1, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(settings)]
      );
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dropdown Options
  app.post('/api/dropdown-options', async (req: Request, res: Response) => {
    try {
      const options = req.body;
      await pool.query(
        `INSERT INTO dropdown_options (id, data, updated_at) VALUES ('global', $1, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(options)]
      );
      res.json({ success: true, options });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // KPI 2026
  app.post('/api/kpi-2026', async (req: Request, res: Response) => {
    try {
      const kpi = req.body;
      await pool.query(
        `INSERT INTO kpi_records (id, data, updated_at) VALUES ('2026', $1, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(kpi)]
      );
      res.json({ success: true, kpi });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clear Data (Password Protected)
  app.post('/api/clear-data', async (req: Request, res: Response) => {
    try {
      const { password, scope } = req.body;
      if (password !== 'ITAdmin@2026') {
        return res.status(403).json({ success: false, message: 'Invalid IT Admin Master Password.' });
      }

      if (scope === 'all') {
        await pool.query('DELETE FROM assets;');
        await pool.query('DELETE FROM onboardings;');
        await pool.query('DELETE FROM offboardings;');
        await pool.query('DELETE FROM requests;');
        await pool.query('DELETE FROM borrowings;');
        await pool.query('DELETE FROM preventive_maintenance;');
        await pool.query('DELETE FROM liabilities;');
        await pool.query('DELETE FROM activity_logs;');
        return res.json({ success: true, message: 'All Supabase tables cleared.' });
      } else if (scope === 'assets') {
        await pool.query('DELETE FROM assets;');
        return res.json({ success: true, message: 'All assets cleared from Supabase.' });
      } else if (scope === 'requests') {
        await pool.query('DELETE FROM requests;');
        return res.json({ success: true, message: 'All requests cleared from Supabase.' });
      } else if (scope === 'borrowings') {
        await pool.query('DELETE FROM borrowings;');
        return res.json({ success: true, message: 'All borrowings cleared from Supabase.' });
      }

      res.status(400).json({ success: false, message: 'Unknown scope.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Re-Seed Database
  app.post('/api/seed', async (_req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        await seedDatabase(client);
        res.json({ success: true, message: 'Supabase re-seeded successfully.' });
      } finally {
        client.release();
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Restore Backup
  app.post('/api/restore-backup', async (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ success: false, message: 'No data provided.' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        if (Array.isArray(data.assets)) {
          await client.query('DELETE FROM assets;');
          for (const a of data.assets) {
            await client.query(
              `INSERT INTO assets (id, asset_code, status, location, department, data, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [a.id, a.assetCode || '', a.status || '', a.location || '', a.department || '', JSON.stringify(a)]
            );
          }
        }

        if (Array.isArray(data.onboardings)) {
          await client.query('DELETE FROM onboardings;');
          for (const o of data.onboardings) {
            await client.query('INSERT INTO onboardings (id, data, updated_at) VALUES ($1, $2, NOW())', [o.id, JSON.stringify(o)]);
          }
        }

        if (Array.isArray(data.offboardings)) {
          await client.query('DELETE FROM offboardings;');
          for (const off of data.offboardings) {
            await client.query('INSERT INTO offboardings (id, data, updated_at) VALUES ($1, $2, NOW())', [off.id, JSON.stringify(off)]);
          }
        }

        if (Array.isArray(data.requests)) {
          await client.query('DELETE FROM requests;');
          for (const r of data.requests) {
            await client.query('INSERT INTO requests (id, data, updated_at) VALUES ($1, $2, NOW())', [r.id, JSON.stringify(r)]);
          }
        }

        if (Array.isArray(data.borrowings)) {
          await client.query('DELETE FROM borrowings;');
          for (const b of data.borrowings) {
            await client.query('INSERT INTO borrowings (id, data, updated_at) VALUES ($1, $2, NOW())', [b.id, JSON.stringify(b)]);
          }
        }

        if (Array.isArray(data.preventiveMaintenance)) {
          await client.query('DELETE FROM preventive_maintenance;');
          for (const pm of data.preventiveMaintenance) {
            await client.query('INSERT INTO preventive_maintenance (id, data, updated_at) VALUES ($1, $2, NOW())', [pm.id, JSON.stringify(pm)]);
          }
        }

        if (Array.isArray(data.liabilities)) {
          await client.query('DELETE FROM liabilities;');
          for (const l of data.liabilities) {
            await client.query('INSERT INTO liabilities (id, data, updated_at) VALUES ($1, $2, NOW())', [l.id, JSON.stringify(l)]);
          }
        }

        if (data.settings) {
          await client.query(
            `INSERT INTO settings (id, data, updated_at) VALUES ('global', $1, NOW()) 
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [JSON.stringify(data.settings)]
          );
        }

        if (data.dropdownOptions) {
          await client.query(
            `INSERT INTO dropdown_options (id, data, updated_at) VALUES ('global', $1, NOW()) 
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [JSON.stringify(data.dropdownOptions)]
          );
        }

        if (data.kpi2026) {
          await client.query(
            `INSERT INTO kpi_records (id, data, updated_at) VALUES ('2026', $1, NOW()) 
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [JSON.stringify(data.kpi2026)]
          );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Backup restored to Supabase successfully.' });
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mount Vite development server middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const parsedHost = RAW_DATABASE_URL.match(/@([^:/]+)/)?.[1] || 'db.byasmykumlpzrldseest.supabase.co';
    console.log(`[Server] ITM Pro Enterprise running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Connected to main Supabase PostgreSQL at ${parsedHost}:5432`);
  });
}

startServer().catch(err => {
  console.error('[Fatal Server Startup Error]:', err);
});
