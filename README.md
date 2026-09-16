# 🖨️ Rokishi Frontend — UI Playground & Component Showcase

Bienvenido al repositorio frontend de **Rokishi**, la plataforma para la gestión de servicios e impresiones 3D. 

Este proyecto funciona como **UI Playground** y catálogo de referencia de componentes, utilizando la librería de componentes **Cloudflare Kumo UI** adaptada al lenguaje visual de Rokishi.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Build Tool**: [Vite](https://vitejs.dev/)
- **Sistema de UI / Componentes**: [@cloudflare/kumo](https://github.com/cloudflare/kumo)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) (vía `@tailwindcss/vite`)
- **Iconografía**: [Phosphor Icons](https://phosphoricons.com/) (`@phosphor-icons/react`)

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

- **Node.js**: `v18.0.0` o superior (se recomienda LTS)
- **npm**: `v9.0.0` o superior (viene incluido con Node.js)
- **Git**

Puedes verificar tus versiones ejecutando en la terminal:
```bash
node -v
npm -v
```

---

## 🚀 Despliegue Local (Paso a Paso)

Sigue estos pasos para correr el proyecto localmente en tu entorno de desarrollo:

### 1. Clonar el repositorio

```bash
git clone https://github.com/CarlosArguelloDev/rokishi-front.git
cd rokishi-front
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Una vez iniciado, abre tu navegador e ingresa a:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 📜 Comandos Disponibles

En el directorio del proyecto puedes ejecutar:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo con recarga rápida (HMR). |
| `npm run build` | Valida los tipos con TypeScript y genera el bundle optimizado para producción en `/dist`. |
| `npm run preview` | Previsualiza localmente el build de producción generado. |

---

## 📂 Estructura del Proyecto

```text
rokishi-front/
├── src/
│   ├── assets/          # Imágenes y recursos estáticos
│   ├── components/      # Componentes reutilizables (Sidebar, etc.)
│   ├── layouts/         # Layouts de la aplicación (DashboardLayout)
│   ├── pages/           # Páginas del playground (ComponentsPage)
│   ├── App.css          # Importaciones globales de temas Kumo CSS
│   ├── index.css        # Reset y estilos globales
│   └── main.tsx         # Punto de entrada de React
├── index.html           # Plantilla HTML principal
├── vite.config.ts       # Configuración de Vite + Tailwind
├── tsconfig.json        # Configuración de TypeScript
└── package.json         # Dependencias y scripts
```

---

## 🎨 UI Showcase y Componentes Kumo

El playground incluye ejemplos en vivo de uso e integración de:

- **Botones**: Variantes primarias, secundarias, ghost, destrucción y estados con íconos.
- **Formularios & Selección**: Inputs, Textareas, Selects, Checkboxes, Radio Groups y Switches.
- **Feedback & Navegación**: Breadcrumbs, Badges, Banners de alerta, Tooltips y Paginación.
- **Visualización de Datos**: LayerCards, Tablas de datos, Tabs navegables, Progress Meters, Skeletons y Avatares.

---

## 🤝 Guía para Colaboradores

1. Siempre crea una rama (*feature branch*) para tus cambios antes de enviarlos a `main`:
   ```bash
   git checkout -b feature/nombre-de-tu-rama
   ```
2. Asegúrate de verificar que el proyecto compila correctamente sin errores de TypeScript antes de hacer commit:
   ```bash
   npm run build
   ```
3. Haz un commit limpio y envía tu PR para revisión.
