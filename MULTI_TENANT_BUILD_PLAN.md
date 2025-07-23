# Multi-Tenant White-Label Contract Management System - Claude Code Prompt Plan

## System Overview
A scalable, multi-tenant, white-label B2B SaaS platform for contract and data licensing management that can serve thousands of users across hundreds of organizations, with mobile-first design and future native app considerations.

## Phase 1: Foundation & Architecture (Weeks 1-2)

### Prompt 1.1: Database Architecture
```
Create a multi-tenant database schema for a contract management system with:
- Organizations table with subdomain, custom branding, settings
- Row-level security using tenant_id on all tables
- Efficient indexing strategy for queries filtering by tenant
- Partition strategy for scaling to millions of records
- Audit trail system tracking all changes by tenant
Include migration scripts from the current single-tenant schema.
```

### Prompt 1.2: Authentication & Authorization System
```
Build a JWT-based authentication system with:
- Multi-tenant context (tenant_id in all tokens)
- Subdomain-based tenant resolution
- OAuth2/SAML support for enterprise SSO
- API key management for mobile/external apps
- Rate limiting per tenant
- Session management with Redis
Include middleware for automatic tenant context injection.
```

### Prompt 1.3: Core Infrastructure
```
Set up the foundational infrastructure:
- Express middleware stack for tenant isolation
- Global error handling with tenant context
- Structured logging with tenant identification
- Health check endpoints per tenant
- Background job queue system (Bull/Redis)
- Caching layer with tenant-aware keys
Ensure all components respect multi-tenant boundaries.
```

## Phase 2: Mobile-First Frontend (Weeks 3-4)

### Prompt 2.1: Responsive Component System
```
Convert the existing UI components to be fully mobile-responsive:
- Replace all data tables with mobile-friendly card/list views
- Implement touch-friendly interactions (swipe actions, pull-to-refresh)
- Create responsive navigation with bottom tab bar for mobile
- Ensure all forms use single-column layouts on mobile
- Add progressive disclosure patterns for complex data
- Implement offline-first capabilities with service workers
Use Tailwind CSS mobile-first approach throughout.
```

### Prompt 2.2: Mobile-Optimized Pages
```
Redesign all main pages for mobile-first experience:
- Dashboard with swipeable metric cards
- Contracts page with filterable card view
- Customer management with quick actions
- Search with voice input support
- Implement infinite scroll instead of pagination
- Add mobile-specific features (camera for document upload)
Ensure touch targets meet 44px minimum requirement.
```

### Prompt 2.3: PWA Implementation
```
Convert the application to a Progressive Web App:
- Service worker for offline functionality
- App manifest for installation
- Push notifications support
- Background sync for data updates
- IndexedDB for local data storage
- App shell architecture for instant loading
This serves as the foundation for future native apps.
```

## Phase 3: White-Label Customization (Weeks 5-6)

### Prompt 3.1: Theming System
```
Build a comprehensive white-label theming system:
- Dynamic CSS variables for colors, fonts, spacing
- Logo/favicon upload and management
- Custom email templates per tenant
- Branded login pages with custom domains
- Configurable feature flags per tenant
- Custom terminology (contracts vs agreements)
Store all customizations in tenant settings.
```

### Prompt 3.2: Tenant Configuration Portal
```
Create a tenant configuration interface:
- Branding settings (colors, logos, fonts)
- Feature management (enable/disable modules)
- Custom fields for contracts/customers
- Workflow customization
- Email notification templates
- API webhook configuration
Make all changes real-time without deployment.
```

## Phase 4: Data Access Layer Refactoring (Weeks 7-8)

### Prompt 4.1: Repository Pattern Implementation
```
Refactor all data access to use repository pattern with automatic tenant filtering:
- Base repository class with tenant context
- Automatic injection of tenant_id in all queries
- Soft delete support with tenant isolation
- Bulk operations with tenant safety
- Query optimization for tenant-filtered searches
- Connection pooling per tenant for scale
Include comprehensive test suite for tenant isolation.
```

### Prompt 4.2: API Layer Updates
```
Update all API endpoints for multi-tenant operation:
- Automatic tenant context from JWT/subdomain
- Tenant-scoped validation rules
- Rate limiting per tenant and endpoint
- API versioning strategy
- OpenAPI documentation per tenant
- Webhook system for tenant events
Ensure backwards compatibility during migration.
```

## Phase 5: Admin & Management Systems (Weeks 9-10)

### Prompt 5.1: Super Admin Portal
```
Build a super admin portal for managing all tenants:
- Tenant creation/suspension/deletion
- Usage analytics and billing dashboard
- Cross-tenant search capabilities
- System health monitoring
- Tenant migration tools
- Impersonation feature for support
Include role-based access within super admin.
```

### Prompt 5.2: Tenant Admin Enhancement
```
Enhance the existing admin system for tenant admins:
- User management within tenant boundaries
- Subscription and billing management
- Usage reports and analytics
- Data export/import tools
- Audit log viewer
- API key management
Ensure clear separation from super admin features.
```

## Phase 6: Scalability & Performance (Weeks 11-12)

### Prompt 6.1: Database Optimization
```
Implement database optimizations for scale:
- Table partitioning by tenant_id
- Read replica configuration
- Query performance monitoring
- Automatic archiving of old data
- Tenant-specific backup strategies
- Database connection pooling optimization
Target support for 1000+ active tenants.
```

### Prompt 6.2: Caching & CDN Strategy
```
Implement comprehensive caching strategy:
- Redis caching with tenant namespaces
- CDN configuration for static assets
- API response caching per tenant
- Database query result caching
- Session storage optimization
- Real-time cache invalidation
Include cache warming strategies for new tenants.
```

## Phase 7: Mobile App Foundation (Weeks 13-14)

### Prompt 7.1: API Gateway for Mobile
```
Create a mobile-optimized API gateway:
- GraphQL endpoint for efficient data fetching
- Batch API operations to reduce requests
- Delta sync for offline changes
- Push notification endpoints
- File upload with progress tracking
- Compressed responses for mobile data
Design for future React Native/Flutter apps.
```

### Prompt 7.2: Mobile SDK Foundation
```
Build the foundation for mobile SDKs:
- TypeScript models matching API responses
- Offline data sync protocols
- Authentication token management
- Biometric authentication preparation
- Deep linking URL scheme
- Analytics event tracking
Create shared interfaces for iOS/Android development.
```

## Phase 8: Security & Compliance (Weeks 15-16)

### Prompt 8.1: Security Hardening
```
Implement enterprise-grade security:
- Tenant data encryption at rest
- API request signing for mobile apps
- CORS configuration per tenant
- SQL injection prevention for dynamic tenant queries
- XSS protection in white-label content
- Automated security scanning
Include penetration testing scenarios.
```

### Prompt 8.2: Compliance Features
```
Add compliance and audit features:
- GDPR compliance tools (data export/deletion)
- SOC 2 audit trail implementation
- Data residency options per tenant
- Automated compliance reporting
- Privacy policy management per tenant
- Cookie consent per white-label domain
Document all compliance measures.
```

## Implementation Guidelines

### For Each Prompt:
1. Start with: "Building on the existing Contracts SaaS codebase..."
2. Specify mobile-first requirements
3. Include scalability considerations
4. Add test coverage requirements
5. Request documentation updates

### Key Principles:
- **Mobile-First**: Every UI component must work perfectly on mobile
- **Tenant Isolation**: No data leakage between tenants ever
- **Scalability**: Design for 1000+ tenants, 100k+ users
- **White-Label**: Complete brand customization per tenant
- **Future-Proof**: APIs ready for native mobile apps

### Success Metrics:
- Page load time < 2s on mobile 3G
- API response time < 200ms at p95
- Support 10k concurrent users
- 99.9% uptime SLA per tenant
- Zero tenant data leakage incidents

### Migration Strategy:
1. New tenants use multi-tenant system
2. Gradual migration tools for existing data
3. Parallel run period with data sync
4. Automated testing for data integrity
5. Rollback procedures at each phase

## Sample Prompts for Common Tasks

### Creating a New Feature:
```
Add [feature] to the multi-tenant contract system with:
- Mobile-first UI using card-based layouts
- Automatic tenant context filtering
- Offline capability with sync
- Touch-friendly interactions
- API endpoints ready for mobile apps
- White-label customization options
Include tests for tenant isolation.
```

### Optimizing for Mobile:
```
Optimize [component/page] for mobile devices:
- Convert tables to responsive cards
- Add swipe gestures for actions  
- Implement pull-to-refresh
- Reduce bandwidth with lazy loading
- Add loading skeletons
- Ensure 44px touch targets
Test on iPhone SE and Samsung A series.
```

### Adding Tenant Customization:
```
Make [feature] white-label customizable:
- Add configuration options to tenant settings
- Support custom terminology
- Allow feature toggle per tenant
- Enable custom workflows
- Add theming support
- Include in tenant API
Maintain backward compatibility.
```

## Notes for Claude Code Sessions

- Always consider mobile UX first
- Test tenant isolation in every change
- Document API changes for mobile team
- Include database indexes for scale
- Add feature flags for gradual rollout
- Consider offline scenarios
- Plan for React Native/Flutter integration

This plan provides a structured approach to building a scalable, multi-tenant, mobile-friendly white-label system that can grow from hundreds to thousands of organizations while maintaining performance and security.