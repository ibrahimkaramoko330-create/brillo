import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("wash.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-wash-key";

// --- Database Migration ---
const migrate = () => {
  // Migration for services table
  const servicesInfo = db.prepare("PRAGMA table_info(services)").all() as any[];
  const hasServiceVehicleTypeId = servicesInfo.some(col => col.name === 'vehicle_type_id');
  
  if (!hasServiceVehicleTypeId) {
    console.log("Migrating services table: adding vehicle_type_id...");
    try {
      db.exec("ALTER TABLE services ADD COLUMN vehicle_type_id TEXT");
    } catch (err) {
      console.error("Migration failed for services:", err);
    }
  }

  // Migration for transactions table
  const transactionsInfo = db.prepare("PRAGMA table_info(transactions)").all() as any[];
  const hasTransactionTenantId = transactionsInfo.some(col => col.name === 'tenant_id');
  const hasTransactionBrand = transactionsInfo.some(col => col.name === 'brand');
  
  if (!hasTransactionTenantId) {
    console.log("Migrating transactions table: adding tenant_id...");
    try {
      db.exec("ALTER TABLE transactions ADD COLUMN tenant_id TEXT");
    } catch (err) {
      console.error("Migration failed for transactions (tenant_id):", err);
    }
  }

  if (!hasTransactionBrand) {
    console.log("Migrating transactions table: adding brand...");
    try {
      db.exec("ALTER TABLE transactions ADD COLUMN brand TEXT");
    } catch (err) {
      console.error("Migration failed for transactions (brand):", err);
    }
  }

  // Migration for active column in multiple tables
  const tablesToUpdate = ['tenants', 'users', 'services'];
  for (const table of tablesToUpdate) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    if (!info.some(col => col.name === 'active')) {
      console.log(`Migrating ${table} table: adding active column...`);
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN active INTEGER DEFAULT 1`);
      } catch (err) {
        console.error(`Migration failed for ${table}:`, err);
      }
    }
  }

  // Migration for users table: first_name, last_name, phone
  const usersInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const userCols = ['first_name', 'last_name', 'phone'];
  for (const col of userCols) {
    if (!usersInfo.some(c => c.name === col)) {
      console.log(`Migrating users table: adding ${col}...`);
      try {
        db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT`);
      } catch (err) {
        console.error(`Migration failed for users (${col}):`, err);
      }
    }
  }

  // Migration for tenants table: brands_enabled, expenses_enabled
  const tenantsInfo = db.prepare("PRAGMA table_info(tenants)").all() as any[];
  if (!tenantsInfo.some(col => col.name === 'brands_enabled')) {
    console.log("Migrating tenants table: adding brands_enabled...");
    try {
      db.exec("ALTER TABLE tenants ADD COLUMN brands_enabled INTEGER DEFAULT 1");
    } catch (err) {
      console.error("Migration failed for tenants (brands_enabled):", err);
    }
  }
  if (!tenantsInfo.some(col => col.name === 'expenses_enabled')) {
    console.log("Migrating tenants table: adding expenses_enabled...");
    try {
      db.exec("ALTER TABLE tenants ADD COLUMN expenses_enabled INTEGER DEFAULT 1");
    } catch (err) {
      console.error("Migration failed for tenants (expenses_enabled):", err);
    }
  }
  // Migration for expenses table
  const expensesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'").get();
  if (!expensesTable) {
    console.log("Creating expenses table...");
    db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        cashier_id TEXT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (cashier_id) REFERENCES users(id)
     )
    `);
  } else {
    const expensesInfo = db.prepare("PRAGMA table_info(expenses)").all() as any[];
    if (!expensesInfo.some(col => col.name === 'cashier_id')) {
      console.log("Migrating expenses table: adding cashier_id...");
      try {
        db.exec("ALTER TABLE expenses ADD COLUMN cashier_id TEXT");
      } catch (err) {
        console.error("Migration failed for expenses (cashier_id):", err);
      }
    }
  }
};
migrate();

// --- Database Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    brands_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicle_types (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    label TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS vehicle_brands (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    username TEXT NOT NULL UNIQUE,
    password TEXT, -- Nullable for washers
    role TEXT NOT NULL, -- 'super_manager', 'manager', 'cashier', 'washer'
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    label TEXT NOT NULL,
    vehicle_type_id TEXT NOT NULL,
    price INTEGER NOT NULL,
    active INTEGER DEFAULT 1,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    cashier_id TEXT NOT NULL,
    washer_id TEXT NOT NULL,
    matricule TEXT NOT NULL,
    brand TEXT,
    phone TEXT,
    vehicle_type TEXT NOT NULL,
    service_label TEXT NOT NULL,
    price INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (washer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    cashier_id TEXT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id)
  );
`);

// --- Seed Super Manager ---
const seedSuperManager = () => {
  const superManager = db.prepare("SELECT * FROM users WHERE role = 'super_manager'").get();
  if (!superManager) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)")
      .run("super-admin-id", "admin", hashedPassword, "super_manager");
    console.log("Super Manager created: admin / admin123");
  }
};
seedSuperManager();

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // --- Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`[Login Attempt] Username: ${username}`);
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (!user) {
      console.log(`[Login Failed] User not found: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      console.log(`[Login Failed] User has no password set: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log(`[Login Failed] Invalid password for user: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.active === 0) {
      console.log(`[Login Failed] Account deactivated: ${username}`);
      return res.status(403).json({ error: "Account is deactivated" });
    }
    // Check if tenant is active
    if (user.tenant_id) {
      const tenant: any = db.prepare("SELECT active FROM tenants WHERE id = ?").get(user.tenant_id);
      if (tenant && tenant.active === 0) {
        console.log(`[Login Failed] Company deactivated for user: ${username} (Tenant ID: ${user.tenant_id})`);
        return res.status(403).json({ error: "Company is deactivated" });
      }
    }
    console.log(`[Login Success] User: ${username} (Role: ${user.role})`);
    const token = jwt.sign({ id: user.id, tenant_id: user.tenant_id, role: user.role }, JWT_SECRET);
    let tenant_name = "";
    let brands_enabled = 1;
    let expenses_enabled = 1;

    if (user.tenant_id) {
      try {
        // Tentative de récupération avec toutes les colonnes
        const tenant: any = db.prepare("SELECT * FROM tenants WHERE id = ?").get(user.tenant_id);

        if (tenant) {
          tenant_name = tenant.name || "";
          brands_enabled = tenant.brands_enabled !== undefined ? tenant.brands_enabled : 1;
          // Si la colonne existe en base, on prend sa valeur, sinon on met 1 par défaut
          expenses_enabled = tenant.expenses_enabled !== undefined ? tenant.expenses_enabled : 1;
        }
      } catch (error) {
        // Si la colonne n'existe pas encore dans la table, on fait une requête simplifiée
        const tenantFallback: any = db.prepare("SELECT name FROM tenants WHERE id = ?").get(user.tenant_id);
        if (tenantFallback) {
          tenant_name = tenantFallback.name;
        }
        console.warn("Note: La colonne expenses_enabled est manquante dans la table tenants, utilisation de la valeur par défaut (1).");
      }
    }

    res.json({
      token,
      user: {
        id: user.id,
      username: user.username,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant_name,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      brands_enabled,
      expenses_enabled
    } });
  });

  // --- Super Manager Routes (Full CRUD) ---
  app.get("/api/admin/all-data", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const tenants = db.prepare("SELECT * FROM tenants").all();
    const users = db.prepare("SELECT id, tenant_id, username, role FROM users").all();
    const services = db.prepare("SELECT * FROM services").all();
    const transactions = db.prepare("SELECT * FROM transactions").all();
    res.json({ tenants, users, services, transactions });
  });

  app.put("/api/admin/transactions/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    const { matricule, brand, phone, vehicle_type, service_label, price, washer_id } = req.body;
    try {
      db.prepare(`
        UPDATE transactions
        SET matricule = ?, brand = ?, phone = ?, vehicle_type = ?, service_label = ?, price = ?, washer_id = ?
        WHERE id = ?
      `).run(matricule, brand, phone, vehicle_type, service_label, price, washer_id, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/admin/transactions/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  app.delete("/api/admin/tenants/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    db.transaction(() => {
      db.prepare("DELETE FROM transactions WHERE tenant_id = ?").run(req.params.id);
      db.prepare("DELETE FROM services WHERE tenant_id = ?").run(req.params.id);
      db.prepare("DELETE FROM vehicle_types WHERE tenant_id = ?").run(req.params.id);
      db.prepare("DELETE FROM users WHERE tenant_id = ?").run(req.params.id);
      db.prepare("DELETE FROM tenants WHERE id = ?").run(req.params.id);
    })();
    res.json({ success: true });
  });

  app.post("/api/tenants", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { name, managerUsername, managerPassword } = req.body;
    const tenantId = Math.random().toString(36).substr(2, 9);
    const managerId = Math.random().toString(36).substr(2, 9);

    try {
      const createTenant = db.transaction(() => {
        db.prepare("INSERT INTO tenants (id, name) VALUES (?, ?)").run(tenantId, name);
        const hashedPassword = bcrypt.hashSync(managerPassword, 10);
        db.prepare("INSERT INTO users (id, tenant_id, username, password, role) VALUES (?, ?, ?, ?, ?)")
          .run(managerId, tenantId, managerUsername, hashedPassword, "manager");

        const defaultVehicleTypes = [
          { id: Math.random().toString(36).substr(2, 9), label: 'Moto' },
          { id: Math.random().toString(36).substr(2, 9), label: 'Berline' },
          { id: Math.random().toString(36).substr(2, 9), label: 'SUV' }
        ];

        for (const vt of defaultVehicleTypes) {
          db.prepare("INSERT INTO vehicle_types (id, tenant_id, label) VALUES (?, ?, ?)").run(vt.id, tenantId, vt.label);
        }

        const defaultBrands = ['Toyota', 'Mercedes', 'BMW', 'Hyundai', 'Peugeot', 'Renault', 'Volkswagen', 'Honda', 'Nissan', 'Kia'];
        for (const brand of defaultBrands) {
          db.prepare("INSERT INTO vehicle_brands (id, tenant_id, name) VALUES (?, ?, ?)")
            .run(Math.random().toString(36).substr(2, 9), tenantId, brand);
        }

        const defaultServices = ['Simple', 'Complet', 'Moteur', 'Polish'];
        const defaultPrices: any = {
          'Simple': { 'Moto': 1000, 'Berline': 2000, 'SUV': 3000 },
          'Complet': { 'Moto': 2000, 'Berline': 5000, 'SUV': 7000 },
          'Moteur': { 'Moto': 1500, 'Berline': 3000, 'SUV': 4000 },
          'Polish': { 'Moto': 5000, 'Berline': 15000, 'SUV': 20000 }
        };

        for (const label of defaultServices) {
          for (const vt of defaultVehicleTypes) {
            const price = defaultPrices[label][vt.label] || 0;
            db.prepare("INSERT INTO services (id, tenant_id, label, vehicle_type_id, price) VALUES (?, ?, ?, ?, ?)")
              .run(Math.random().toString(36).substr(2, 9), tenantId, label, vt.id, price);
          }
        }
      });
      createTenant();
      res.json({ success: true, tenantId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/tenants", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const tenants = db.prepare("SELECT * FROM tenants").all();
    res.json(tenants);
  });

  app.patch("/api/tenants/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { name, brands_enabled, expenses_enabled } = req.body;

    let query = "UPDATE tenants SET ";
    const params: any[] = [];
    const updates: string[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (brands_enabled !== undefined) {
      updates.push("brands_enabled = ?");
      params.push(brands_enabled ? 1 : 0);
    }
    if (expenses_enabled !== undefined) {
      updates.push("expenses_enabled = ?");
      params.push(expenses_enabled ? 1 : 0);
    }

    if (updates.length === 0) return res.json({ success: true });

    query += updates.join(", ") + " WHERE id = ?";
    params.push(req.params.id);

    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.patch("/api/tenants/:id/toggle", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const tenant: any = db.prepare("SELECT active FROM tenants WHERE id = ?").get(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    const newStatus = tenant.active === 1 ? 0 : 1;
    db.prepare("UPDATE tenants SET active = ? WHERE id = ?").run(newStatus, req.params.id);
    res.json({ success: true, active: newStatus });
  });

  // --- User Management (Manager & Super Manager) ---
  app.post("/api/users", authenticate, (req: any, res) => {
    // Managers can add cashiers and washers. Super Manager can add anyone.
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });

    const { username, password, role, tenant_id, first_name, last_name, phone } = req.body;

    // Restriction for Manager
    if (req.user.role === "manager") {
      if (role !== "cashier" && role !== "washer") return res.status(403).json({ error: "Managers can only add cashiers or washers" });
    }

    const targetTenantId = req.user.role === "super_manager" ? tenant_id : req.user.tenant_id;
    const id = Math.random().toString(36).substr(2, 9);
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

    try {
      db.prepare("INSERT INTO users (id, tenant_id, username, password, role, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, targetTenantId, username, hashedPassword, role, first_name || null, last_name || null, phone || null);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });

    const { first_name, last_name, phone, password, username } = req.body;

    try {
      let query = "UPDATE users SET first_name = ?, last_name = ?, phone = ?";
      let params = [first_name || null, last_name || null, phone || null];

      if (username) {
        query += ", username = ?";
        params.push(username);
      }

      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        query += ", password = ?";
        params.push(hashedPassword);
      }

      query += " WHERE id = ?";
      params.push(req.params.id);

      db.prepare(query).run(...params);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/users", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    // Managers and Super Managers can see users
    if (req.user.role !== "manager" && req.user.role !== "super_manager" && req.user.role !== "cashier") return res.status(403).json({ error: "Forbidden" });

    const users = db.prepare("SELECT id, username, role, active, first_name, last_name, phone FROM users WHERE tenant_id = ?").all(tenantId);
    res.json(users);
  });

  app.patch("/api/users/:id/toggle", authenticate, (req: any, res) => {
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });

    const user: any = db.prepare("SELECT tenant_id, active FROM users WHERE id = ?").get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.user.role === "manager" && user.tenant_id !== req.user.tenant_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const newStatus = user.active === 1 ? 0 : 1;
    db.prepare("UPDATE users SET active = ? WHERE id = ?").run(newStatus, req.params.id);
    res.json({ success: true, active: newStatus });
  });

  app.delete("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });

    // Check if user belongs to tenant if manager
    if (req.user.role === "manager") {
      const user: any = db.prepare("SELECT tenant_id FROM users WHERE id = ?").get(req.params.id);
      if (!user || user.tenant_id !== req.user.tenant_id) return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- Vehicle Type Management ---
  app.get("/api/vehicle-types", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    const types = db.prepare("SELECT * FROM vehicle_types WHERE tenant_id = ?").all(tenantId);
    res.json(types);
  });

  app.post("/api/vehicle-types", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { tenant_id, label } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.transaction(() => {
        db.prepare("INSERT INTO vehicle_types (id, tenant_id, label) VALUES (?, ?, ?)").run(id, tenant_id, label);
        // Add service entries for all existing labels
        const labels = db.prepare("SELECT DISTINCT label FROM services WHERE tenant_id = ?").all(tenant_id);
        for (const l of labels) {
          db.prepare("INSERT INTO services (id, tenant_id, label, vehicle_type_id, price) VALUES (?, ?, ?, ?, ?)")
            .run(Math.random().toString(36).substr(2, 9), tenant_id, l.label, id, 0);
        }
      })();
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/vehicle-types/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { label } = req.body;
    db.prepare("UPDATE vehicle_types SET label = ? WHERE id = ?").run(label, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/vehicle-types/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM services WHERE vehicle_type_id = ?").run(req.params.id);
        db.prepare("DELETE FROM vehicle_types WHERE id = ?").run(req.params.id);
      })();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Service Management ---
  app.get("/api/services", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    const services = db.prepare(`
      SELECT s.*, vt.label as vehicle_type_label
      FROM services s
      JOIN vehicle_types vt ON s.vehicle_type_id = vt.id
      WHERE s.tenant_id = ?
    `).all(tenantId);
    res.json(services);
  });

  app.post("/api/services/labels", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { tenant_id, label } = req.body;
    try {
      db.transaction(() => {
        const vehicleTypes = db.prepare("SELECT id FROM vehicle_types WHERE tenant_id = ?").all(tenant_id);
        for (const vt of vehicleTypes) {
          db.prepare("INSERT INTO services (id, tenant_id, label, vehicle_type_id, price) VALUES (?, ?, ?, ?, ?)")
            .run(Math.random().toString(36).substr(2, 9), tenant_id, label, vt.id, 0);
        }
      })();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/services/labels", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { tenant_id, oldLabel, newLabel } = req.body;
    db.prepare("UPDATE services SET label = ? WHERE tenant_id = ? AND label = ?").run(newLabel, tenant_id, oldLabel);
    res.json({ success: true });
  });

  app.delete("/api/services/labels", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { tenant_id, label } = req.body;
    db.prepare("DELETE FROM services WHERE tenant_id = ? AND label = ?").run(tenant_id, label);
    res.json({ success: true });
  });

  app.put("/api/services/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { price } = req.body;
    db.prepare("UPDATE services SET price = ? WHERE id = ?").run(price, req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/services/:id/toggle", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const service: any = db.prepare("SELECT active FROM services WHERE id = ?").get(req.params.id);
    if (!service) return res.status(404).json({ error: "Service not found" });
    const newStatus = service.active === 1 ? 0 : 1;
    db.prepare("UPDATE services SET active = ? WHERE id = ?").run(newStatus, req.params.id);
    res.json({ success: true, active: newStatus });
  });

  // --- Vehicle Brand Management ---
  app.get("/api/brands", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    const brands = db.prepare("SELECT * FROM vehicle_brands WHERE tenant_id = ? ORDER BY name ASC").all(tenantId);
    res.json(brands);
  });

  app.post("/api/brands", authenticate, (req: any, res) => {
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { tenant_id, name } = req.body;
    const targetTenantId = req.user.role === "super_manager" ? tenant_id : req.user.tenant_id;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      db.prepare("INSERT INTO vehicle_brands (id, tenant_id, name) VALUES (?, ?, ?)").run(id, targetTenantId, name);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/brands/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    const { name } = req.body;

    if (req.user.role === "manager") {
      const brand: any = db.prepare("SELECT tenant_id FROM vehicle_brands WHERE id = ?").get(req.params.id);
      if (!brand || brand.tenant_id !== req.user.tenant_id) return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare("UPDATE vehicle_brands SET name = ? WHERE id = ?").run(name, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/brands/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "manager" && req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });

    // Check if brand belongs to tenant if manager
    if (req.user.role === "manager") {
      const brand: any = db.prepare("SELECT tenant_id FROM vehicle_brands WHERE id = ?").get(req.params.id);
      if (!brand || brand.tenant_id !== req.user.tenant_id) return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare("DELETE FROM vehicle_brands WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // --- POS / Transaction Routes ---
  app.post("/api/transactions", authenticate, (req: any, res) => {
    const { matricule, brand, phone, vehicle_type, service_label, price, washer_id } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO transactions (id, tenant_id, cashier_id, washer_id, matricule, brand, phone, vehicle_type, service_label, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.tenant_id, req.user.id, washer_id, matricule, brand, phone, vehicle_type, service_label, price);
    res.json({ success: true, id });
  });

  app.get("/api/transactions", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    const cashierId = req.query.cashier_id;
    const period = req.query.period;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = `
      SELECT t.*, c.username as cashier_name, w.username as washer_name, ten.name as tenant_name
      FROM transactions t
      JOIN users c ON t.cashier_id = c.id
      JOIN users w ON t.washer_id = w.id
      JOIN tenants ten ON t.tenant_id = ten.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tenantId) {
      query += " AND t.tenant_id = ?";
      params.push(tenantId);
    } else if (req.user.role !== 'super_manager') {
      // If not super_manager and no tenantId provided (shouldn't happen with middleware but safe)
      query += " AND t.tenant_id = ?";
      params.push(req.user.tenant_id);
    }

    if (period === 'today') {
      query += " AND date(t.timestamp) = date('now')";
    } else if (period === '7days') {
      query += " AND t.timestamp >= date('now', '-7 days')";
    } else if (period === '30days') {
      query += " AND t.timestamp >= date('now', '-30 days')";
    } else if (period === 'custom' && startDate && endDate) {
      query += " AND date(t.timestamp) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    if (cashierId) {
      query += " AND t.cashier_id = ?";
      params.push(cashierId);
    } else if (req.user.role === "cashier") {
      query += " AND t.cashier_id = ?";
      params.push(req.user.id);
    }

    query += " ORDER BY t.timestamp DESC";

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  app.delete("/api/transactions/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/transactions/clear", authenticate, (req: any, res) => {
    if (req.user.role !== "super_manager") return res.status(403).json({ error: "Forbidden" });
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM transactions").run();
        db.prepare("DELETE FROM expenses").run();
      })();
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/stats", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    const cashierId = req.query.cashier_id;
    const period = req.query.period || '7days'; // today, 7days, 30days, custom
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (req.user.role !== "manager" && req.user.role !== "super_manager" && req.user.role !== "cashier") return res.status(403).json({ error: "Forbidden" });

    let dateFilter = "";
    const params: any[] = [tenantId];

    if (period === 'today') {
      dateFilter = "AND date(timestamp) = date('now')";
    } else if (period === '7days') {
      dateFilter = "AND timestamp >= date('now', '-7 days')";
    } else if (period === '30days') {
      dateFilter = "AND timestamp >= date('now', '-30 days')";
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = "AND date(timestamp) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    let cashierFilter = "";
    if (cashierId) {
      cashierFilter = "AND cashier_id = ?";
      params.push(cashierId);
    } else if (req.user.role === "cashier") {
      cashierFilter = "AND cashier_id = ?";
      params.push(req.user.id);
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyRevenue = db.prepare(`SELECT SUM(price) as total FROM transactions WHERE tenant_id = ? AND date(timestamp) = ? ${cashierFilter}`)
      .get(tenantId, today, ...(cashierId || req.user.role === "cashier" ? [cashierId || req.user.id] : []));

    const totalTransactions = db.prepare(`SELECT COUNT(*) as count FROM transactions WHERE tenant_id = ? ${dateFilter} ${cashierFilter}`)
      .get(...params);

    const periodRevenue = db.prepare(`SELECT SUM(price) as total FROM transactions WHERE tenant_id = ? ${dateFilter} ${cashierFilter}`)
      .get(...params);

    const periodExpenses = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE tenant_id = ? ${dateFilter} ${cashierFilter}`)
      .get(...params);

    const dailyExpenses = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE tenant_id = ? AND date(timestamp) = ? ${cashierFilter}`)
      .get(tenantId, today, ...(cashierId || req.user.role === "cashier" ? [cashierId || req.user.id] : []));

    // Washer performance stats
    const washerStats = db.prepare(`
      SELECT w.username as name, COUNT(t.id) as count, SUM(t.price) as revenue
      FROM transactions t
      JOIN users w ON t.washer_id = w.id
      WHERE t.tenant_id = ? ${dateFilter.replace('timestamp', 't.timestamp')} ${cashierFilter.replace('cashier_id', 't.cashier_id')}
      GROUP BY t.washer_id
      ORDER BY count DESC
    `).all(...params);

    // Daily revenue history for the period
    const dailyHistory = db.prepare(`
      SELECT date(timestamp) as date, SUM(price) as revenue, COUNT(*) as count
      FROM transactions
      WHERE tenant_id = ? ${dateFilter} ${cashierFilter}
      GROUP BY date(timestamp)
      ORDER BY date ASC
    `).all(...params);

    res.json({
      dailyRevenue: (dailyRevenue as any)?.total || 0,
      dailyExpenses: (dailyExpenses as any)?.total || 0,
      periodRevenue: (periodRevenue as any)?.total || 0,
      periodExpenses: (periodExpenses as any)?.total || 0,
      totalTransactions: (totalTransactions as any)?.count || 0,
      washerStats,
      dailyHistory
    });
  });

  // --- Expenses API ---
  app.get("/api/expenses", authenticate, (req: any, res) => {
    const tenantId = req.query.tenant_id || req.user.tenant_id;
    const cashierId = req.query.cashier_id;
    const period = req.query.period;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (req.user.role !== "manager" && req.user.role !== "super_manager" && req.user.role !== "cashier") return res.status(403).json({ error: "Forbidden" });

    let query = "SELECT e.*, u.username as cashier_name, ten.name as tenant_name FROM expenses e LEFT JOIN users u ON e.cashier_id = u.id JOIN tenants ten ON e.tenant_id = ten.id WHERE 1=1";
    const params: any[] = [];

    if (tenantId) {
      query += " AND e.tenant_id = ?";
      params.push(tenantId);
    } else if (req.user.role !== 'super_manager') {
      query += " AND e.tenant_id = ?";
      params.push(req.user.tenant_id);
    }

    if (period === 'today') {
      query += " AND date(e.timestamp) = date('now')";
    } else if (period === '7days') {
      query += " AND e.timestamp >= date('now', '-7 days')";
    } else if (period === '30days') {
      query += " AND e.timestamp >= date('now', '-30 days')";
    } else if (period === 'custom' && startDate && endDate) {
      query += " AND date(e.timestamp) BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    if (cashierId) {
      query += " AND e.cashier_id = ?";
      params.push(cashierId);
    } else if (req.user.role === "cashier") {
      query += " AND e.cashier_id = ?";
      params.push(req.user.id);
    }

    query += " ORDER BY e.timestamp DESC";

    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  });

  app.post("/api/expenses", authenticate, (req: any, res) => {
    const { description, amount, category } = req.body;
    const tenantId = req.user.tenant_id;
    if (req.user.role !== "manager" && req.user.role !== "cashier") return res.status(403).json({ error: "Forbidden" });

    const tenant = db.prepare("SELECT expenses_enabled FROM tenants WHERE id = ?").get(tenantId) as any;
    if (tenant && tenant.expenses_enabled === 0) {
      return res.status(403).json({ error: "Les dépenses sont désactivées pour cette caisse." });
    }

    const id = Math.random().toString(36).substring(2, 15);
    db.prepare("INSERT INTO expenses (id, tenant_id, cashier_id, description, amount, category) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, tenantId, req.user.id, description, amount, category || null);

    res.json({ id, description, amount, category, cashier_id: req.user.id });
  });

  app.delete("/api/expenses/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "manager") return res.status(403).json({ error: "Forbidden" });
    db.prepare("DELETE FROM expenses WHERE id = ? AND tenant_id = ?")
      .run(req.params.id, req.user.tenant_id);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
