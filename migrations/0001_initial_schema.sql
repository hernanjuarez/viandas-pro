
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    min_stock REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredient_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    supplier TEXT,
    purchase_date TEXT NOT NULL,
    expiration_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ingredient_lots_ingredient
ON ingredient_lots(ingredient_id);

CREATE INDEX IF NOT EXISTS idx_ingredient_lots_expiration
ON ingredient_lots(expiration_date);

ALTER TABLE ingredients
ADD COLUMN grams_per_unit REAL;