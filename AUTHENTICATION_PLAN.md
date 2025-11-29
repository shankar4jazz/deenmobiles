# Authentication System Implementation Plan

## 🎯 Epic: Username + Password Login System

Enable secure, role-based login for all user types with JWT-based authentication, refresh tokens, remember-me functionality, and account security features.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema Updates](#database-schema-updates)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Security Considerations](#security-considerations)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Phases](#implementation-phases)

---

## Overview

### Goals
- Secure username/password authentication
- Role-based access control (RBAC)
- JWT access tokens + refresh tokens
- Remember-me functionality
- Account lockout after failed attempts
- Multi-tenant access (company_id + branch_id)

### User Roles
1. **SUPER_ADMIN** - Platform-wide access
2. **ADMIN** - Company-level access
3. **MANAGER** - Branch-level access
4. **TECHNICIAN** - Task-level access
5. **RECEPTIONIST** - Task-level access

---

## User Stories & Acceptance Criteria

### Story 1: Common Login Flow

**As a** user (any role)
**I want to** log in with my username and password
**So that** I can securely access my account and dashboard

**Acceptance Criteria:**
- ✅ Login form accepts username/email and password
- ✅ Valid credentials return JWT access token + refresh token
- ✅ Tokens contain: user_id, email, role, company_id, branch_id
- ✅ Access token stored in memory (React state)
- ✅ Refresh token stored as httpOnly cookie
- ✅ 5 invalid attempts → account lock for 15 minutes
- ✅ "Remember me" extends session (30 days vs 1 day)
- ✅ On success, redirect to role-appropriate dashboard
- ✅ Display loading state during authentication
- ✅ Show error messages for invalid credentials

### Story 2: Super Admin Login

**As a** Super Admin
**I want to** log in and access the platform dashboard
**So that** I can manage all companies and system settings

**Acceptance Criteria:**
- ✅ Redirect to `/super-admin/dashboard` after login
- ✅ Sidebar shows: Companies, Plans, Billing, Usage
- ✅ Auth middleware validates `role === SUPER_ADMIN`
- ✅ Can view all companies and branches
- ✅ No company_id/branch_id restrictions

### Story 3: Company Admin Login

**As a** Company Admin
**I want to** log in and manage my company
**So that** I can oversee branches and operations

**Acceptance Criteria:**
- ✅ Redirect to `/admin/home` after login
- ✅ Token includes `company_id`
- ✅ UI shows branch switcher
- ✅ Access restricted to own company data
- ✅ Can view all branches within company
- ✅ Sidebar shows: Dashboard, Branches, Users, Services, Reports

### Story 4: Branch Manager Login

**As a** Branch Manager
**I want to** log in and manage my branch
**So that** I can handle branch operations

**Acceptance Criteria:**
- ✅ Redirect to `/manager/home` after login
- ✅ Token includes `company_id` + `branch_id`
- ✅ Access limited to assigned branch
- ✅ Can manage branch users and services
- ✅ Sidebar shows: Dashboard, Services, Customers, Inventory, Reports

### Story 5: Employee/Technician Login

**As a** Technician/Receptionist
**I want to** log in and see my assigned tasks
**So that** I can complete my work

**Acceptance Criteria:**
- ✅ Redirect to `/dashboard` after login
- ✅ Token includes `company_id` + `branch_id`
- ✅ Access restricted to assigned tasks
- ✅ Can view and update assigned services
- ✅ Sidebar shows: My Tasks, Services, Customers

---

## Technical Architecture

### Authentication Flow

```
┌─────────────┐
│ Login Page  │
└──────┬──────┘
       │
       │ 1. Enter username + password
       │ 2. Click Login
       │
       ▼
┌─────────────────────────────────┐
│ POST /api/v1/auth/login         │
│ {                               │
│   username: "admin@example.com" │
│   password: "password123",      │
│   rememberMe: true              │
│ }                               │
└──────────┬──────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Backend Validation               │
│ 1. Check user exists             │
│ 2. Verify account active         │
│ 3. Check failed attempts < 5     │
│ 4. Compare bcrypt hash           │
│ 5. Reset failed attempts to 0    │
└──────────┬───────────────────────┘
           │
           ▼
      ┌────┴────┐
      │ Valid?  │
      └────┬────┘
           │
    ┌──────┴──────┐
    │             │
   Yes           No
    │             │
    ▼             ▼
┌────────┐   ┌─────────────┐
│ Issue  │   │ Increment   │
│ Tokens │   │ Failed      │
└───┬────┘   │ Attempts    │
    │        │ Return 401  │
    │        └─────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Response:                   │
│ {                           │
│   accessToken: "jwt...",    │
│   refreshToken: "jwt...",   │
│   user: {                   │
│     id, email, name, role,  │
│     companyId, branchId     │
│   }                         │
│ }                           │
│                             │
│ Set-Cookie: refreshToken=   │
│   httpOnly, secure, sameSite│
└──────────┬──────────────────┘
           │
           ▼
┌──────────────────────────┐
│ Frontend:                │
│ 1. Store accessToken     │
│ 2. Store user in Zustand │
│ 3. Redirect by role      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Role-Based Redirect:     │
│ SUPER_ADMIN → /super-    │
│   admin/dashboard        │
│ ADMIN → /admin/home      │
│ MANAGER → /manager/home  │
│ TECHNICIAN/RECEPTIONIST  │
│   → /dashboard           │
└──────────────────────────┘
```

### Token Structure

**Access Token (JWT - 15 minutes)**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "MANAGER",
  "companyId": "uuid",
  "branchId": "uuid",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token (JWT - 7 days or 30 days with remember-me)**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "tokenId": "uuid",
  "iat": 1234567890,
  "exp": 1235172690
}
```

---

## Database Schema Updates

### Current Schema (Already Implemented)
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String   // bcrypt hashed
  name         String
  role         UserRole
  companyId    String
  branchId     String?
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

### Required Schema Updates

**Add to User model:**
```prisma
model User {
  // ... existing fields
  failedLoginAttempts Int      @default(0)
  accountLockedUntil  DateTime?
  lastFailedLoginAt   DateTime?
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_account_security_fields
```

---

## Backend Implementation

### Phase 1: Core Authentication Services

#### 1.1 Auth Service (`backend/src/services/authService.ts`)

```typescript
Features:
- login(email, password, rememberMe)
- register(userData)
- refreshAccessToken(refreshToken)
- logout(userId, refreshToken)
- validateToken(token)
- resetFailedAttempts(userId)
- incrementFailedAttempts(userId)
- isAccountLocked(user)
```

#### 1.2 Token Service (`backend/src/services/tokenService.ts`)

```typescript
Features:
- generateAccessToken(payload)
- generateRefreshToken(payload)
- verifyAccessToken(token)
- verifyRefreshToken(token)
- revokeRefreshToken(tokenId)
- cleanupExpiredTokens()
```

#### 1.3 Password Service (`backend/src/utils/password.ts`)

```typescript
Features:
- hashPassword(password)
- comparePassword(password, hash)
- validatePasswordStrength(password)
```

### Phase 2: Auth Controllers

#### 2.1 Auth Controller (`backend/src/controllers/authController.ts`)

**Endpoints:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Phase 3: Middleware

#### 3.1 Auth Middleware (`backend/src/middleware/auth.ts`)

```typescript
Features:
- authenticate() - Verify JWT token
- authorize(...roles) - Check user role
- multitenantFilter() - Add company/branch filters
```

#### 3.2 Rate Limiting Middleware

```typescript
Features:
- loginRateLimit - 5 attempts per 15 min per IP
- apiRateLimit - 100 requests per 15 min
```

### Phase 4: Routes

#### 4.1 Auth Routes (`backend/src/routes/authRoutes.ts`)

```typescript
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginRateLimit, validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);
```

### Phase 5: Validation Schemas

#### 5.1 Login Schema
```typescript
{
  email: required, email format
  password: required, min 6 chars
  rememberMe: optional, boolean
}
```

#### 5.2 Register Schema
```typescript
{
  email: required, email format, unique
  password: required, min 8 chars, strong
  name: required, min 2 chars
  phone: optional
  role: required, enum
  companyId: required, uuid
  branchId: optional, uuid
}
```

---

## Frontend Implementation

### Phase 1: Authentication State Management

#### 1.1 Auth Store (`frontend/src/store/authStore.ts`)

```typescript
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login(email, password, rememberMe): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
  setUser(user): void;
  clearError(): void;
}
```

### Phase 2: API Services

#### 2.1 Auth API (`frontend/src/services/authApi.ts`)

```typescript
Features:
- login(credentials)
- logout()
- refreshToken()
- getCurrentUser()
- register(userData)
```

### Phase 3: UI Components

#### 3.1 Login Page (`frontend/src/pages/Login.tsx`)

**Features:**
- Email/username input with validation
- Password input with show/hide toggle
- Remember me checkbox
- Form validation (client-side)
- Loading state during authentication
- Error display
- Forgot password link
- Responsive design (mobile + desktop)

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         [Logo]                  │
│   Service Management System     │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Login                     │ │
│  │                           │ │
│  │ Email/Username            │ │
│  │ [__________________]      │ │
│  │                           │ │
│  │ Password                  │ │
│  │ [__________________] [👁] │ │
│  │                           │ │
│  │ [✓] Remember me           │ │
│  │                           │ │
│  │ [     Login Button     ]  │ │
│  │                           │ │
│  │ Forgot password?          │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

#### 3.2 Protected Route Component

```typescript
<ProtectedRoute
  allowedRoles={['ADMIN', 'MANAGER']}
  requireCompany={true}
  requireBranch={true}
>
  <Dashboard />
</ProtectedRoute>
```

#### 3.3 Dashboard Layout Component

**Features:**
- Navbar with user info
- Role badge
- Branch/company switcher (if applicable)
- Logout button
- Dynamic sidebar based on role
- Responsive mobile menu

### Phase 4: Role-Based Dashboards

#### 4.1 Super Admin Dashboard
- Path: `/super-admin/dashboard`
- Sidebar: Companies, Plans, Billing, Usage, Settings

#### 4.2 Admin Dashboard
- Path: `/admin/home`
- Sidebar: Dashboard, Branches, Users, Services, Inventory, Reports, Settings

#### 4.3 Manager Dashboard
- Path: `/manager/home`
- Sidebar: Dashboard, Services, Customers, Inventory, Reports, Settings

#### 4.4 Employee Dashboard
- Path: `/dashboard`
- Sidebar: My Tasks, Services, Customers, Profile

---

## Security Considerations

### 1. Password Security
- ✅ Bcrypt hashing with salt rounds = 10
- ✅ Minimum 8 characters
- ✅ Password strength validation (optional)
- ✅ No password in logs or error messages

### 2. Token Security
- ✅ Access token: short-lived (15 min)
- ✅ Refresh token: httpOnly cookie, secure flag
- ✅ JWT secret from environment variables
- ✅ Token revocation on logout
- ✅ Refresh token rotation (optional enhancement)

### 3. Account Security
- ✅ Failed login attempt tracking
- ✅ Account lockout after 5 failed attempts
- ✅ 15-minute lockout duration
- ✅ IP-based rate limiting

### 4. API Security
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS prevention

### 5. Multi-Tenant Security
- ✅ Company/branch isolation in queries
- ✅ Middleware enforces tenant filters
- ✅ Role-based access control
- ✅ No cross-tenant data leakage

---

## Testing Strategy

### Backend Tests

**Unit Tests:**
- Password hashing/comparison
- Token generation/validation
- Failed attempt logic
- Account lockout logic

**Integration Tests:**
- Login endpoint (success/failure)
- Logout endpoint
- Refresh token endpoint
- Protected route access

**Security Tests:**
- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting

### Frontend Tests

**Component Tests:**
- Login form validation
- Error message display
- Loading states
- Password toggle

**Integration Tests:**
- Login flow (E2E)
- Token refresh flow
- Logout flow
- Protected route redirection

---

## Implementation Phases

### Phase 1: Backend Foundation (Tasks 1-6)
**Estimated Time: 3-4 hours**

1. ✅ Add database schema updates (failed attempts, account lock)
2. ✅ Create password utility functions
3. ✅ Create token service (JWT generation/validation)
4. ✅ Create auth service (login, logout, refresh)
5. ✅ Create auth middleware (authenticate, authorize)
6. ✅ Create rate limiting middleware

### Phase 2: Backend API (Tasks 7-10)
**Estimated Time: 2-3 hours**

7. ✅ Create validation schemas (login, register)
8. ✅ Create auth controller
9. ✅ Create auth routes
10. ✅ Integrate with main Express app

### Phase 3: Frontend Foundation (Tasks 11-14)
**Estimated Time: 2-3 hours**

11. ✅ Update auth store (Zustand)
12. ✅ Create auth API service
13. ✅ Update API interceptor (token refresh)
14. ✅ Create ProtectedRoute component

### Phase 4: Frontend UI (Tasks 15-18)
**Estimated Time: 4-5 hours**

15. ✅ Create Login page component
16. ✅ Create form validation
17. ✅ Create password toggle component
18. ✅ Add error handling & loading states

### Phase 5: Dashboards (Tasks 19-22)
**Estimated Time: 3-4 hours**

19. ✅ Create Dashboard layout component
20. ✅ Create role-based sidebar navigation
21. ✅ Create Super Admin dashboard
22. ✅ Create Admin/Manager/Employee dashboards

### Phase 6: Testing & Refinement (Tasks 23-25)
**Estimated Time: 2-3 hours**

23. ✅ Test all authentication flows
24. ✅ Test role-based access
25. ✅ Fix bugs and refine UX

---

## Success Criteria

### Functional Requirements
- ✅ Users can log in with username/password
- ✅ JWT tokens issued and validated
- ✅ Refresh token mechanism works
- ✅ Remember-me extends session
- ✅ Account lockout after failed attempts
- ✅ Role-based dashboard routing
- ✅ Multi-tenant data isolation

### Non-Functional Requirements
- ✅ Login response < 500ms
- ✅ Secure token storage
- ✅ Responsive UI (mobile + desktop)
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Clean error messages
- ✅ Professional UI design

---

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | User login |
| POST | `/api/v1/auth/logout` | Yes | User logout |
| POST | `/api/v1/auth/refresh` | No (cookie) | Refresh access token |
| GET | `/api/v1/auth/me` | Yes | Get current user |

---

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── authController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   └── authRoutes.ts
│   ├── services/
│   │   ├── authService.ts
│   │   └── tokenService.ts
│   ├── utils/
│   │   ├── password.ts
│   │   └── validation.ts
│   └── validators/
│       └── authValidators.ts

frontend/
├── src/
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── Layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── Input.tsx
│   │       ├── Button.tsx
│   │       └── Card.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx
│   │   ├── manager/
│   │   │   └── ManagerDashboard.tsx
│   │   └── super-admin/
│   │       └── SuperAdminDashboard.tsx
│   ├── services/
│   │   └── authApi.ts
│   └── store/
│       └── authStore.ts
```

---

## Next Steps

After plan approval, start implementation in this order:

1. **Database migration** (add security fields)
2. **Backend services** (password, token, auth)
3. **Backend API** (controllers, routes, middleware)
4. **Test backend** (Postman/curl)
5. **Frontend auth** (store, API service)
6. **Login UI** (page, form, validation)
7. **Dashboards** (layouts, role-based routing)
8. **Integration testing** (full flow)
9. **Polish & bug fixes**

**Total Estimated Time: 16-22 hours**

---

**Status**: 📝 Plan Ready for Review & Approval
