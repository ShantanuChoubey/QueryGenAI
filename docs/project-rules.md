# QueryGenAI Permanent Engineering Rules

The following rules represent permanent engineering principles for QueryGenAI. They are non-negotiable guidelines that all developers must comply with when modifying or extending this codebase.

---

## 1. Security & Keys Management

> [!CAUTION]
> **Rule 1: Never expose API keys, database credentials, or secret tokens.**
> - All secret values must be injected dynamically via environment variables (`process.env`).
> - Real keys must never be hardcoded or checked into Git. Always maintain clean `.env.example` templates matching any new config parameters.

---

## 2. LLM Data Privacy

> [!IMPORTANT]
> **Rule 2: Never send database records or row contents to the LLM.**
> - Protect user data privacy. The prompt builder may only send *sanitized structural metadata* (table layouts, column types, column descriptions).
> - Never include output row items, parameters, or individual records inside prompts.

---

## 3. SQL Query Validation

> [!WARNING]
> **Rule 3: Always validate generated SQL query strings before returning them.**
> - SQL returned by the LLM is untrusted code. Pass all queries through AST syntax parsers first.
> - Ensure all queries are strictly read-only (`SELECT`). Immediately block and log queries containing destructive commands (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, etc.).

---

## 4. Authorization & Security Context

> [!IMPORTANT]
> **Rule 4: Execute role-based access control (RBAC) validations before performing query operations.**
> - All generation or administration endpoints must pass through auth filters verifying valid JWT signatures.
> - Map permissions to specific roles (Admin, Developer, Viewer) before executing query pipelines.

---

## 5. Token Efficiency & Optimizations

> [!TIP]
> **Rule 5: Keep system prompt models token-efficient.**
> - Limit database metadata mapping to only target tables relevant to the context of the user request.
> - Keep system prompts concise and structured to avoid unnecessary API token consumption and control costs.

---

## 6. Simplicity & Minimalist Engineering

> [!NOTE]
> **Rule 6: Avoid over-engineering.**
> - Prioritize simple solutions over complex configurations.
> - Avoid introducing external libraries, compilers, or modules unless absolutely required to resolve a functional need.

---

## 7. Synchronization & Integration

> [!NOTE]
> **Rule 7: Frontend and backend configurations must remain synchronized.**
> - Ensure API route changes in backend controllers are immediately updated in the Axios service clients.
> - Keep TypeScript / JavaScript schema and validation definitions synchronized using the workspace-shared module folder (`/shared`).

---

## 8. Production Coding Standards

> [!NOTE]
> **Rule 8: Follow production coding standards.**
> - All source files must validate against the configured ESLint settings with zero errors.
> - Maintain code styling parameters via Prettier formatting checks prior to commit hooks.
> - Keep error handlers structured (always return normalized JSON errors and correct HTTP status codes).
