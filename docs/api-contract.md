# REST API Contract Specification

All endpoints are prefixed with `/api/v1`. Communication is performed strictly via JSON over HTTPS.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Password must be at least 8 characters long and contain one number."
}
```

**Error Response (409 Conflict):**
```json
{
  "error": "Conflict",
  "message": "Email is already registered."
}
```

---

### `POST /api/v1/auth/login`
Authenticates a user and returns a JSON Web Token (JWT).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "user@example.com",
    "role": "Developer"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid email or password."
}
```

---

## 2. Query Generation Endpoints

### `POST /api/v1/queries/generate`
Generates a validated SQL query from a natural language prompt. Requires JWT Authentication.

**Request Body:**
```json
{
  "prompt": "Get all active users who registered in the last 7 days."
}
```

**Success Response (200 OK):**
```json
{
  "queryId": "3cc55c0e-436f-4aeb-beba-447551cc37bd",
  "prompt": "Get all active users who registered in the last 7 days.",
  "generatedSql": "SELECT * FROM users WHERE is_active = true AND created_at >= NOW() - INTERVAL '7 days';",
  "isValid": true,
  "executionExplanation": "Selects columns from 'users' table filtering for rows where 'is_active' is true and 'created_at' falls in the last 7 days."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Bad Request",
  "message": "Prompt cannot be empty."
}
```

**Error Response (422 Unprocessable Entity - SQL Validation Failure):**
```json
{
  "error": "SQL Validation Failure",
  "message": "The generated SQL failed semantic validation against stored schemas.",
  "details": {
    "rawSql": "SELECT * FROM non_existent_table WHERE active = true;",
    "reason": "Table 'non_existent_table' does not exist."
  }
}
```

---

## 3. History Endpoints

### `GET /api/v1/queries/history`
Retrieves past generation request logs. Supports pagination. Requires JWT Authentication.

**Headers:**
`Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "3cc55c0e-436f-4aeb-beba-447551cc37bd",
      "prompt": "Get all active users who registered in the last 7 days.",
      "generatedSql": "SELECT * FROM users WHERE is_active = true AND created_at >= NOW() - INTERVAL '7 days';",
      "isValid": true,
      "createdAt": "2026-06-25T18:10:17Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 4. Database Schema Endpoints

### `POST /api/v1/schemas`
Registers metadata representing a database table schema. Requires JWT and Admin or Developer role.

**Headers:**
`Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tableName": "users",
  "description": "Stores user profiles and activation states.",
  "columns": [
    {
      "name": "id",
      "dataType": "UUID",
      "isNullable": false,
      "description": "Primary key identifier"
    },
    {
      "name": "is_active",
      "dataType": "BOOLEAN",
      "isNullable": false,
      "description": "Activation indicator toggling system access"
    }
  ]
}
```

**Success Response (221 Created):**
```json
{
  "message": "Database schema registered successfully",
  "schemaId": "65b90f42-491c-43f1-b8be-568b6b158fe2"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Forbidden",
  "message": "Access denied. You do not have permissions to manage schemas."
}
```

---

## 5. Health Check

### `GET /api/v1/health`
Returns the status parameter representing health of the API server and connection adapters.

**Success Response (200 OK):**
```json
{
  "status": "UP",
  "timestamp": "2026-06-25T18:10:17.930Z",
  "service": "QueryGenAI Backend"
}
```
