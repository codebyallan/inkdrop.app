# 🖋️ Inkdrop App - Printer Fleet & Toner Management

![Angular](https://img.shields.io/badge/Angular-v21+-DD0031?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)
![Material Design 3](https://img.shields.io/badge/Material-Design_3-blue?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

Inkdrop is a high-performance corporate solution designed for monitoring and managing printer fleets and toner inventories. The system transforms raw telemetry data into operational intelligence, allowing managers to anticipate toner replacements and optimize distribution logistics.

---

## 🚀 Core Features

### 📊 Operational Dashboard (Command Center)
- **Risk KPIs**: Real-time indicators for critical replacements (toners < 1%) and attention (toners < 5%).
- **Fleet Health Score**: Dynamic percentage of fleet health based on overall supply levels.
- **"Replace Now" Widget**: Intelligent list of urgent replacements with CMYK visual color-coding.
- **Activity Feed**: Chronological timeline of supply movements with Entry/Exit visual indicators.

### 📦 Toner & Inventory Management
- **Stock Control**: Centralized management of models, colors, and quantities.
- **Low Stock Alerts**: Automatic identification of models with critically low units.
- **Standardized Coloring**: CMYK-compliant visual identification across the entire app.

### 🖨️ Printer Monitoring
- **Real-time Telemetry**: Direct visualization of toner levels and printer metadata.
- **Geographic Mapping**: Association of printers with specific company locations for logistics optimization.
- **Connectivity Tracking**: Online/Offline status monitoring.

### 🔄 Movement Tracking & Audit
- **Transaction Logs**: Full history of every toner movement (In/Out).
- **Audit Trail**: Detailed traceability to prevent supply loss and track consumption patterns.

### 👥 User Administration (RBAC)
- **Role-Based Access**: Strict differentiation between **Administrators** (full system control) and **Technicians** (operational tasks).
- **Profile Management**: User activation, deactivation, and privilege escalation.

---

## 🛠️ Engineering & Architecture

### ⚡ Performance Strategy
- **Angular Signals**: Fully reactive architecture using `signal`, `computed`, `input`, and `output`, eliminating `Zone.js` overhead.
- **SWR Pattern (Stale-While-Revalidate)**: Intelligent caching layer in services. Data is served instantly from the cache while updated in the background.
- **OnPush Strategy**: Mandatory `ChangeDetectionStrategy.OnPush` across all components to ensure minimum re-renders.

### 🎨 UI/UX Standards
- **Material Design 3**: Implementation of a professional design system using M3 tokens.
- **Dynamic Theming**: Native support for Light and Dark Mode via CSS System Variables (`var(--mat-sys-*)`).
- **Utility-First Layout**: Tailwind CSS used exclusively for responsive grids and structural layout.

### 🔒 Security Architecture
- **Authentication**: Secure cookie-based session management.
- **CSRF Protection**: Mandatory XSRF handshake. The app performs a request to `/api/auth/csrf` to establish a secure session before any mutating operation (POST, PUT, DELETE).
- **Intercepted Requests**: `xsrfInterceptor` automatically manages token inclusion in all HTTP calls.

---

## 📂 Project Organization

```text
src/app/
├── core/                # Singletons, guards, interceptors (The app's foundation)
├── shared/              # Generic reusable components (e.g., UiTable, ValidationMessage)
├── features/            # Domain-driven feature modules
│   ├── auth/            # Login, session, and CSRF handshake
│   ├── dashboard/       # Main operational cockpit
│   ├── printer/         # Printer fleet & telemetry
│   ├── toner/           # Inventory & stock control
│   ├── location/        # Geographic layout
│   ├── movement/        # Supply flow tracking
│   └── user/            # RBAC & user management
└── types/               # Centralized TypeScript interfaces (Single source of truth)
```

---

## ⚙️ Setup & Development

### Prerequisites
- Node.js LTS
- npm / yarn

### Installation
1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd inkdrop.app
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Environment Configuration:
   Set the required environment variables in your system and run:
   \`\`\`bash
   npm run set-env
   \`\`\`

4. Development Server:
   \`\`\`bash
   npm run start
   \`\`\`

### Production Build
To generate a highly optimized production bundle:
\`\`\`bash
npm run build
\`\`\`

---

## 📖 Documentation & Standards

- **API Contract**: For detailed endpoint specifications, refer to `api-contract.md`.
- **Architectural Guidelines**: For coding standards and rules, refer to `system.md`.

### Contribution Rules
- **No `any`**: Use strict TypeScript interfaces.
- **Signal-First**: Prefer `computed()` over manual state updates.
- **Design Tokens**: Never use hardcoded hex colors; always use `var(--mat-sys-*)`.
- **Modern Syntax**: Use `@if` and `@for` exclusively.

---

## 📜 License
Proprietary license of Inkdrop. All rights reserved.
