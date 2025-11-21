# RBAC Implementation Analysis

## Summary

The RBAC system has been partially implemented. This document outlines what's working and what's missing.

## ✅ What's Implemented

### 1. Core RBAC Infrastructure

- **Database Tables**: `roles`, `permissions`, `role_permissions`, `user_roles`
- **Permission Functions**: `hasPermission()`, `getUserPermissions()`, `hasAnyPermission()`, `hasAllPermissions()`
- **Middleware**: `requireAuth()`, `requireAnyPermission()` in `src/middleware/withAuth.ts`
- **UI Components**: `PermissionGate`, `ProtectedRoute`, `RoleManager`

### 2. Protected API Routes

#### Export Routes (✓ Protected with `relatorios.export`)
- `/api/relatorios/export/conversas` - Requires `relatorios.export`
- `/api/relatorios/export/prospects` - Requires `relatorios.export`
- `/api/relatorios/export/metricas` - Requires `relatorios.export`

#### RBAC Management Routes (✓ Protected with `usuarios.manage`)
- `/api/rbac/roles` (GET, POST, PUT, DELETE) - Requires `usuarios.manage`
- `/api/rbac/permissions` - Requires `usuarios.manage`
- `/api/rbac/assign` - Requires `usuarios.manage`

#### User Permissions Route (✓ Protected - Auth only)
- `/api/rbac/user-permissions` - Requires authentication

### 3. Protected Pages

- `/dashboard/configuracoes/permissoes` - Protected with `ProtectedRoute` requiring `usuarios.manage`

## ❌ What's Missing

### 1. Unprotected API Routes

The following routes are **NOT protected** with RBAC middleware and should be:

#### Conversation Management Routes
- `/api/conversas/atribuir` - Should require `conversas:atribuir` or `conversas:atualizar`
- `/api/conversas/transferir` - Should require `conversas:atribuir`
- `/api/conversas/encerrar` - Should require `conversas:atualizar`
- `/api/conversas/reabrir` - Should require `conversas:atualizar`
- `/api/conversas/bloquear` - Should require `conversas:atualizar`
- `/api/conversas/marcar-lida` - Should require `conversas:ler`
- `/api/conversas/tags` - Should require `conversas:atualizar`
- `/api/conversas/anotacoes` - Should require `conversas:atualizar`
- `/api/conversas/buscar` - Should require `conversas:ler`

#### Dashboard Routes
- `/api/dashboard/stats` - Should require `metricas:ler`
- `/api/dashboard/charts` - Should require `metricas:ler`

#### Faculdades Routes
- `/api/faculdades` (POST) - Should require `faculdades:criar`
- `/api/faculdades/[id]` (PUT) - Should require `faculdades:atualizar`
- `/api/faculdades/[id]` (DELETE) - Should require `faculdades:deletar`

#### Mensagens Routes
- `/api/mensagens/agendar` - Should require `conversas:criar`
- `/api/whatsapp/send` - Should require `conversas:criar`

### 2. Permission Name Mismatch

The database uses colon notation (`conversas:ler`) but some code references use dot notation (`relatorios.export`). This needs to be standardized.

**Database permissions**:
```
conversas:criar, conversas:ler, conversas:atualizar, conversas:deletar, conversas:atribuir
prospects:criar, prospects:ler, prospects:atualizar, prospects:deletar
relatorios:ler, relatorios:exportar
```

**Code references**:
```
'relatorios.export' (should be 'relatorios:exportar')
'usuarios.manage' (should be 'usuarios:gerenciar' or similar)
```

### 3. Missing UI Permission Gates

The following UI elements should be wrapped with `PermissionGate`:

- Export buttons in `/app/dashboard/relatorios/page.tsx` - Currently visible to all, should require `relatorios:exportar`
- Faculdade management buttons - Should require appropriate `faculdades:*` permissions
- User management features - Should require `usuarios:*` permissions

### 4. Missing Tests

No automated tests exist for:
- Permission checking functions
- PermissionGate component
- ProtectedRoute component
- API route protection
- Role-based access scenarios

## 🔧 Recommended Fixes

### Priority 1: Fix Permission Name Inconsistency

1. Update all code to use colon notation (`:`) to match database
2. OR update database to use dot notation (`.`)
3. Ensure consistency across all files

### Priority 2: Add RBAC to Conversation Routes

Apply `requireAuth()` middleware to all conversation management routes:

```typescript
// Example for /api/conversas/atribuir/route.ts
import { requireAuth } from '@/middleware/withAuth'

export const POST = requireAuth(async (request: NextRequest, context) => {
  // ... existing code
}, 'conversas:atribuir')
```

### Priority 3: Add Permission Gates to UI

Wrap export buttons with PermissionGate:

```tsx
<PermissionGate permission="relatorios:exportar">
  <button onClick={() => handleExportar('pdf')}>
    Exportar PDF
  </button>
</PermissionGate>
```

### Priority 4: Create Automated Tests

Create test files:
- `__tests__/lib/rbac.test.ts` - Test permission functions
- `__tests__/components/PermissionGate.test.tsx` - Test UI component
- `__tests__/components/ProtectedRoute.test.tsx` - Test route protection
- `e2e/rbac.spec.ts` - End-to-end RBAC scenarios

## 📋 Testing Checklist

### Manual Testing Required

- [ ] Test admin user can access all features
- [ ] Test gerente user cannot access permission management
- [ ] Test atendente user cannot export reports
- [ ] Test permission gates hide/show UI elements correctly
- [ ] Test API routes return 403 for unauthorized users
- [ ] Test role switching updates permissions correctly

### Automated Testing Required

- [ ] Unit tests for RBAC functions
- [ ] Component tests for PermissionGate
- [ ] Component tests for ProtectedRoute
- [ ] E2E tests for complete user flows
- [ ] API integration tests for protected routes

## 🎯 Current Status

**Implementation Progress**: ~60%

- ✅ Core infrastructure (100%)
- ✅ Export route protection (100%)
- ✅ RBAC management protection (100%)
- ⚠️ Conversation route protection (0%)
- ⚠️ UI permission gates (20%)
- ❌ Automated tests (0%)
- ⚠️ Permission naming consistency (needs fix)
