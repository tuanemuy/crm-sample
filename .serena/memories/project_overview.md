# CRM Sample Project Overview

## Project Purpose
This is a CRM (Customer Relationship Management) sample application built as an agentic web development boilerplate. It's designed for AI Agent development with modern web technologies and clean architecture principles.

## Main Features
- Customer management (leads, contacts, customers)
- Deal and activity tracking
- Contact history management
- User and organization management
- Approval workflows
- Document management
- Campaign and email marketing
- Reporting and dashboard features
- Data import/export capabilities
- Integration support
- Security and permissions management

## Architecture
The project follows hexagonal architecture with domain-driven design (DDD) principles:

### Three-Layer Architecture
1. **Domain Layer** (`src/core/domain/`): Business logic, types, and port interfaces
2. **Application Layer** (`src/core/application/`): Use cases and application services
3. **Adapter Layer** (`src/core/adapters/`): External service implementations

### Domain Entities
- activity, approval, campaign, contact, contactHistory, customer
- dashboard, deal, displaySettings, document, emailMarketing
- integration, lead, notification, organization, permission
- proposal, report, scoringRule, security, user, dataImportExport

## Database
- SQLite with Drizzle ORM for local development
- Using PGlite adapter for PostgreSQL compatibility
- Database migrations managed with Drizzle Kit

## Project Status
Currently in active development with:
- Backend implementation completed for most domains
- Frontend development in progress
- Comprehensive test suite being built
- Task management system for tracking development progress