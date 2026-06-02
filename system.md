# System Architecture & Guidelines - Inkdrop App

This document serves as the single source of truth for the architectural standards and development guidelines of the Inkdrop application.

## 🚀 Core Tech Stack
- **Framework**: Angular 21+ (Standalone Components)
- **Reactivity**: Angular Signals (`signal`, `computed`, `input`, `output`)
- **State Management**: Service-based state using Signals (SWR Pattern)
- **Styling**: Tailwind CSS (Layout/Grid) + Angular Material 3 (UI Components & Theming)
- **Language**: TypeScript (Strict Mode)

## 📐 Architectural Rules

### 1. Component Development
- **Standalone**: All components must be `standalone: true`.
- **Performance**: `ChangeDetectionStrategy.OnPush` is mandatory for every component to minimize change detection cycles.
- **Control Flow**: Use the new built-in syntax:
  - `@if` instead of `*ngIf`
  - `@for` instead of `*ngFor`
  - `@switch` instead of `*ngSwitch`
- **Reactivity**: 
  - Use `input()` for properties (instead of `@Input()`).
  - Use `output()` for events (instead of `@Output()`).
  - Use `computed()` for any derived state.
  - Use `signal()` for local mutable state.

### 2. Type System & Safety
- **Zero Any**: The use of `any` is strictly forbidden. Use Generics `<T>` or specific types.
- **Centralization**: All interfaces and types must reside in `src/app/types/`.
- **Naming**: Type files must follow the `.type.ts` suffix (e.g., `user.type.ts`).
- **Role Management**: `UserRole` is a union of numeric literals and labels (`0 | 1 | 'Admin' | 'Technician'`) to support both API responses and UI labels.

### 3. Styling & Theming
- **Material 3 Tokens**: Do not use hardcoded hex colors in components. Use Material system variables:
  - Backgrounds: `var(--mat-sys-surface)`, `var(--mat-sys-surface-variant)`
  - Primary: `var(--mat-sys-primary)`, `var(--mat-sys-on-primary)`
  - Error: `var(--mat-sys-error)`, `var(--mat-sys-error-container)`
  - Success: `var(--mat-sys-success)`, `var(--mat-sys-success-container)`
- **Tailwind**: Use Tailwind exclusively for layout, spacing, and grid systems. Do not use Tailwind for theme-dependent colors.

### 4. Naming Conventions
- Components: `*.component.ts`, `*.component.html`, `*.component.scss`
- Services: `*.service.ts`
- Types: `*.type.ts`
- Guards: `*.guard.ts`
- Interceptors: `*.interceptor.ts`

## 🔒 Security & Auth Flow
- **Authentication**: Cookie-based session management.
- **CSRF Protection**: Mandatory handshake via `/api/auth/csrf` before mutating requests.
- **Interception**: `xsrfInterceptor` handles the inclusion of the XSRF token in all requests.
- **Authorization**: Role-based access control (RBAC) implemented via `AuthGuard` and `isAdmin` computed signal.

## 📦 Folder Structure
- `src/app/core`: Singletons, interceptors, guards, and global services.
- `src/app/shared`: Generic reusable components (e.g., `UiTableComponent`).
- `src/app/features`: Feature-based modules (e.g., `user`, `printer`, `toner`).
- `src/app/types`: All TypeScript interfaces and type definitions.
