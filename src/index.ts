
type IngredientRow = {
  id: number;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
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

    return json({ error: "Ruta no encontrada." }, 404);
  },
} satisfies ExportedHandler<Env>;
