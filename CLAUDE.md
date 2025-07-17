# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contract & Data Licensing Management System - A comprehensive B2B SaaS application for CAP Locations to manage data licensing contracts, customer relationships, and product offerings.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL via Neon serverless platform
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Infrastructure
- **Development**: Replit development environment
- **Database**: Neon PostgreSQL serverless
- **Deployment**: Replit Deployments with automatic scaling

## Architecture Overview

### Project Structure
```
client/src/
├── components/
│   ├── contracts/          # Contract management components
│   ├── customers/          # Customer management components
│   ├── dashboard/          # Dashboard and analytics components
│   ├── products/           # Product management components
│   ├── resellers/          # Reseller management components
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
└── pages/                  # Page components and routing

server/
├── routes.ts              # API route definitions
├── storage.ts             # Database operations interface
├── db.ts                  # Database connection and configuration
├── replitAuth.ts          # Authentication middleware
└── index.ts               # Express server setup
```

### Core Data Models
- **Users**: Authentication and user management
- **Customers**: Customer profiles with address management
- **Products**: Product catalog with bundle support
- **Resellers**: Reseller management with margin configuration
- **Contracts**: Contract lifecycle management with billing states

### Key Features
- Interactive dashboard with drill-through capabilities
- Contract lifecycle management (PENDING → BILLED → RECEIVED → PAID → LATE/CANCELED)
- Customer management with separated name fields and full address support
- Product bundles with JSON storage of relationships
- Reseller margin calculations and commission tracking

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Core Resources
- `GET|POST /api/contracts` - Contract management
- `GET|POST /api/customers` - Customer management
- `GET|POST /api/products` - Product management
- `GET|POST /api/resellers` - Reseller management

### Analytics
- `GET /api/analytics/metrics` - Dashboard metrics
- `GET /api/analytics/revenue-by-month` - Monthly revenue data
- `GET /api/analytics/contracts-by-status` - Contract status distribution

## Database Schema Key Points

### Customers Table
- Separated `first_name` and `last_name` fields
- Full address fields (street, city, state, zip_code, country)
- Customer types: partner, reseller, solution provider, individual

### Products Table
- Support for bundles via `is_bundle` boolean and `bundle_products` JSON field
- Custom categories with standard options: full file, lite, online, proposed, anchors & tenants
- Decimal pricing with `base_price` field

### Contracts Table
- Links customer, product, and optional reseller
- Billing status lifecycle management
- Automatic net amount calculation with reseller margins
- Contract terms and billing cycles (annual, monthly, etc.)

## Environment Variables
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=secure_random_string
REPL_ID=replit_application_id
REPLIT_DOMAINS=comma_separated_domains
PORT=5000
NODE_ENV=production
```

## Development Principles
- End-to-end TypeScript for type safety
- Drizzle ORM for type-safe database operations
- TanStack Query for server state management
- Zod validation for all inputs
- Clean architecture with separation of concerns