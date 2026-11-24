CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    portions INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity REAL NOT NULL,

    FOREIGN KEY (recipe_id)
        REFERENCES recipes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe
ON recipe_ingredients(recipe_id);