# 🖨️ Inkdrop App

**Frontend** for a Toner Control system — manage toners, printers, locations, and movements from a single dashboard. The backend is a separate repository and must be running for the app to work.

---

## 📖 About the project

This repository contains only the **frontend** (Angular SPA). It talks to a REST API for data; the **backend is in another repo** and must be deployed or run locally for full functionality.

### ✨ Features

- **Dashboard** — KPIs (toners in stock, low toners, active printers, movements today), recent movements list, and quick actions
- **Toners** — Manage toners (list, create, edit, delete)
- **Printers** — Manage printers (list, create, edit, delete)
- **Locations** — Manage locations (list, create, edit, delete)
- **Movements** — Record in/out movements and view history (list, create)

---

## 🛠 Stack

| Area        | Technology |
|------------|------------|
| Framework  | Angular 21 |
| UI         | Angular Material (Material 3) |
| Layout / CDK | Angular CDK |
| Styling    | Tailwind CSS 4, SCSS |
| Language   | TypeScript 5.9 |
| State / Data | RxJS, Angular signals |
| Package manager | npm |

---

## 🚀 Clone and run locally

### 📋 Prerequisites

- **Node.js** (v18 or v20 recommended)
- **npm** (v9+)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/codebyallan/inkdrop.app.git
cd inkdrop.app
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure the API base URL

Set the backend URL for your environment:

- **Development:** edit `src/environments/environment.development.ts` and set `BASE_URL` to your API base (e.g. `http://localhost:5109/api`).
- **Production:** set `BASE_URL` in `src/environments/environment.ts` for production builds.

Example:

```ts
// src/environments/environment.development.ts
export const environment = { BASE_URL: 'http://localhost:5109/api' };
```

### 4️⃣ Start the development server

```bash
npm start
```

Or:

```bash
ng serve
```

Open **http://localhost:4200/** in your browser. The app will hot-reload when you change the code.

### 📦 Build for production

```bash
npm run build
```

Output is generated under `dist/`.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

- ✅ You may **use** and **modify** the software.
- ✅ You may distribute original or modified versions.
- ❌ You **may not** make the project or derivatives **proprietary/closed source** — derivative works must be released under the same GPL-3.0 and remain open source.

See the [LICENSE](LICENSE) file for the full text.
