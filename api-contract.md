# API Contract: Inkdrop Management System

This document defines the full contract between the `inkdrop.app` (Frontend) and `inkdrop.api` (Backend).

## 1. Security & Authentication

### 1.1 Security Mechanism
- **Session**: Managed via HttpOnly Secure Cookies.
- **CSRF Protection**: Mandatory `X-XSRF-TOKEN` header for all mutating requests.
- **Auth Flow**: `/api/auth/csrf` (Handshake) $\rightarrow$ `/api/auth/login` (Auth) $\rightarrow$ `/api/auth/me` (Sync).

### 1.2 Auth Endpoints
| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/csrf` | `GET` | Anon | Sets XSRF cookie. |
| `/api/auth/login` | `POST` | Anon | Authenticates user and sets session. |
| `/api/auth/me` | `GET` | User | Returns current user profile. |
| `/api/auth/logout` | `POST` | User | Destroys session. |

**User Profile Response:**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "role": 0 | 1 | "Admin" | "Technician",
  "isActive": boolean,
  "createdAt": "ISO8601"
}
```

---

## 2. User Management
**Base URL:** `/api/user`

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | Admin | - | List all users. |
| `/` | `POST` | Admin | `IUserCreateRequest` | Create new user. |
| `/{id}` | `PUT` | Admin | `IUserUpdateRequest` | Update user profile. |
| `/{id}` | `DELETE` | Admin | - | Delete user. |
| `/{id}/activate` | `PATCH` | Admin | - | Set `isActive: true`. |
| `/{id}/deactivate` | `PATCH` | Admin | - | Set `isActive: false`. |

---

## 3. Printer Fleet
**Base URL:** `/api/printer`

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | User | - | List all printers with telemetry. |
| `/` | `POST` | Admin | `IPrinterCreateRequest` | Add new printer. |
| `/{id}` | `PUT` | Admin | `IPrinterUpdateRequest` | Update printer details. |
| `/{id}` | `DELETE` | Admin | - | Remove printer from fleet. |

**Printer Response includes:**
- `telemetry`: { `toners`: [ { `color`: string, `level`: number } ], `pages`: number, `monoPages`: number, `colorPages`: number }

---

## 4. Toner Inventory
**Base URL:** `/api/toner`

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | User | - | List all toner models. |
| `/low` | `GET` | User | Query: `threshold=N` | List toners with low quantity. |
| `/` | `POST` | Admin | `ITonerCreateRequest` | Add new toner model. |
| `/{id}` | `PUT` | Admin | `ITonerUpdateRequest` | Update toner info. |
| `/{id}` | `DELETE` | Admin | - | Remove toner model. |

---

## 5. Location Management
**Base URL:** `/api/location`

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | User | - | List all locations. |
| `/` | `POST` | Admin | `ILocationCreateRequest` | Create new location. |
| `/{id}` | `PUT` | Admin | `ILocationUpdateRequest` | Update location. |
| `/{id}` | `DELETE` | Admin | - | Delete location. |

---

## 6. Movement Tracking
**Base URL:** `/api/movements`

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | User | - | List all movements (Audit log). |
| `/` | `POST` | User | `IMovementRequest` | Register a toner move. |

**Movement Request:**
```json
{
  "tonerId": "string",
  "printerId": "string (optional)",
  "quantity": number,
  "description": "string",
  "type": "in" | "out"
}
```

---

## 7. System Settings
**Base URL:** `/api/ApiKey` and `/api/user/me`

| Endpoint | Method | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/ApiKey` | `GET` | Admin | - | List active API keys. |
| `/api/ApiKey` | `POST` | Admin | `ApiKeyRequest` | Generate new API key. |
| `/api/ApiKey/{id}` | `PUT` | Admin | `ApiKeyUpdateRequest` | Rename API key. |
| `/api/ApiKey/{id}` | `DELETE` | Admin | - | Revoke API key. |
| `/api/user/me/password` | `PATCH` | User | `ChangePasswordPayload` | Change own password. |

---

## 🛠️ Implementation Notes
1. **Error Handling**: The API returns `400 Bad Request` for validation errors, including a detailed error list in the response body.
2. **Role Validation**: The backend strictly enforces Admin roles for all mutating endpoints (except movements and password change).
3. **Data Types**: All IDs are UUIDs (string). Dates are returned in ISO8601 format.
