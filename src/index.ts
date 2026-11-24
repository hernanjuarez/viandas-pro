
type IngredientRow = {
  id: number;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
};
type RecipeRow = {
  id: number;
  name: string;
  description: string | null;
  portions: number;
};

type RecipeIngredientRow = {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  quantity: number;
};

type LotRow = {
  id: number;
  ingredient_id: number;
  quantity: number;
  unit_cost: number;
  supplier: string | null;
  purchase_date: string;
  expiration_date: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/ingredients") {
      if (request.method === "GET") {
        try {
          const ingredientsResult = await env.viandas_pro_db
            .prepare("SELECT * FROM ingredients ORDER BY name ASC")
            .all<IngredientRow>();

          const lotsResult = await env.viandas_pro_db
            .prepare("SELECT * FROM ingredient_lots ORDER BY id ASC")
            .all<LotRow>();

          const ingredients = ingredientsResult.results.map((ingredient) => {
            const lots = lotsResult.results
              .filter((lot) => lot.ingredient_id === ingredient.id)
              .map((lot) => ({
                id: lot.id,
                quantity: lot.quantity,
                unitCost: lot.unit_cost,
                supplier: lot.supplier || "",
                purchaseDate: lot.purchase_date,
                expirationDate: lot.expiration_date || "",
              }));

            return {
              id: ingredient.id,
              name: ingredient.name,
              category: ingredient.category,
              unit: ingredient.unit,
              minStock: ingredient.min_stock,
              lots,
            };
          });

          return json(ingredients);
        } catch (error) {
          console.error("Error al consultar ingredientes:", error);
          return json({ error: "No se pudieron consultar los ingredientes." }, 500);
        }
      }

if (request.method === "POST") {
  try {
    const data = await request.json<{
      ingredientId?: number;
      name?: string;
      category?: string;
      quantity: number;
      unit?: string;
      totalCost: number;
      supplier?: string;
      purchaseDate: string;
      expirationDate?: string;
      minStock?: number;
    }>();

    const quantity = Number(data.quantity);
    const totalCost = Number(data.totalCost);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(totalCost) ||
      totalCost < 0 ||
      !data.purchaseDate
    ) {
      return json({ error: "Revisá los datos de la compra." }, 400);
    }

    let ingredientId: number;

    // Compra de un ingrediente existente
    if (data.ingredientId !== undefined) {
      ingredientId = Number(data.ingredientId);

      if (!Number.isInteger(ingredientId) || ingredientId <= 0) {
        return json({ error: "ID de ingrediente inválido." }, 400);
      }

      const existingIngredient = await env.viandas_pro_db
        .prepare("SELECT id FROM ingredients WHERE id = ?")
        .bind(ingredientId)
        .first();

      if (!existingIngredient) {
        return json({ error: "El ingrediente no existe." }, 404);
      }
    } else {
      // Creación de un ingrediente nuevo
      const minStock = Number(data.minStock);

      if (
        !data.name?.trim() ||
        !data.category ||
        !data.unit ||
        !Number.isFinite(minStock) ||
        minStock < 0
      ) {
        return json({ error: "Revisá los datos del ingrediente." }, 400);
      }

      const ingredientResult = await env.viandas_pro_db
        .prepare(
          `INSERT INTO ingredients (name, category, unit, min_stock)
           VALUES (?, ?, ?, ?)`
        )
        .bind(data.name.trim(), data.category, data.unit, minStock)
        .run();

      ingredientId = Number(ingredientResult.meta.last_row_id);
    }

    // Registrar la compra como un lote independiente
    await env.viandas_pro_db
      .prepare(
        `INSERT INTO ingredient_lots
         (ingredient_id, quantity, unit_cost, supplier, purchase_date, expiration_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        ingredientId,
        quantity,
        totalCost / quantity,
        data.supplier?.trim() || null,
        data.purchaseDate,
        data.expirationDate || null
      )
      .run();

    return json(
      {
        message: "Compra registrada correctamente.",
        id: ingredientId,
      },
      201
    );
  } catch (error) {
    console.error("Error al guardar la compra:", error);
    return json({ error: "No se pudo guardar la compra." }, 500);
  }
}

      return json({ error: "Método no permitido." }, 405);
}

// RUTA DE RECETAS
if (url.pathname === "/api/recipes") {
  if (request.method === "GET") {
    try {
      const recipesResult = await env.viandas_pro_db
        .prepare("SELECT * FROM recipes ORDER BY name ASC")
        .all<RecipeRow>();

      const ingredientsResult = await env.viandas_pro_db
        .prepare("SELECT * FROM recipe_ingredients")
        .all<RecipeIngredientRow>();

      const recipes = recipesResult.results.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description || "",
        portions: recipe.portions,
        ingredients: ingredientsResult.results
          .filter((item) => item.recipe_id === recipe.id)
          .map((item) => ({
            ingredientId: item.ingredient_id,
            quantity: item.quantity,
          })),
      }));

      return json(recipes);
    } catch (error) {
      console.error("Error al consultar recetas:", error);
      return json({ error: "No se pudieron consultar las recetas." }, 500);
    }
  }

    if (request.method === "POST") {
    try {
      const data = await request.json<{
        name: string;
        description?: string;
        portions: number;
        ingredients: {
          ingredientId: number;
          quantity: number;
        }[];
      }>();

      const name = data.name?.trim();
      const portions = Number(data.portions);
      const recipeIngredients = data.ingredients;

      if (
        !name ||
        !Number.isInteger(portions) ||
        portions <= 0 ||
        !Array.isArray(recipeIngredients) ||
        recipeIngredients.length === 0
      ) {
        return json({ error: "Revisá los datos de la receta." }, 400);
      }

      for (const item of recipeIngredients) {
        if (
          !Number.isInteger(Number(item.ingredientId)) ||
          Number(item.ingredientId) <= 0 ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0
        ) {
          return json({ error: "Revisá los ingredientes y sus cantidades." }, 400);
        }

        const ingredient = await env.viandas_pro_db
          .prepare("SELECT id FROM ingredients WHERE id = ?")
          .bind(Number(item.ingredientId))
          .first();

        if (!ingredient) {
          return json({ error: "Uno de los ingredientes no existe." }, 400);
        }
      }

      const recipeResult = await env.viandas_pro_db
        .prepare(
          `INSERT INTO recipes (name, description, portions)
           VALUES (?, ?, ?)`
        )
        .bind(name, data.description?.trim() || null, portions)
        .run();

      const recipeId = Number(recipeResult.meta.last_row_id);

      for (const item of recipeIngredients) {
        await env.viandas_pro_db
          .prepare(
            `INSERT INTO recipe_ingredients
             (recipe_id, ingredient_id, quantity)
             VALUES (?, ?, ?)`
          )
          .bind(recipeId, Number(item.ingredientId), Number(item.quantity))
          .run();
      }

      return json(
        { message: "Receta guardada correctamente.", id: recipeId },
        201
      );
    } catch (error) {
      console.error("Error al guardar la receta:", error);
      return json({ error: "No se pudo guardar la receta." }, 500);
    }
  }

  return json({ error: "Método no permitido." }, 405);
}

return json({ error: "Ruta no encontrada." }, 404);
  },
} satisfies ExportedHandler<Env>;
