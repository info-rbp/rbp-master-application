# Remote Business Partner Platform - PRD

## Original Problem Statement
1. Pull the GitHub repository (https://github.com/info-rbp/rbp-master-application, master branch) into Emergent
2. Pull the UX/UI Figma repository (https://github.com/info-rbp/RBP-UX) and incorporate it into the application

## Architecture
### Current Setup (Emergent Environment)
- **Frontend**: Vite + React 18 with TypeScript, Tailwind CSS v4, Radix UI / shadcn/ui components (from Figma export)
  - Running on port 3000 via supervisor
  - Located at `/app/frontend/`
- **Backend**: Minimal FastAPI server  
  - Running on port 8001 via supervisor
  - Located at `/app/backend/`
- **Main Application Codebase**: Next.js (original repo) at `/app/src/`, `/app/docs/`, `/app/libs/` etc.

### Original Application Stack
- **Frontend**: Next.js with TypeScript, Tailwind CSS v3, Radix UI / shadcn/ui components
- **Backend**: Firebase / Firestore, Authentik OIDC authentication
- **Integrations**: Square (billing), Google APIs, Genkit AI, MCP SDK
- **Auth**: Authentik OIDC with PKCE + local dev fallback

## User Personas
1. **SMB Business Owners** - Seeking operational resources, templates, advisory services
2. **Operations Managers** - Need process documentation, tools, workflow guides
3. **Consultants / Team Leads** - Want partner offers, knowledge center, membership value
4. **Platform Admins** - Manage content, CRM, users, analytics, membership

## Core Requirements
### Public Pages
- Home, DocuShare, Partner Offers, Knowledge Center, Services, Membership
- Applications, Help Centre
- Login/Signup flows (multi-step)
- Advisory Booking

### Member Portal
- Dashboard, Business Details, Membership (Inclusions/Upgrade/Invoices)
- DocuShare, Applications (List/Tools), Offers (Available/Redeemed)
- Services (Engagements/Book), Knowledge
- Support (Dashboard/Current/Past/New)
- Settings (Profile/Notifications/Security/Billing)
- Loans, Documents, Tasks, Personal Finance, Engagement

### Admin Portal
- Dashboard, Members (List/Pending), DocuShare Management
- Support Tickets, Analytics, Offers, Services, Knowledge, Settings
- Customer 360, Lending, Finance, Documents, Compliance, Tasks
- Sales, Marketing, Commerce, Appointments, Engagement
- Operations, HR, Logistics, Security, Intelligence

## What's Been Implemented (Date: Jan 2026)
- [x] Repository pulled from GitHub into Emergent workspace
- [x] UX/UI Figma repository pulled and incorporated as frontend
- [x] UX/UI Design Guidelines generated (/app/design_guidelines.json)
- [x] Vite + React frontend serving Figma UX on port 3000
- [x] Minimal FastAPI backend serving health endpoint on port 8001
- [x] All public pages rendering: Home, DocuShare, Partner Offers, Services, Membership, Knowledge Center, Applications, Help Centre
- [x] Member Portal fully rendered with sidebar navigation, dashboard, and all sub-pages
- [x] Admin Portal fully rendered with sidebar navigation and all management pages
- [x] Signup multi-step flow (5 steps) rendering
- [x] Member Login page rendering
- [x] Testing: 100% backend, 95% frontend pass rate

## Design Direction (from Figma)
- **Brand Primary**: #4D2673 (deep indigo)
- **Brand Secondary**: #2245BF (vibrant blue)
- **Brand Accent**: #8B5CF6 (purple)
- **Background**: #F9F5FC (soft lavender)
- **Typography**: Inter (clean sans-serif)
- **Shape Language**: Cards 20px, Buttons rounded, Pills 999px

## Prioritized Backlog
### P0 - Critical
- Connect frontend UX to actual backend APIs (Firebase/Firestore integration)
- Implement authentication flow (member login/signup with real data)
- Wire up DocuShare to real content data
- Connect membership/pricing to Square billing

### P1 - Important
- Implement search functionality across content types
- Wire up member portal to real member data
- Admin CRUD operations for content management
- Support ticket system backend
- Partner offers management

### P2 - Nice to Have
- Merge Figma UX patterns back into the Next.js codebase for production deployment
- Loading skeletons and empty states
- SEO metadata optimization
- Performance optimization
- Analytics integration

## Next Tasks
- User to review the UX/UI in the preview and confirm the design direction
- Begin wiring frontend pages to real backend services
- Implement authentication and data persistence
