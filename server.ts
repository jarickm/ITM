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

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.byasmykumlpzrldseest:Coolaire%40502022@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

export const pool = new Pool({
  connectionString: DATABASE_URL,
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

      // Ensure all tables have 'data' column in case they were pre-created with different schemas
      await client.query(`
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE assets ADD COLUMN IF NOT EXISTS raw_data JSONB;
        ALTER TABLE onboardings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE offboardings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE requests ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE preventive_maintenance ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE liabilities ADD COLUMN IF NOT EXISTS data JSONB;
        ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS data JSONB;
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

          -- Synchronize raw_data to data if pre-existing
          BEGIN
            UPDATE assets SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
            UPDATE onboardings SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
            UPDATE offboardings SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
            UPDATE requests SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
            UPDATE borrowings SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
            UPDATE preventive_maintenance SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
            UPDATE liabilities SET data = raw_data WHERE data IS NULL AND raw_data IS NOT NULL;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END $$;
      `);

      console.log('[Supabase] All PostgreSQL tables and columns verified/created successfully.');

      // Check if tables need initial seeding
      const countRes = await client.query('SELECT COUNT(*) FROM assets WHERE data IS NOT NULL;');
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
      `INSERT INTO assets (id, asset_code, status, location, department, data, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [asset.id, asset.assetCode, asset.status, asset.location, asset.department, JSON.stringify(asset)]
    );
  }

  // 2. Onboardings
  for (const item of SEED_ONBOARDINGS) {
    await client.query(
      `INSERT INTO onboardings (id, data, updated_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, JSON.stringify(item)]
    );
  }

  // 3. Offboardings
  for (const item of SEED_OFFBOARDINGS) {
    await client.query(
      `INSERT INTO offboardings (id, data, updated_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, JSON.stringify(item)]
    );
  }

  // 4. Requests
  for (const item of SEED_REQUESTS) {
    await client.query(
      `INSERT INTO requests (id, data, updated_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, JSON.stringify(item)]
    );
  }

  // 5. Borrowings
  for (const item of SEED_BORROWINGS) {
    await client.query(
      `INSERT INTO borrowings (id, data, updated_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, JSON.stringify(item)]
    );
  }

  // 6. Preventive Maintenance
  for (const item of SEED_PREVENTIVE_MAINTENANCE) {
    await client.query(
      `INSERT INTO preventive_maintenance (id, data, updated_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, JSON.stringify(item)]
    );
  }

  // 7. Liabilities
  for (const item of SEED_LIABILITIES) {
    await client.query(
      `INSERT INTO liabilities (id, data, updated_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, JSON.stringify(item)]
    );
  }

  // 8. Activity Logs
  for (const item of SEED_ACTIVITY_LOGS) {
    await client.query(
      `INSERT INTO activity_logs (id, data, created_at) VALUES ($1, $2, NOW()) 
       ON CONFLICT (id) DO NOTHING`,
      [item.id, JSON.stringify(item)]
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
      const q = await pool.query('SELECT NOW() as now, COUNT(*) as asset_count FROM assets;');
      res.json({
        success: true,
        database: 'Supabase PostgreSQL',
        host: 'aws-0-ap-northeast-1.pooler.supabase.com',
        timestamp: q.rows[0].now,
        assetCount: parseInt(q.rows[0].asset_count, 10),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

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
        pool.query('SELECT data FROM assets ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM onboardings ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM offboardings ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM requests ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM borrowings ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM preventive_maintenance ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM liabilities ORDER BY updated_at DESC'),
        pool.query('SELECT data FROM activity_logs ORDER BY created_at DESC LIMIT 500'),
        pool.query("SELECT data FROM settings WHERE id = 'global'"),
        pool.query("SELECT data FROM dropdown_options WHERE id = 'global'"),
        pool.query("SELECT data FROM kpi_records WHERE id = '2026'")
      ]);

      res.json({
        success: true,
        assets: assetsRes.rows.map(r => r.data),
        onboardings: onboardingsRes.rows.map(r => r.data),
        offboardings: offboardingsRes.rows.map(r => r.data),
        requests: requestsRes.rows.map(r => r.data),
        borrowings: borrowingsRes.rows.map(r => r.data),
        preventiveMaintenance: pmRes.rows.map(r => r.data),
        liabilities: liabilitiesRes.rows.map(r => r.data),
        activityLogs: activityLogsRes.rows.map(r => r.data),
        settings: settingsRes.rows[0]?.data || INITIAL_SETTINGS,
        dropdownOptions: dropdownsRes.rows[0]?.data || DEFAULT_DROPDOWN_OPTIONS,
        kpi2026: kpiRes.rows[0]?.data || SEED_KPI_2026,
      });
    } catch (err: any) {
      console.error('[API all-data Error]:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD Assets
  app.post('/api/assets', async (req: Request, res: Response) => {
    try {
      const asset = req.body;
      await pool.query(
        `INSERT INTO assets (id, asset_code, status, location, department, data, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         ON CONFLICT (id) DO UPDATE SET asset_code = EXCLUDED.asset_code, status = EXCLUDED.status, location = EXCLUDED.location, department = EXCLUDED.department, data = EXCLUDED.data, updated_at = NOW()`,
        [asset.id, asset.assetCode || '', asset.status || 'Available', asset.location || '', asset.department || '', JSON.stringify(asset)]
      );
      res.json({ success: true, asset });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/assets/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const asset = req.body;
      await pool.query(
        `INSERT INTO assets (id, asset_code, status, location, department, data, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         ON CONFLICT (id) DO UPDATE SET asset_code = EXCLUDED.asset_code, status = EXCLUDED.status, location = EXCLUDED.location, department = EXCLUDED.department, data = EXCLUDED.data, updated_at = NOW()`,
        [id, asset.assetCode || '', asset.status || 'Available', asset.location || '', asset.department || '', JSON.stringify(asset)]
      );
      res.json({ success: true, asset });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/assets/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM assets WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD Onboardings
  app.post('/api/onboardings', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await pool.query(
        `INSERT INTO onboardings (id, data, updated_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/onboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = req.body;
      await pool.query(
        `UPDATE onboardings SET data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/onboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM onboardings WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD Offboardings
  app.post('/api/offboardings', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await pool.query(
        `INSERT INTO offboardings (id, data, updated_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/offboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = req.body;
      await pool.query(
        `UPDATE offboardings SET data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/offboardings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM offboardings WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD Requests
  app.post('/api/requests', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await pool.query(
        `INSERT INTO requests (id, data, updated_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/requests/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = req.body;
      await pool.query(
        `UPDATE requests SET data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/requests/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM requests WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD Borrowings
  app.post('/api/borrowings', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await pool.query(
        `INSERT INTO borrowings (id, data, updated_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/borrowings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = req.body;
      await pool.query(
        `UPDATE borrowings SET data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/borrowings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM borrowings WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD PM
  app.post('/api/preventive-maintenance', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await pool.query(
        `INSERT INTO preventive_maintenance (id, data, updated_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/preventive-maintenance/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = req.body;
      await pool.query(
        `UPDATE preventive_maintenance SET data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/preventive-maintenance/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM preventive_maintenance WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CRUD Liabilities
  app.post('/api/liabilities', async (req: Request, res: Response) => {
    try {
      const item = req.body;
      await pool.query(
        `INSERT INTO liabilities (id, data, updated_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [item.id, JSON.stringify(item)]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/liabilities/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = req.body;
      await pool.query(
        `UPDATE liabilities SET data = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(item), id]
      );
      res.json({ success: true, item });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/liabilities/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM liabilities WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Activity Logs
  app.post('/api/activity-logs', async (req: Request, res: Response) => {
    try {
      const log = req.body;
      await pool.query(
        `INSERT INTO activity_logs (id, data, created_at) VALUES ($1, $2, NOW()) 
         ON CONFLICT (id) DO NOTHING`,
        [log.id, JSON.stringify(log)]
      );
      res.json({ success: true, log });
    } catch (err: any) {
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
    console.log(`[Server] ITM Pro Enterprise running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Connected to Supabase PostgreSQL at aws-0-ap-northeast-1.pooler.supabase.com:5432`);
  });
}

startServer().catch(err => {
  console.error('[Fatal Server Startup Error]:', err);
});
