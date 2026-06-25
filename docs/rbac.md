# Role-Based Access Control (RBAC) Specification

To enforce security-first standards, QueryGenAI utilizes strict role-based access control. All requests target specific functional access limits mapped to distinct user roles.

---

## 1. Role Definitions

| Role | Scope | Description |
| :--- | :--- | :--- |
| **Admin** | Global system configuration and security settings. | Can manage schema metadata definitions, adjust system environment variables, monitor tenant query metrics, and configure authorization groups. |
| **Developer**| Code development and query design. | Can create query histories, view schema architectures, execute validation tools, and run schema configuration scopes. |
| **Viewer** | Standard user operation. | Can run natural-language-to-SQL conversions, access their own personal request logs, and view schemas. Cannot perform deletions or configure system metadata. |

---

## 2. Permissions Registry

| Permission | Identifier | Description |
| :--- | :--- | :--- |
| **Generate SQL** | `queries:generate` | Ability to submit NLP requests and execute prompt completions. |
| **Read Own History** | `queries:read_own` | Ability to view personal API query logs. |
| **Read All History**| `queries:read_all` | Ability to monitor system-wide logs for audit or metrics tracking. |
| **Write Schemas** | `schemas:write` | Ability to create or update schema definitions. |
| **Delete Schemas**| `schemas:delete` | Ability to purge metadata definitions. |
| **Manage Users** | `users:manage` | Ability to adjust roles or disable accounts. |

---

## 3. Access Matrix

The following matrix maps user roles to specific permission keys:

| Permission | Viewer | Developer | Admin |
| :--- | :---: | :---: | :---: |
| `queries:generate` | ✅ | ✅ | ✅ |
| `queries:read_own` | ✅ | ✅ | ✅ |
| `queries:read_all` | ❌ | ✅ | ✅ |
| `schemas:write` | ❌ | ✅ | ✅ |
| `schemas:delete` | ❌ | ❌ | ✅ |
| `users:manage` | ❌ | ❌ | ✅ |

---

## 4. Middleware Enforcement Pattern

Security rules are validated directly within backend routers using role validator middlewares.

**Example Express middleware routing structure:**

```javascript
import { protect } from '../middleware/auth.js';
import { checkRole } from '../middleware/rbac.js';

// Route definition mapping roles
router.post(
  '/schemas',
  protect,
  checkRole(['Admin', 'Developer']),
  createSchemaController
);
```
