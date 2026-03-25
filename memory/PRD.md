# Remote Business Partner Platform - PRD

## Original Problem Statement
Pull the GitHub repository (https://github.com/info-rbp/rbp-master-application, master branch) into Emergent and generate UX/UI design guidelines for collaborative work.

## Architecture
- **Frontend**: Next.js with TypeScript, Tailwind CSS, Radix UI / shadcn/ui components
- **Backend**: Firebase / Firestore, Authentik OIDC authentication
- **Integrations**: Square (billing), Google APIs, Genkit AI, MCP SDK
- **Auth**: Authentik OIDC with PKCE + local dev fallback (admin@rbp.local / member@rbp.local)

## User Personas
1. **SMB Business Owners** - Seeking operational resources, templates, advisory services
2. **Operations Managers** - Need process documentation, tools, workflow guides
3. **Consultants / Team Leads** - Want partner offers, knowledge center, membership value
4. **Platform Admins** - Manage content, CRM, users, analytics, membership

## Core Requirements
### Public Pages
- Home, DocShare, Partner Offers, Knowledge Center, Services, Membership, Pricing, Contact
- Login/Signup/Auth flows
- Advisory Booking

### Member Portal
- Dashboard, Subscription, Support, Saved Content, Customisation Requests, Discovery Calls

### Admin Panel
- Content management, CRM, Analytics, Users, Audit Logs, Documents, Entitlements

## What's Been Implemented (Date: Jan 2026)
- [x] Repository pulled from GitHub into Emergent workspace
- [x] UX/UI Design Guidelines generated (/app/design_guidelines.json)
- [x] "Old Money Tech" aesthetic: Cormorant Garamond headings + Inter body, blue-primary brand, premium B2B consulting feel

## Design Direction
- **Archetype**: "Old Money Tech" — premium, confident, not generic
- **Headline Font**: Cormorant Garamond (serif, authoritative)
- **Body Font**: Inter (clean, readable)
- **Primary Color**: hsl(217, 91%, 60%) — rich blue
- **Secondary Color**: hsl(215, 28%, 17%) — dark navy
- **Shape Language**: Panels 24px, Cards 20px, Buttons 16px, Inputs 14px, Pills 999px
- **Motion**: Subtle only — fade-ups, hover elevations, accordion transitions

## Prioritized Backlog
### P0 - Critical
- Implement design system tokens in globals.css and tailwind.config.ts
- Rebuild Home page with the new design guidelines
- Rebuild public landing pages (DocShare, Services, Membership, Partner Offers, Knowledge Center)

### P1 - Important
- Detail page templates (DocShare detail, Service detail, Partner Offer detail, Knowledge article)
- Membership Pricing page with tier comparison
- Access-state gating UI (Available / Login Required / Membership Required)
- Search and filter patterns across content types

### P2 - Nice to Have
- Member Portal UI refresh
- Admin Panel UI improvements
- Loading skeletons and empty states
- SEO metadata optimization
- Performance optimization (image lazy loading, etc.)

## Next Tasks
- User to review design guidelines and confirm direction
- Begin implementing design system changes (fonts, tokens, shape language)
- Build out public pages following the detailed UX specification
