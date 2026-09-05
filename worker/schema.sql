-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Abu Fragrance — D1 Database Schema                        ║
-- ║  Source of truth for products, orders, and settings         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Products Table ───
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL,
    old_price REAL,
    category TEXT NOT NULL DEFAULT 'General',
    image TEXT NOT NULL DEFAULT '',
    images TEXT DEFAULT '[]',
    sizes TEXT DEFAULT '[]',
    is_promo INTEGER DEFAULT 0,
    free_delivery INTEGER DEFAULT 0,
    delivery_company TEXT DEFAULT 'anderson',
    stop_desk_enabled INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ─── Orders Table ───
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number INTEGER UNIQUE,

    -- Customer Info
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL DEFAULT '',
    customer_wilaya TEXT NOT NULL DEFAULT '',
    customer_wilaya_id INTEGER,
    customer_commune TEXT NOT NULL DEFAULT '',

    -- Order Content
    items TEXT NOT NULL DEFAULT '[]',
    total REAL NOT NULL DEFAULT 0,
    delivery_fee REAL NOT NULL DEFAULT 0,
    actual_delivery_fee REAL,
    delivery_type TEXT CHECK(delivery_type IN ('office', 'domicile')) DEFAULT 'domicile',

    -- Stop Desk (office delivery)
    stop_desk_id TEXT,
    stop_desk_name TEXT,
    stop_desk_address TEXT,
    stop_desk_commune TEXT,

    -- Status & Fulfillment
    status TEXT CHECK(status IN (
        'pending',
        'sent_to_company',
        'confirmed',
        'no_answer',
        'shipped',
        'delivered',
        'cancelled'
    )) DEFAULT 'pending',
    carrier TEXT DEFAULT NULL,
    delivery_company TEXT DEFAULT 'anderson',
    tracking_number TEXT DEFAULT NULL,
    processed_by TEXT CHECK(processed_by IN ('manual', 'confirmation_company')) DEFAULT 'manual',

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);

-- ─── Settings Table (key-value store) ───
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('order_counter', '{"last_number": 0}'),
    ('marketing', '{"facebook_pixel_id": "", "tiktok_pixel_id": ""}'),
    ('delivery_config', '{"ecotrack": {"api_token": ""}}'),
    ('confirmation_company', '{"enabled": false, "api_token": "", "api_url": "", "webhook_secret": ""}');

-- ─── Order Logs Table (audit trail) ───
CREATE TABLE IF NOT EXISTS order_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    details TEXT,
    actor TEXT DEFAULT 'system',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_created_at ON order_logs(created_at);
