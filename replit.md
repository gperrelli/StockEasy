# StockEasy - Inventory Management System

## Overview

StockEasy is a modern, full-stack inventory management system built for small to medium businesses. The application provides comprehensive tools for managing products, stock movements, suppliers, and operational checklists through an intuitive web interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for end-to-end type safety
- **API Pattern**: RESTful API design with conventional HTTP methods
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Management**: Express sessions with PostgreSQL storage

### Multi-Tenancy Design
The system implements company-based multi-tenancy where:
- Each company has isolated data through `companyId` foreign keys
- Users belong to a specific company and can only access their company's data
- All database queries are scoped by company to ensure data isolation

## Key Components

### Database Schema
- **Companies**: Multi-tenant organization management
- **Users**: User accounts with role-based access (admin, manager, user)
- **Products**: Inventory items with supplier and category relationships
- **Stock Movements**: Transaction history for inventory changes (entrada/saida)
- **Suppliers**: Vendor management with contact information
- **Categories**: Product categorization system
- **Checklist System**: Operational task management with templates and executions

### Frontend Components
- **Layout System**: Responsive sidebar navigation with mobile support
- **Dashboard**: Real-time statistics and low stock alerts
- **Product Management**: CRUD operations with filtering and search
- **Movement Tracking**: Stock transaction history and new movement creation
- **Supplier Management**: Contact and vendor information management
- **Checklist System**: Daily operational task management
- **WhatsApp Integration**: Shopping list generation for procurement

### API Endpoints
- **Dashboard**: `/api/dashboard/stats` - Business metrics and KPIs
- **Products**: Full CRUD operations with company scoping
- **Movements**: Stock transaction management
- **Suppliers**: Vendor information management
- **Checklists**: Operational task template and execution management
- **WhatsApp**: Shopping list generation for low stock items

## Data Flow

### Authentication Flow
1. User authentication handled through mock middleware (designed for future Supabase integration)
2. User context includes company ID for data scoping
3. All API requests include user context for authorization

### State Management Flow
1. React Query manages all server state with automatic caching
2. Optimistic updates for improved user experience
3. Real-time data synchronization through query invalidation
4. Form state managed locally with React Hook Form

### Database Interaction Flow
1. API routes validate user permissions and extract company context
2. Drizzle ORM executes type-safe queries with company scoping
3. Data returned with proper type inference throughout the stack
4. Automatic relationship loading for complex queries

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **@radix-ui/***: Accessible UI primitives
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration management
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Express server running in development mode with request logging
- Database migrations managed through Drizzle Kit
- Replit-specific optimizations for cloud development

### Production Build
- Vite builds optimized client bundle to `dist/public`
- esbuild compiles server code to `dist/index.js`
- Single artifact deployment with static file serving
- Environment-based configuration management

### Database Management
- PostgreSQL database with Neon serverless hosting
- Drizzle migrations stored in `./migrations` directory
- Schema definitions in shared TypeScript files
- Automatic connection pooling and optimization

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Implemented complete SaaS multi-tenancy structure:
  * Created expandable "Cadastros" menu with all registration pages
  * Added Super Admin interface for managing companies
  * Implemented 4-level user hierarchy (super_admin, admin, gerente, operador)
  * Added role-based access control in sidebar navigation
  * Created registration pages: Categories, Users, Products, Suppliers
  * Enhanced schema with super_admins table and company management
  * Fixed SelectItem validation errors with proper value handling
- July 01, 2025. WhatsApp Business API Integration:
  * Implemented backend endpoints for direct WhatsApp message sending
  * Added shopping list generation with supplier-specific messages
  * Created enhanced WhatsApp modal with tabbed interface
  * Added support for bulk sending to multiple suppliers
  * Integration placed in standby mode (development phase indicators added)
  * Fixed duplicate header/close button issue in dialogs
- July 01, 2025. Inline Stock Editing Implementation:
  * Added click-to-edit functionality for stock quantities in Products table
  * Implemented PUT /api/products/:id/stock endpoint for stock updates
  * Added automatic "Ajuste" movement creation when stock is modified inline
  * Enhanced UI with hover effects and edit controls (check/cancel buttons)
  * Supports keyboard shortcuts (Enter to save, Escape to cancel)
  * Real-time validation and error handling for stock adjustments
- July 01, 2025. UI Bug Fixes and Modal Improvements:
  * Fixed movement modal type selection to use controlled 'value' instead of 'defaultValue'
  * Added "Ajuste" option to movement type selection in modal
  * Implemented conditional WhatsApp button display (only on Dashboard and Products pages)
  * Resolved duplicate WhatsApp button issue by adding showWhatsAppButton prop to TopBar
  * Movement modal now properly pre-selects the correct type when opened from action buttons
- July 02, 2025. Supabase Authentication Migration (Phase 1):
  * Implemented Supabase Auth system with useAuth hook for client-side authentication
  * Created JWT token middleware for API requests authentication
  * Added comprehensive login page with proper error handling
  * Updated API middleware to support both Supabase Auth and mock authentication (fallback)
  * Fixed database connection errors and PostgreSQL query formatting issues
  * System now runs with mock authentication when Supabase service key not available
  * Authentication foundation ready for complete Supabase migration with RLS
- July 02, 2025. MASTER User Role Implementation:
  * Added MASTER role type to user schema (highest privilege level)
  * Created MASTER user (gerencia@loggme.com.br) as SaaS owner with system-wide permissions
  * Updated user sync endpoint to handle duplicate email conflicts and MASTER users without companyId
  * Modified storage layer to support nullable companyId for MASTER users
  * MASTER users can manage multiple companies and assign admin roles across the platform
- July 02, 2025. MASTER Dashboard & Authentication System:
  * Implemented complete MASTER dashboard with company and user management interfaces
  * Added MASTER navigation panel in sidebar with direct access link
  * Created MASTER-specific API endpoints (/api/master/companies, /api/master/users, /api/master/users/:id/assign-company)
  * Fixed authentication system to properly authenticate MASTER user via mock middleware
  * Added MASTER role to all user role selection dropdowns across the system
  * Implemented search, filtering, and assignment functionality for MASTER user management
  * System now properly distinguishes between MASTER users (SaaS owners) and company-specific users
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Database preference: Supabase (complete migration from Neon) for integrated RLS, authentication, and long-term maintainability.
Priority: Multi-tenant SaaS authentication with proper company isolation through Supabase Auth + RLS.
Architecture concern: Clear separation between authentication users and business users in multi-tenant structure.
```

## Multi-Tenant Architecture Clarification

### Current Authentication Flow Issues
- Confusion between Supabase Auth users and internal business users
- Users created in frontend don't sync to Supabase Auth
- Need clear hierarchy: Super Admin → Company Admin → Company Users

### Required Architecture
1. **Super Admin Level**: Manages multiple companies, creates company admins
2. **Company Admin Level**: Manages their company's users and data
3. **Company User Level**: Regular users with role-based permissions within company
4. **Authentication**: All users authenticate through Supabase, but business logic separates concerns