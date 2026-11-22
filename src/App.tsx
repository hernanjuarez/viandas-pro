import { useState } from "react";

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

function App() {
  const [activeSection, setActiveSection] = useState("Dashboard");

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
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <a
                  href="#"
                  key={item.label}
                  className={`nav-item ${activeSection === item.label ? "active" : ""}`}
                    onClick={() => setActiveSection(item.label)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <a href="#" className="nav-item">
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

            <div className="topbar-date">
              Panel de gestión
            </div>
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
            <p>Controlá los ingredientes que necesitan atención.</p>
          </div>
        </div>

        <div className="expiry-empty">
          <div className="expiry-empty-icon">📅</div>
          <h3>Todo listo para controlar los vencimientos</h3>
          <p>
            Cuando registres ingredientes y sus fechas de vencimiento,
            vas a encontrar las alertas en esta sección.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <Package size={21} />
          </div>
          <span>Ingredientes registrados</span>
          <strong>—</strong>
          <small>Ingredientes cargados</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Package size={21} />
          </div>
          <span>Stock bajo</span>
          <strong>—</strong>
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
          <span>Administrá tus materias primas y controlá el stock</span>
        </div>

        <button className="primary-button">
          + Nuevo ingrediente
        </button>
      </div>

      <div className="welcome-card">
        <div>
          <h3>Tu inventario</h3>
          <p>
            Acá vas a poder consultar cantidades, costos y vencimientos.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>0</h3>
          <small>Ingredientes registrados</small>
        </div>

        <div className="stat-card">
          <h3>0</h3>
          <small>Con stock bajo</small>
        </div>

        <div className="stat-card">
          <h3>0</h3>
          <small>Próximos vencimientos</small>
        </div>

        <div className="stat-card">
          <h3>$0</h3>
          <small>Valor del inventario</small>
        </div>
      </div>
    </>
  )}
</section>

      </main>
    </div>
  );
}

export default App;
