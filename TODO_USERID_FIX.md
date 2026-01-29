# TODO: Fix User ID Overflow Issue

## Issue
JavaScript's `parseInt()` overflows for BIGINT values larger than `9007199254740991` (MAX_SAFE_INTEGER), causing UserID truncation.

## Fixes Required

### 1. Backend - Convert UserID to string in login response
- **File**: `backend/server.js`
- **Location**: Login route `/api/login`
- **Change**: Ensure UserID is sent as string in the response
- **Status**: ✅ COMPLETED

### 2. Frontend Auth Service - Store UserID as string
- **File**: `tphpa/src/app/services/auth/auth.ts`
- **Changes**:
  - `getUserId()` should return `string | null` instead of `number | null`
  - Store user_id as string in localStorage without parsing
  - Update all related type annotations
- **Status**: ✅ COMPLETED

### 3. Frontend Report Service - Accept string userId
- **File**: `tphpa/src/app/services/report.service.ts`
- **Changes**:
  - Update `getUserReports(userId: number)` to accept `string | number`
- **Status**: ✅ COMPLETED

### 4. Frontend Forms Service - Accept string userId
- **File**: `tphpa/src/app/services/forms.service.ts`
- **Changes**:
  - Update `getUserForms`, `getSubordinateForms`, `approveForm`, `rejectForm` to accept `string | number`
- **Status**: ✅ COMPLETED

### 5. Frontend Employee Dashboard - Use string userId
- **File**: `tphpa/src/app/employee/employee-dashboard/employee-dashboard.ts`
- **Changes**:
  - Pass userId as string in FormData for report submission
- **Status**: ✅ COMPLETED

## Summary
All fixes have been applied to prevent JavaScript integer overflow when handling BIGINT UserID values from MySQL.

## Deployment Steps
1. Rebuild the Angular app: `cd tphpa && npm run build`
2. Restart the backend server to pick up the changes
3. Test login and report submission to verify UserID is preserved correctly

