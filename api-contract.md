# API Contract: Authentication & Security

This document defines the contract between the `inkdrop.app` (Frontend) and `inkdrop.api` (Backend) regarding authentication and security.

## 1. Security Mechanism
The application uses a combination of **Session Cookies** and **XSRF Tokens** for security.

*   **Authentication:** Handled via `CookieAuthenticationDefaults.AuthenticationScheme` (HttpOnly, Secure cookies).
*   **CSRF Prevention:** The backend expects an `X-XSRF-TOKEN` header on all mutating requests (POST, PUT, DELETE).

---

## 2. Endpoints

### 2.1 Get CSRF Token
Initializes the CSRF protection by setting the XSRF cookie.

- **URL:** `/api/auth/csrf`
- **Method:** `GET`
- **Auth:** `AllowAnonymous`
- **Response:** `200 OK`
- **Side Effect:** Sets a cookie named `XSRF-TOKEN` (HttpOnly: false).

### 2.2 Login
Authenticates the user and establishes a session.

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Auth:** `AllowAnonymous`
- **Headers:** `X-XSRF-TOKEN: <value_from_xsrf_cookie>`
- **Request Body (`LoginRequest`):**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Responses:**
    - `200 OK`: Returns user summary and sets the authentication session cookie.
    - `400 Bad Request`: Invalid credentials or validation errors.

### 2.3 Get Current User
Validates the current session and retrieves user profile.

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Auth:** `Authorize` (Requires Session Cookie)
- **Response:** `200 OK`
- **Response Body:**
  ```json
  {
    "id": "Guid",
    "username": "string",
    "email": "string",
    "role": "string"
  }
  ```
- **Responses:**
    - `401 Unauthorized`: Session expired or invalid.

### 2.4 Logout
Terminates the user session.

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Auth:** `Authorize` (Requires Session Cookie)
- **Headers:** `X-XSRF-TOKEN: <value_from_xsrf_cookie>`
- **Response:** `200 OK`
- **Side Effect:** Clears the authentication session cookie.

---

## 3. Frontend Implementation Requirements
1. **Handshake:** The app must call `/api/auth/csrf` before any login attempt.
2. **Interceptor:** An `HttpInterceptor` must be implemented to read the `XSRF-TOKEN` cookie and attach it as the `X-XSRF-TOKEN` header for all `POST`, `PUT`, and `DELETE` requests.
3. **Session Restoration:** On application bootstrap, a call to `/api/auth/me` must be made to determine if the user is already authenticated.
