# Overview

Clear Mind v2.0 is a dual-interface idea management platform that allows users to organize and manage ideas through both an infinite canvas view and a structured todo list view. The application enables users to create idea groups (containers) with custom colors, add ideas with priority levels, and seamlessly switch between visual canvas representation and task-oriented todo list organization. Ideas can be created, edited, and positioned on the canvas, while todo lists provide a structured grid view for task management with completion tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18+ with TypeScript for type safety and modern React features
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Components**: Radix UI primitives wrapped in shadcn/ui for accessible, customizable components

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with proper HTTP status codes and error handling
- **File Structure**: Modular separation with dedicated storage layer abstraction
- **Development**: Hot module replacement via Vite integration in development mode

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless
- **Tables**: 
  - `ideas`: Core idea entities with canvas positioning and metadata
  - `groups`: Idea containers with color coding and organization
  - `todo_sections`: Structured sections within todo lists for organization

## Core Data Models
- **Ideas**: Title, description, priority levels (low/medium/high/critical), canvas coordinates, group association, completion status
- **Groups**: Named containers with color coding (purple/blue/green/orange) for visual organization
- **Dual Interface Support**: Ideas render as cards on canvas and tasks in todo lists, maintaining synchronization between views

## Interface Design Patterns
- **Canvas View**: Infinite scrollable canvas with drag-and-drop idea positioning, zoom controls, and floating sidebar for group management
- **Todo List View**: Grid-based layout showing groups as cards with task counts and priority distributions
- **Modal-Based Forms**: Consistent modal patterns for creating/editing ideas and groups
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Development Workflow
- **Type Safety**: Shared TypeScript schemas between frontend and backend via dedicated shared directory
- **Validation**: Zod schemas for runtime type checking and API validation
- **Development Server**: Integrated Vite dev server with Express backend proxy
- **Build Process**: Separate frontend (Vite) and backend (esbuild) build pipelines

# External Dependencies

## Database & Hosting
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit**: Development and hosting environment with integrated database provisioning

## UI & Styling
- **Radix UI**: Headless component primitives for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind

## State Management & Data Fetching
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

## Development Tools
- **TypeScript**: Static type checking across full stack
- **Vite**: Frontend build tool and development server
- **esbuild**: Backend bundling for production deployment
- **Drizzle Kit**: Database migration and schema management tool