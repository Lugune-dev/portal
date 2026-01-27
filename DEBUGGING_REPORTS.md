# Report Submission 500 Error - Debugging Guide

## Problem
POST requests to `/api/reports/submit` are returning HTTP 500 with error: "Failed to submit report"

## Recent Changes Made

### 1. Backend Enhancements
- **Added reports table creation** (auto-creates on server startup if missing)
- **Enhanced error logging** with detailed field-by-field logging
- **Added validation** for required fields (title, type, userId)
- **Added debugging endpoints** for diagnostics

### 2. Frontend Fixes
- Fixed image fallback references from `air.jpg` to `air.webp` in:
  - `tphpa/src/app/home/home.html` (2 locations)
  - `tphpa/src/app/admin/advertisements/advertisements.html` (1 location)

## Debugging Endpoints

### Test Database Connection
```
GET https://portal-api-z927.onrender.com/health/db
```
Expected response: `{ ok: true, database: "connected" }`

### Check Table Status
```
GET https://portal-api-z927.onrender.com/health/tables
```
Shows status of: reports, Users, approvals, advertisements tables

### Check Reports Table Schema
```
GET https://portal-api-z927.onrender.com/api/reports/test
```
Shows if reports table exists and lists all columns

## What the Report Submit Endpoint Does

1. Logs request data PRE and POST file upload
2. Validates required fields:
   - `title` - Report title (required)
   - `type` - Report type (required)
   - `userId` - User submitting report (required)
   - `description` - Optional description
   - `attachment` - Optional file attachment

3. Looks up user in Users table using userId
4. Inserts record into reports table with:
   - title
   - submitter_name (from Users table)
   - submitter_unit_id (from Users table)
   - type
   - submitted_date (NOW())
   - status ('PENDING')
   - comments (description or empty string)
   - attachment_path (filename if file provided)

## Troubleshooting Steps

### Step 1: Check Frontend is Sending Data
Open browser DevTools → Network tab → Filter for `/reports/submit` → Click POST request → Preview/Response tabs

Verify FormData contains:
- title ✓
- description ✓
- type ✓
- userId ✓
- attachment (if file selected) ✓

### Step 2: Check Database Connection
```bash
curl https://portal-api-z927.onrender.com/health/db
```
If fails → Database connection issue on server

### Step 3: Check Tables Exist
```bash
curl https://portal-api-z927.onrender.com/health/tables
```
If "reports" shows "missing" → Server restart needed to auto-create table

### Step 4: Check Reports Table Schema
```bash
curl https://portal-api-z927.onrender.com/api/reports/test
```
Should show table exists with columns: id, title, submitter_name, submitter_unit_id, type, submitted_date, status, comments, attachment_path

### Step 5: Check Server Logs
Look for these log patterns:
- `📨 [PRE-UPLOAD] Report submit request received`
- `📨 [POST-UPLOAD] After multer processing`
- `📤 Received report submit request`
- `🔍 Looking up user with ID:`
- `👤 User query result:`
- `💾 Inserting report into database...`
- `❌ Error submitting report:` (if error)

## Common Issues & Solutions

### Error: "User not found"
- userId is not being sent from frontend
- userId doesn't exist in Users table
- Database connection issue preventing user lookup

**Solution**: Verify userId is being passed in FormData, and user exists in database

### Error: "Failed to submit report" (no specific error)
- Reports table doesn't exist
- Database connection is down
- Reports table has wrong schema

**Solution**: 
1. Check `/health/tables` endpoint
2. Check `/api/reports/test` endpoint
3. Restart backend server to trigger auto-creation of tables

### Multer Error: File upload failing
- File size exceeds limits (max 10MB)
- Upload directory doesn't exist or not writable
- FormData not properly constructed

**Solution**: Check `backend/uploads/` directory exists and is writable

## After Deployment

1. Restart backend server to initialize database tables
2. Test using: `curl https://portal-api-z927.onrender.com/health/db`
3. Rebuild Angular app with: `npm run build`
4. Redeploy frontend
5. Test report submission from employee dashboard

## Related Files

- **Backend**: `backend/server.js` (lines ~1055-1140)
- **Frontend**: `tphpa/src/app/employee/employee-dashboard/employee-dashboard.ts` (line ~207-240)
- **Service**: `tphpa/src/app/services/report.service.ts`
