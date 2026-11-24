
import { useEffect, useState, type FormEvent } from "react";

import {
  LayoutDashboard,
  ChefHat,
  Package,
  ClipboardList,
  Truck,
  BarChart3,
  Settings,
  Leaf,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Ingredientes", icon: Package },
  { label: "Recetas", icon: ChefHat },
  { label: "Producción", icon: ClipboardList },
  { label: "Proveedores", icon: Truck },
  { label: "Estadísticas", icon: BarChart3 },
];

type PurchaseLot = {
  id: number;
  quantity: number;
  unitCost: number;
  supplier: string;
  purchaseDate: string;
  expirationDate: string;
};

type Ingredient = {
  id: number;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  lots: PurchaseLot[];
};
type RecipeIngredient = {
  ingredientId: number;
  quantity: number;
};

type Recipe = {
  id: number;
  name: string;
  description: string;
  portions: number;
  ingredients: RecipeIngredient[];
};
const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyForm = {
  name: "",
  category: "",
  quantity: "",
  unit: "kg",
  totalCost: "",
  supplier: "",
  purchaseDate: today(),
  expirationDate: "",
  minStock: "",
};

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showRecipeForm, setShowRecipeForm] = useState(false);

const [recipeData, setRecipeData] = useState({
  name: "",
  description: "",
  portions: 1,
  ingredients: [] as RecipeIngredient[],
});
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    useEffect(() => {
  const loadData = async () => {
    try {
      // Cargar ingredientes
      const ingredientsResponse = await fetch("/api/ingredients");

      if (!ingredientsResponse.ok) {
        throw new Error("No se pudieron cargar los ingredientes");
      }

      const ingredientsData: Ingredient[] =
        await ingredientsResponse.json();

      setIngredients(ingredientsData);

      // Cargar recetas
      const recipesResponse = await fetch("/api/recipes");

      if (!recipesResponse.ok) {
        throw new Error("No se pudieron cargar las recetas");
      }

      const recipesData: Recipe[] = await recipesResponse.json();

      setRecipes(recipesData);
    } catch (error) {
      console.error("Error al cargar los datos:", error);
    }
  };

  loadData();
}, []);

  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
  ingredientId: "",
  quantity: "",
  totalCost: "",
  supplier: "",
  purchaseDate: today(),
  expirationDate: "",
});
  const [activeSection, setActiveSection] = useState("Dashboard");

  const [formData, setFormData] = useState(emptyForm);

  const getStock = (ingredient: Ingredient) =>
    ingredient.lots.reduce((total, lot) => total + lot.quantity, 0);

  const getAverageCost = (ingredient: Ingredient) => {
    const stock = getStock(ingredient);

    if (stock === 0) return 0;

    const totalValue = ingredient.lots.reduce(
      (total, lot) => total + lot.quantity * lot.unitCost,
      0
    );

    return totalValue / stock;
  };
  const getExpirationStatus = (expirationDate: string) => {
  if (!expirationDate) return "Sin vencimiento";

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const todayDate = new Date(`${todayString}T00:00:00`);
  const expiration = new Date(`${expirationDate}T00:00:00`);

  const daysRemaining = Math.round(
    (expiration.getTime() - todayDate.getTime()) / 86400000
  );

  if (daysRemaining < 0) return "Vencido";
  if (daysRemaining <= 7) return "Por vencer";

  return "Vigente";
};
const getExpirationStock = (
  ingredient: Ingredient,
  status: string
) => {
  return ingredient.lots.reduce((total, lot) => {
    return getExpirationStatus(lot.expirationDate) === status
      ? total + lot.quantity
      : total;
  }, 0);
};

  const getLatestSupplier = (ingredient: Ingredient) =>
    ingredient.lots[ingredient.lots.length - 1]?.supplier || "";

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  const lowStockCount = ingredients.filter((ingredient) => {
  const stock = getStock(ingredient);
  const expiredStock = getExpirationStock(ingredient, "Vencido");
  const availableStock = stock - expiredStock;

  return availableStock <= ingredient.minStock;
}).length;

  const inventoryValue = ingredients.reduce(
    (total, ingredient) =>
      total +
      ingredient.lots.reduce(
        (lotTotal, lot) => lotTotal + lot.quantity * lot.unitCost,
        0
      ),
    0
  );

    const handleSaveIngredient = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const quantity = Number(formData.quantity);
    const totalCost = Number(formData.totalCost);
    const minStock = Number(formData.minStock);

    if (
      !formData.name.trim() ||
      !formData.category ||
      quantity <= 0 ||
      totalCost < 0 ||
      minStock < 0
    ) {
      return;
    }

    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          quantity,
          unit: formData.unit,
          totalCost,
          supplier: formData.supplier.trim(),
          purchaseDate: formData.purchaseDate,
          expirationDate: formData.expirationDate,
          minStock,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "No se pudo guardar el ingrediente.");
      }

      const updatedResponse = await fetch("/api/ingredients");

      if (!updatedResponse.ok) {
        throw new Error("No se pudo actualizar la lista.");
      }

      const updatedIngredients: Ingredient[] = await updatedResponse.json();
      setIngredients(updatedIngredients);

      setFormData({
        ...emptyForm,
        purchaseDate: today(),
      });

      setShowIngredientForm(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert(error instanceof Error ? error.message : "Ocurrió un error al guardar.");
    }
  };
  const handleSavePurchase = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const quantity = Number(purchaseData.quantity);
  const totalCost = Number(purchaseData.totalCost);
  const ingredientId = Number(purchaseData.ingredientId);

  if (!ingredientId || quantity <= 0 || totalCost < 0 || !purchaseData.purchaseDate) {
    alert("Revisá los datos de la compra.");
    return;
  }

  try {
    const response = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientId,
        quantity,
        totalCost,
        supplier: purchaseData.supplier.trim(),
        purchaseDate: purchaseData.purchaseDate,
        expirationDate: purchaseData.expirationDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || "No se pudo registrar la compra.");
    }

    const updatedResponse = await fetch("/api/ingredients");

    if (!updatedResponse.ok) {
      throw new Error("No se pudo actualizar la lista.");
    }

    const updatedIngredients: Ingredient[] = await updatedResponse.json();
    setIngredients(updatedIngredients);

    setPurchaseData({
      ingredientId: "",
      quantity: "",
      totalCost: "",
      supplier: "",
      purchaseDate: today(),
      expirationDate: "",
    });

    setShowPurchaseForm(false);
    alert("Compra registrada correctamente.");
  } catch (error) {
    console.error("Error al registrar la compra:", error);
    alert(error instanceof Error ? error.message : "Ocurrió un error.");
  }
};

const handleSaveRecipe = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (
    !recipeData.name.trim() ||
    recipeData.portions <= 0 ||
    recipeData.ingredients.length === 0 ||
    recipeData.ingredients.some((item) => item.quantity <= 0)
  ) {
    alert("Completá el nombre, las porciones y las cantidades de los ingredientes.");
    return;
  }

  try {
    const response = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || "No se pudo guardar la receta.");
    }

    const updatedResponse = await fetch("/api/recipes");

    if (!updatedResponse.ok) {
      throw new Error("No se pudo actualizar la lista de recetas.");
    }

    const updatedRecipes: Recipe[] = await updatedResponse.json();
    setRecipes(updatedRecipes);

    setRecipeData({
      name: "",
      description: "",
      portions: 1,
      ingredients: [],
    });

    setShowRecipeForm(false);
    alert("Receta guardada correctamente.");
  } catch (error) {
    console.error("Error al guardar la receta:", error);
    alert(error instanceof Error ? error.message : "Ocurrió un error.");
  }
};
  

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Leaf size={23} />
          </div>
          <div>
            <h2>Viandas Pro</h2>
            <span>GESTIÓN GASTRONÓMICA</span>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="section-label">MENÚ PRINCIPAL</span>

          <nav className="navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  href="#"
                  key={item.label}
                  className={`nav-item ${
                    activeSection === item.label ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(item.label);
                  }}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <a
            href="#"
            className="nav-item"
            onClick={(e) => e.preventDefault()}
          >
            <Settings size={19} />
            <span>Configuración</span>
          </a>

          <div className="user-profile">
            <div className="user-avatar">VP</div>
            <div className="user-info">
              <strong>Administrador</strong>
              <span>Gestión del negocio</span>
            </div>
            <ChevronDown size={17} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Inicio</span>
            <span>/</span>
            <strong>{activeSection}</strong>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Buscar">
              <Search size={19} />
            </button>

            <button className="icon-button" aria-label="Notificaciones">
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <div className="topbar-date">Panel de gestión</div>
          </div>
        </header>

        <section className="dashboard">
          {activeSection === "Dashboard" && (
            <>
              <div className="welcome-section">
                <div>
                  <span className="eyebrow">RESUMEN GENERAL</span>
                  <h1>{activeSection}</h1>
                  <p>Bienvenido a tu centro de gestión gastronómica.</p>
                </div>

                <button className="date-button">
                  Últimos 30 días
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="welcome-card">
                <div>
                  <span>VIANDAS PRO</span>
                  <h2>Todo tu negocio, en un solo lugar.</h2>
                  <p>
                    Gestioná ingredientes, recetas, producción y costos
                    desde una única plataforma.
                  </p>
                </div>

                <div className="welcome-decoration">
                  <Leaf size={75} />
                </div>
              </div>

              <div className="section-heading">
                <h2>Resumen del negocio</h2>
                <span>Indicadores principales</span>
              </div>

              <div className="section-heading">
                <h2>Próximos vencimientos</h2>
                <span>Control de stock</span>
              </div>

              <div className="expiry-section">
                <div className="expiry-header">
                  <div>
                    <h2>Próximos vencimientos</h2>
                    <p>
                      Controlá los ingredientes que necesitan atención.
                    </p>
                  </div>
                </div>

                <div className="expiry-empty">
                  <div className="expiry-empty-icon">📅</div>
                  <h3>Todo listo para controlar los vencimientos</h3>
                  <p>
                    Cuando registres ingredientes y sus fechas de
                    vencimiento, vas a encontrar las alertas en esta sección.
                  </p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon green">
                    <Package size={21} />
                  </div>
                  <span>Ingredientes registrados</span>
                  <strong>{ingredients.length}</strong>
                  <small>Ingredientes cargados</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <Package size={21} />
                  </div>
                  <span>Stock bajo</span>
                  <strong>{lowStockCount}</strong>
                  <small>Requieren atención</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    <ChefHat size={21} />
                  </div>
                  <span>Recetas cargadas</span>
                  <strong>—</strong>
                  <small>Recetas registradas</small>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <ClipboardList size={21} />
                  </div>
                  <span>Producción del mes</span>
                  <strong>—</strong>
                  <small>Viandas producidas</small>
                </div>
              </div>
            </>
          )}

          {activeSection === "Ingredientes" && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Inventario de ingredientes</h2>
                  <span>
                    Administrá tus materias primas y controlá el stock
                  </span>
                </div>

                <div className="inventory-actions">
  <button
    className="primary-button"
    onClick={() => setShowIngredientForm(true)}
  >
    + Nuevo ingrediente
  </button>

  <button
    className="secondary-button"
    onClick={() => setShowPurchaseForm(true)}
  >
    + Registrar compra
  </button>
</div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{ingredients.length}</h3>
                  <small>Ingredientes registrados</small>
                </div>

                <div className="stat-card">
                  <h3>{lowStockCount}</h3>
                  <small>Con stock bajo</small>
                </div>

                <div className="stat-card">
  <h3>
    {ingredients.reduce(
      (total, ingredient) =>
        total +
        ingredient.lots.filter(
          (lot) => getExpirationStatus(lot.expirationDate) === "Vencido"
        ).length,
      0
    )}
  </h3>
  <small>Lotes vencidos</small>
</div>

<div className="stat-card">
  <h3>
    {ingredients.reduce(
      (total, ingredient) =>
        total +
        ingredient.lots.filter(
          (lot) => getExpirationStatus(lot.expirationDate) === "Por vencer"
        ).length,
      0
    )}
  </h3>
  <small>Lotes por vencer</small>
</div>

                <div className="stat-card">
                  <h3>${inventoryValue.toLocaleString("es-AR", {
                    maximumFractionDigits: 2,
                  })}</h3>
                  <small>Valor del inventario</small>
                </div>
              </div>

              <div className="inventory-toolbar">
                <div className="inventory-search">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Buscar ingrediente..."
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="inventory-table-container">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>Categoría</th>
                      <th>Stock actual</th>
                      <th>Costo por unidad</th>
                      <th>Valor del stock</th>
                      <th>Proveedor</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIngredients.length > 0 ? (
                      filteredIngredients.map((ingredient) => {
  const stock = getStock(ingredient);

  const expiredStock = getExpirationStock(ingredient, "Vencido");
  const availableStock = stock - expiredStock;

                        return (
                          <tr
  key={ingredient.id}
  onClick={() => setSelectedIngredient(ingredient)}
  className="clickable-row"
>
                            <td>{ingredient.name}</td>
                            <td>{ingredient.category}</td>
                            <td>
  <strong>
    {stock} {ingredient.unit}
  </strong>
  <div style={{ fontSize: "12px", color: "#16a34a" }}>
    Disponible: {availableStock} {ingredient.unit}
  </div>
  {expiredStock > 0 && (
    <div style={{ fontSize: "12px", color: "#dc2626" }}>
      Vencido: {expiredStock} {ingredient.unit}
    </div>
  )}
</td>
                            <td>
                              ${getAverageCost(ingredient).toLocaleString(
                                "es-AR",
                                { maximumFractionDigits: 2 }
                              )}
                            </td>
                            <td>
  ${(getStock(ingredient) * getAverageCost(ingredient)).toLocaleString(
    "es-AR",
    { maximumFractionDigits: 2 }
  )}
</td>
                            <td>
                              {getLatestSupplier(ingredient) || "Sin proveedor"}
                            </td>
                            <td>
                              <span
                                className={`stock-status ${
                                  availableStock <= ingredient.minStock
                                    ? "low"
                                    : "available"
                                }`}
                              >
                                {availableStock <= ingredient.minStock
                                  ? "Stock bajo"
                                  : "Disponible"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <div className="inventory-empty">
                            {ingredientSearch
                              ? "No se encontraron ingredientes."
                              : "Todavía no hay ingredientes registrados."}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
                    {activeSection === "Recetas" && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Mis recetas</h2>
                  <span>
                    Creá recetas, administrá sus ingredientes y calculá sus costos.
                  </span>
                </div>

                <button
  className="primary-button"
  onClick={() => setShowRecipeForm(true)}
>
  + Nueva receta
</button>
              </div>

              <div className="expiry-empty">
                <div className="expiry-empty-icon">🍲</div>
                <h3>Todavía no hay recetas registradas</h3>
                <p>
                  Cuando crees tu primera receta, vas a poder consultar
                  sus ingredientes y calcular cuánto cuesta producirla.
                </p>
              </div>
            </>
          )}
          {showRecipeForm && (
  <div className="modal-overlay">
    <div className="ingredient-modal">
      <div className="modal-header">
        <div>
          <h2>Nueva receta</h2>
          <p>Registrá una preparación y sus ingredientes</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowRecipeForm(false)}
        >
          ×
        </button>
      </div>

      <form className="ingredient-form" onSubmit={handleSaveRecipe}>
        <h3>Datos de la receta</h3>

        <label>Nombre de la receta</label>
        <input
          type="text"
          placeholder="Ej: Pollo con arroz"
          value={recipeData.name}
          onChange={(e) =>
            setRecipeData({ ...recipeData, name: e.target.value })
          }
        />

        <label>Descripción</label>
        <input
          type="text"
          placeholder="Descripción opcional"
          value={recipeData.description}
          onChange={(e) =>
            setRecipeData({ ...recipeData, description: e.target.value })
          }
        />

        <label>Cantidad de viandas que rinde</label>
        <input
          type="number"
          min="1"
          value={recipeData.portions}
          onChange={(e) =>
            setRecipeData({
              ...recipeData,
              portions: Number(e.target.value),
            })
          }
        />
        <h3>Ingredientes de la receta</h3>

<label>Seleccionar ingrediente</label>
<select
  defaultValue=""
  onChange={(e) => {
    const ingredientId = Number(e.target.value);

    if (
      ingredientId &&
      !recipeData.ingredients.some(
        (item) => item.ingredientId === ingredientId
      )
    ) {
      setRecipeData({
        ...recipeData,
        ingredients: [
          ...recipeData.ingredients,
          { ingredientId, quantity: 0 },
        ],
      });
    }

    e.target.value = "";
  }}
>
  <option value="">Elegí un ingrediente</option>

  {ingredients.map((ingredient) => (
    <option key={ingredient.id} value={ingredient.id}>
      {ingredient.name}
    </option>
  ))}
</select>
{recipeData.ingredients.map((item) => {
  const ingredient = ingredients.find(
    (current) => current.id === item.ingredientId
  );

  if (!ingredient) return null;

  return (
    <div key={item.ingredientId} className="form-group">
      <label>{ingredient.name} ({ingredient.unit})</label>

      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Cantidad utilizada"
        value={item.quantity || ""}
        onChange={(e) => {
          setRecipeData({
            ...recipeData,
            ingredients: recipeData.ingredients.map((current) =>
              current.ingredientId === item.ingredientId
                ? { ...current, quantity: Number(e.target.value) }
                : current
            ),
          });
        }}
      />

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setRecipeData({
            ...recipeData,
            ingredients: recipeData.ingredients.filter(
              (current) => current.ingredientId !== item.ingredientId
            ),
          });
        }}
      >
        Quitar ingrediente
      </button>
    </div>
  );
})}
<div className="recipe-cost-summary">
  <h3>Costos de la receta</h3>

  <p>
    Costo total de preparación:
    <strong>
      $
      {recipeData.ingredients
        .reduce((total, item) => {
          const ingredient = ingredients.find(
            (current) => current.id === item.ingredientId
          );

          return total + (
            ingredient
              ? item.quantity * getAverageCost(ingredient)
              : 0
          );
        }, 0)
        .toLocaleString("es-AR", { maximumFractionDigits: 2 })}
    </strong>
  </p>

  <p>
    Costo por vianda:
    <strong>
      $
      {(
        recipeData.ingredients.reduce((total, item) => {
          const ingredient = ingredients.find(
            (current) => current.id === item.ingredientId
          );

          return total + (
            ingredient
              ? item.quantity * getAverageCost(ingredient)
              : 0
          );
        }, 0) / Math.max(recipeData.portions, 1)
      ).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
    </strong>
  </p>
</div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowRecipeForm(false)}
          >
            Cancelar
          </button>

          <button type="submit" className="primary-button">
            Guardar receta
          </button>
        </div>
      </form>
    </div>
  </div>
)}

          {showIngredientForm && (
            <div className="modal-overlay">
              <div className="ingredient-modal">
                <div className="modal-header">
                  <div>
                    <h2>Nuevo ingrediente</h2>
                    <p>Registrá un ingrediente y su primera compra</p>
                  </div>

                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => setShowIngredientForm(false)}
                  >
                    ×
                  </button>
                </div>

                <form
                  className="ingredient-form"
                  onSubmit={handleSaveIngredient}
                >
                  <h3>Datos del ingrediente</h3>

                  <label>Nombre del ingrediente</label>
                  <input
                    type="text"
                    placeholder="Ej: Pechuga de pollo"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <label>Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Seleccionar categoría
                    </option>
                    <option>Almacén</option>
                    <option>Carnes</option>
                    <option>Verduras</option>
                    <option>Lácteos</option>
                    <option>Condimentos</option>
                    <option>Otros</option>
                  </select>

                  <div className="form-divider"></div>

                  <h3>Datos de la compra inicial</h3>

                  <div className="form-grid">
                    <div>
                      <label>Cantidad comprada</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="Ej: 10"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label>Unidad</label>
                      <select
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
                      >
                        <option value="kg">Kilogramos</option>
                        <option value="g">Gramos</option>
                        <option value="l">Litros</option>
                        <option value="ml">Mililitros</option>
                        <option value="unidades">Unidades</option>
                      </select>
                    </div>

                    <div>
                      <label>Costo total de compra ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ej: 80000"
                        value={formData.totalCost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalCost: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label>Proveedor</label>
                      <input
                        type="text"
                        placeholder="Nombre del proveedor"
                        value={formData.supplier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            supplier: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label>Fecha de compra</label>
                      <input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchaseDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label>Fecha de vencimiento</label>
                      <input
                        type="date"
                        value={formData.expirationDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expirationDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label>Stock mínimo</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ej: 2"
                        value={formData.minStock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minStock: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setFormData({
                          ...emptyForm,
                          purchaseDate: today(),
                        });
                        setShowIngredientForm(false);
                      }}
                    >
                      Cancelar
                    </button>

                    <button type="submit" className="primary-button">
                      Guardar ingrediente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showPurchaseForm && (
  <div className="modal-overlay">
    <div className="ingredient-modal">
      <div className="modal-header">
        <div>
          <h2>Registrar compra</h2>
          <p>Agregá stock a un ingrediente existente</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowPurchaseForm(false)}
        >
          ×
        </button>
      </div>

      <form
        className="ingredient-form"
        onSubmit={handleSavePurchase}
      >
        <h3>Datos de la compra</h3>

        <label>Ingrediente</label>
        <select
          value={purchaseData.ingredientId}
          onChange={(e) =>
            setPurchaseData({
              ...purchaseData,
              ingredientId: e.target.value,
            })
            
          }
          required
        >
          <option value="" disabled>
            Seleccionar ingrediente
          </option>

          {ingredients.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.id}>
              {ingredient.name}
            </option>
          ))}
        </select>

        <div className="form-grid">
          <div>
            <label>Cantidad comprada</label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder="Ej: 10"
              value={purchaseData.quantity}
              onChange={(e) =>
                setPurchaseData({
                  ...purchaseData,
                  quantity: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label>Costo total de compra ($)</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Ej: 80000"
              value={purchaseData.totalCost}
              onChange={(e) =>
                setPurchaseData({
                  ...purchaseData,
                  totalCost: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label>Proveedor</label>
            <input
              type="text"
              placeholder="Nombre del proveedor"
              value={purchaseData.supplier}
              onChange={(e) =>
                setPurchaseData({
                  ...purchaseData,
                  supplier: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label>Fecha de compra</label>
            <input
              type="date"
              value={purchaseData.purchaseDate}
              onChange={(e) =>
                setPurchaseData({
                  ...purchaseData,
                  purchaseDate: e.target.value,
                })
              }
              required
            />
          </div>

          <div>
            <label>Fecha de vencimiento</label>
            <input
              type="date"
              value={purchaseData.expirationDate}
              onChange={(e) =>
                setPurchaseData({
                  ...purchaseData,
                  expirationDate: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowPurchaseForm(false)}
          >
            Cancelar
          </button>

          <button type="submit" className="primary-button">
            Registrar compra
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{selectedIngredient && (
  <div
    className="modal-overlay"
    onClick={() => setSelectedIngredient(null)}
  >
    <div
      className="ingredient-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <div>
          <h2>{selectedIngredient.name}</h2>
          <p>Historial de compras</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setSelectedIngredient(null)}
        >
          ×
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>
            {getStock(selectedIngredient)} {selectedIngredient.unit}
          </h3>
          <small>Stock actual</small>
        </div>

        <div className="stat-card">
          <h3>
            ${getAverageCost(selectedIngredient).toLocaleString("es-AR", {
              maximumFractionDigits: 2,
            })}
          </h3>
          <small>Costo promedio por unidad</small>
        </div>
      </div>
<div className="stats-grid">
  <div className="stat-card">
    <h3>
      {getExpirationStock(selectedIngredient, "Vencido")}{" "}
      {selectedIngredient.unit}
    </h3>
    <small>Stock vencido</small>
  </div>

  <div className="stat-card">
    <h3>
      {getExpirationStock(selectedIngredient, "Por vencer")}{" "}
      {selectedIngredient.unit}
    </h3>
    <small>Stock por vencer</small>
  </div>

  <div className="stat-card">
    <h3>
      {getExpirationStock(selectedIngredient, "Vigente")}{" "}
      {selectedIngredient.unit}
    </h3>
    <small>Stock vigente</small>
  </div>
</div>
      <h3>Compras registradas</h3>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cantidad</th>
              <th>Costo por unidad</th>
              <th>Costo total</th>
              <th>Proveedor</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {selectedIngredient.lots.map((lot) => (
              <tr key={lot.id}>
                <td>{lot.purchaseDate}</td>
                <td>
                  {lot.quantity} {selectedIngredient.unit}
                </td>
                <td>
                  ${lot.unitCost.toLocaleString("es-AR", {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  ${(lot.quantity * lot.unitCost).toLocaleString("es-AR", {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>{lot.supplier || "Sin proveedor"}</td>
                <td>{lot.expirationDate || "Sin vencimiento"}</td>
                <td>
  <span
    className={`stock-status ${
      getExpirationStatus(lot.expirationDate) === "Vencido"
        ? "low"
        : getExpirationStatus(lot.expirationDate) === "Por vencer"
          ? "warning"
          : "available"
    }`}
  >
    {getExpirationStatus(lot.expirationDate)}
  </span>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
        </section>
      </main>
    </div>
  );
}

export default App;
