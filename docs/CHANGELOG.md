# CHANGELOG

## [1.1.0] - 2025-07-17

### Added - Staff Management System

#### User Management
- Created comprehensive user management system with role-based access control
- Implemented 6 system roles with best practices:
  - **Administrator**: Full system access, user management, all configurations
  - **Manager**: Contract management, customer management, reports
  - **Sales**: Create/edit contracts, manage customers, view reports
  - **Support**: View contracts/customers, handle customer inquiries
  - **Finance**: View contracts, billing management, financial reports
  - **Viewer**: Read-only access to contracts and customers
- User CRUD operations with search and filtering
- User activation/deactivation controls
- Password management with hashing (bcrypt)
- Self-deletion/deactivation protection

#### Customer Management Dashboard
- Built staff-facing customer management interface at `/customer-management`
- Customer status management (active, inactive, suspended, pending_approval)
- Staff assignment system for customer ownership
- Internal notes management for customers
- Real-time statistics dashboard
- Permission-based UI components
- Status filtering with tabs

#### Customer Access Management
- Separate customer portal access control (independent from customer records)
- Grant/revoke portal access without affecting customer data
- Customer login suspension/activation
- Password reset functionality
- Login tracking (last login timestamps)
- Bulk customer access management

#### System Settings
- Comprehensive settings management with best practices
- **General Settings**: Company info, system/support emails
- **Regional Settings**: Timezone, date format, currency preferences
- **Contract Defaults**: Default term, billing cycle, grace period
- **Email Notifications**: Configurable alerts for contracts, payments, new customers
- **Security Settings**: 
  - Password policy configuration
  - Session timeout management
  - Two-factor authentication toggle
  - IP whitelist for access control

### Technical Implementation

#### Frontend
- **Pages Added**:
  - `/admin` - Admin dashboard
  - `/admin/users` - User management
  - `/admin/customer-access` - Customer portal access
  - `/admin/settings` - System settings
  - `/customer-management` - Staff customer management
- **Components Created**:
  - Switch component for toggle controls
  - Tab-based navigation for settings
  - Role-based permission controls
  - Error boundary for better error handling

#### Backend
- **API Routes Added**:
  - `/api/admin/*` - Admin management endpoints
  - `/api/staff/*` - Staff management endpoints
- **Database Schema Updates**:
  - Extended user roles (admin, manager, sales, support, finance, viewer)
  - Added customer status and assignment fields
  - Customer access tracking with userId relationships
  - Staff assignment and approval tracking
- **Security Enhancements**:
  - Permission-based middleware
  - Role hierarchy implementation
  - JWT token validation improvements
  - Password hashing with bcrypt

#### Database Migration
- Created and executed staff management migration
- Added indexes for performance on frequently queried fields
- Updated role constraints to support new staff roles

### Improved
- Navigation structure with admin section
- Breadcrumb navigation throughout admin pages
- Rate limiting increased for development (100 → 1000 requests/15min)
- Error handling with proper user feedback
- Form validation across all admin functions

### Fixed
- React Query data structure handling (direct array vs wrapped response)
- Authentication token refresh for role updates
- Navigation component TypeScript interfaces
- Missing UI component imports (Label, Switch)
- API method consistency (POST → PUT for updates)

## [1.0.0] - 2025-07-17

### Initial Release
- Contract Management System
- Customer Management
- Product Management
- Reseller Management
- Customer Portal with registration
- Dashboard with analytics
- PostgreSQL database with Drizzle ORM
- JWT authentication
- React frontend with TypeScript
- Express.js backend
- Responsive design with Tailwind CSS