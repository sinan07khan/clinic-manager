---
Task ID: 1
Agent: main
Task: Remove all user data and make web app fresh as new

Work Log:
- Checked current database state - found stale data in SQLite database
- Deleted and recreated the database with fresh schema (prisma db push)
- Ran seed script (prisma/seed.ts) which clears all data and creates only admin account
- Verified seed output: admin@oxygen.com / admin123, role SUPER_ADMIN
- Fixed analytics.tsx: Added ChartEmptyState component, wrapped 8 charts with empty data guards, fixed 2 division-by-zero bugs
- Fixed inventory-module.tsx: Fixed StockLevelBar division-by-zero when minStock === 0
- Verified all other modules already handle empty data gracefully (dashboard, patients, appointments, billing, hr, diagnostics, doctor-schedule)
- Ran lint check - passes with zero errors
- Tested all API endpoints with empty database:
  - Dashboard API: ✅ Returns zero stats and empty arrays
  - Patients API: ✅ Returns total: 0
  - Staff API: ✅ Returns 1 admin only
  - Analytics API: ✅ Returns empty data
  - Lab Reports API: ✅ Returns empty array
  - Test Types API: ✅ Returns empty array
  - Inventory API: ✅ Returns empty array
  - Appointments API: ✅ Returns empty array
  - Invoices API: ✅ Returns empty with pagination
  - Auth Session API: ✅ Works correctly
- Verified login page renders correctly with Oxygen Health Care branding
- Removed temporary files (run-server.js, keep-alive.sh, test screenshots)

Stage Summary:
- Database is completely fresh: only 1 admin account (admin@oxygen.com / admin123)
- All 17 tables are empty except Staff (1 admin row)
- All modules handle empty data gracefully with proper empty states
- All API endpoints return proper empty responses
- Code quality: lint passes with zero errors
- Login page renders correctly with Oxygen Health Care branding
- The app is ready for the user to add their own data
