# CLAUDE.md - Official Development Guidelines

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Development Environment](#development-environment)
4. [Code Standards & Conventions](#code-standards--conventions)
5. [Testing Guidelines](#testing-guidelines)
6. [Deployment Procedures](#deployment-procedures)
7. [Security Guidelines](#security-guidelines)
8. [Performance Standards](#performance-standards)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Project Overview

### System Name
**Coffee Cooperative Management System (Sistem Digitalisasi & Traceability Koperasi Kopi)**

### Current Phase
**MVP Phase 1** - Single Cooperative Management System

### System Purpose
Digitizes and tracks the complete coffee production cycle from farm to buyer, providing comprehensive traceability from cherry to green bean with role-based access control for cooperative management.

### Target Users
- **SUPER_ADMIN**: Full system access - National monitoring, cross-cooperative analytics, user management
- **ADMIN**: Cooperative-level access - Full operational control of cooperative data, farm management, and inventory

### Key Business Domains
- **Farm Management System (FMS)**: Farm registration, farmer management, land tracking, cultivation activities
- **Inventory Management System (IMS)**: Input agriculture tracking, batch management, traceability
- **User Management**: Role-based access control, audit logging
- **Reporting**: Cooperative performance metrics, harvest predictions

*Note: For complete business requirements and specifications, refer to [PRD-Coffee-Cooperative-System.md](./PRD-Coffee-Cooperative-System.md)*

---

## System Architecture

### Technology Stack

**Backend**: Node.js 18+ + Express + PostgreSQL + JWT + bcrypt + express-validator
**Frontend**: React 19 + TypeScript + Vite + shadcn/ui + Tailwind + Axios
**Database**: PostgreSQL with `pg` pooling, SQL migrations in `/db/`, audit logging

### Project Structure

```
/workspaces/coop-coffee/
├── index.js                    # Backend entry point
├── routes/                     # API modules
│   ├── users.js               # User management & authentication
│   ├── koperasi.js            # Cooperative CRUD operations
│   ├── petani.js              # Farmer management
│   ├── lahan.js               # Land management
│   ├── aktivitas.js           # Farm activity tracking
│   ├── inventory.js           # Inventory operations
│   ├── transaksi_inventory.js # Transaction management
│   ├── reports.js             # Analytics and reporting
│   └── pasarmikro.js          # Marketplace integration
├── middleware/
│   ├── auth.js                # JWT authentication & roles
│   └── audit.js               # Request logging
├── db/
│   ├── index.js               # Database connection
│   └── init.sql               # Schema initialization
├── frontend/src/
│   ├── components/            # Management modules
│   │   ├── UserManagement.tsx
│   │   ├── KoperasiManagement.tsx
│   │   ├── PetaniManagement.tsx
│   │   ├── LahanManagement.tsx
│   │   ├── AktivitasManagement.tsx
│   │   ├── InventoryManagement.tsx
│   │   └── TransaksiInventoryManagement.tsx
│   ├── components/forms/      # Form components
│   ├── components/ui/         # shadcn/ui components
│   ├── lib/axios.ts           # HTTP client
│   └── main.tsx               # App entry point
├── __tests__/                 # Test files
└── *.md                       # Documentation
```

---

## Development Environment

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL 13+
- Git for version control

### Environment Setup

#### 1. Database Configuration
```bash
# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres createdb coffee_coop
sudo -u postgres psql -c "CREATE USER node WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE coffee_coop TO node;"

# Initialize schema
psql -h localhost -U node -d coffee_coop -f db/init.sql
```

#### 2. Environment Variables
Create `.env` file in project root:
```env
DB_USER=node
DB_HOST=localhost
DB_NAME=coffee_coop
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
```

#### 3. Development Commands

**Backend Operations:**
```bash
# Start backend server (production)
npm start

# Start backend in background (development)
npm start &

# Run backend tests
npm test

# Stop backend process
pkill -f "node index.js"
```

**Frontend Operations:**
```bash
# Navigate to frontend directory
cd frontend/

# Start development server
npm run dev

# Start frontend in background
npm run dev &

# Build for production
npm run build

# Run linting
npm run lint

# Stop frontend process
pkill -f vite
```

### Port Configuration
- **Backend**: http://localhost:3000 (configured for external access: 0.0.0.0:3000)
- **Frontend**: http://localhost:5174 (Vite auto-assigned, configured with host: true)

---

## Code Standards & Conventions

### General Principles
1. **Modularity**: Each feature should be self-contained and reusable
2. **Consistency**: Follow established patterns throughout the codebase
3. **Readability**: Code should be self-documenting with clear naming
4. **Security**: Never expose secrets, always validate inputs, use proper authentication
5. **Performance**: Efficient database queries, optimized React rendering

### Critical Rules for AI Development
- **ALWAYS use `&` flag when starting servers** to prevent blocking bash commands
- **Use proper TypeScript types** - avoid `any`, prefer `unknown` with type guards
- **Never use magic numbers** - Every number must have a named constant
- **Max 20 lines per function, max 4 parameters** - Use objects for more parameters
- **Parameterized SQL queries only** - Never string concatenation
- **No copy-paste code** - DRY principle is non-negotiable

### Backend Standards

#### API Design
- **RESTful Routes**: Use standard HTTP methods (GET, POST, PUT, DELETE)
- **Response Format**: Consistent JSON responses with proper status codes
- **Error Handling**: Standardized error responses with descriptive messages
- **Validation**: Use express-validator for all input validation
- **Authentication**: JWT tokens required for all protected routes
- **HTTP Status Codes**: Use explicit constants (200, 201, 400, 401, 403, 404, 500)
- **Input Validation Middleware**: Validate before processing requests

#### Code Structure
```javascript
// Route handler example
const someHandler = async (req, res) => {
  try {
    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Business logic
    const result = await someBusinessLogic(req.body);
    
    // Success response
    res.status(200).json({
      message: "Operation successful",
      data: result
    });
  } catch (error) {
    console.error('Error in someHandler:', error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
```

#### Database Interactions
- **Connection Pooling**: Always use the configured pool from `db/index.js`
- **Parameterized Queries**: Never use string concatenation for SQL queries
- **Transaction Management**: Use transactions for multi-table operations
- **Error Handling**: Proper database error handling and connection cleanup

#### Function Design Rules
- **Single Responsibility**: Each function has one clear purpose
- **Length Limit**: Max 20 lines per function, max 4 parameters
- **Error Handling**: Use typed errors (UserNotFoundError, ValidationError, etc.)
- **Return Types**: Always specify return types in TypeScript

### Frontend Standards

#### React Component Structure
```typescript
// Component template
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/axios';

interface Props {
  // Define prop types
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Callback functions with proper dependencies
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch data";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        // Handle axios error with proper type checking
        errorMessage = (error as any).response?.data?.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Effects with proper dependencies
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    // JSX with proper accessibility
    <div className="component-container">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

#### TypeScript Standards
- **Type Safety**: Use proper TypeScript types, avoid `any` where possible
- **Interface Definitions**: Define interfaces for all data structures
- **Error Handling**: Use `unknown` type for error handling with type guards
- **Component Props**: Always define prop interfaces

#### Styling Guidelines
- **Tailwind CSS**: Use utility classes for styling
- **Component Variants**: Use shadcn/ui component variants
- **Responsive Design**: Mobile-first approach with responsive utilities
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Naming Conventions
**Files:**
- **Components**: PascalCase (`UserManagement.tsx`)
- **Utilities**: camelCase (`apiUtils.js`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Routes**: kebab-case (`user-management`)

**Code:**
- **Functions**: Action + result (`calculateMonthlyRevenue()`)
- **Variables**: What they contain (`activeUserCount`)
- **Constants**: What they represent (`MAX_LOGIN_ATTEMPTS = 3`)

---

## Testing Guidelines

### Backend Testing
- **Framework**: Jest with Supertest for API testing
- **Setup**: Global setup in `global-setup.js` initializes test database
- **Utilities**: `setup.js` provides admin token and database utilities
- **Coverage**: Test all API endpoints with various scenarios

### Frontend Testing
- **Browser Testing**: Puppeteer for end-to-end user flows
- **Component Testing**: React Testing Library for component behavior
- **Screenshot Testing**: Automated screenshot capture for visual verification

### Test Structure
```javascript
// API test example
describe('API Endpoint', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  test('should handle valid input', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Test Hierarchy & Naming
**Coverage Distribution:**
- Unit Tests (70%): Individual function testing
- Integration Tests (20%): API endpoint testing  
- E2E Tests (10%): Full user journey testing

**Naming Convention:** `should_[ExpectedBehavior]_when_[StateUnderTest]`

### Testing Commands
```bash
# Run backend tests
npm test

# Run frontend tests (if implemented)
cd frontend && npm test

# Run comprehensive simulation
node simulation-test.js
node frontend-simulation.js
```

---

## Deployment Procedures

**Development:** Configure `.env` → Run `db/init.sql` → `npm install` → Use `&` flag for background processes
**Production:** Secure environment variables → Managed PostgreSQL → HTTPS → PM2 process management → Nginx reverse proxy
**Build:** `cd frontend && npm run build` → `node index.js`

---

## Security Guidelines

**Authentication**: JWT tokens + bcrypt hashing + role-based middleware + proper session management
**Data Protection**: Input validation + parameterized queries + XSS prevention + CORS configuration
**Monitoring**: Audit logging + error tracking + access monitoring

### Essential Security Patterns
```typescript
// Input sanitization
const sanitizeInput = (input: string) => input.trim().replace(/[<>]/g, '');

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// No secrets in code
const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error('API_KEY required');
```

---

## Performance Standards

**Backend**: Database optimization + connection pooling + caching + target <500ms response times
**Frontend**: Code splitting + loading states + lazy loading + image optimization
**Monitoring**: Track response times + query performance + Core Web Vitals

---

## Troubleshooting Guide

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo service postgresql status

# Test connection
psql -h localhost -U node -d coffee_coop -c "SELECT 1;"

# Restart PostgreSQL if needed
sudo service postgresql restart
```

#### Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npx tsc --noEmit --skipLibCheck
```

#### Backend API Issues
```bash
# Check backend logs
cat backend.log

# Test API endpoint
curl -H "Content-Type: application/json" http://localhost:3000/api/endpoint

# Check running processes
ps aux | grep -E "(node|vite)"
```

### Development Workflow
1. **Before Making Changes**: Pull latest changes and run tests
2. **During Development**: Use proper error handling and logging
3. **Before Committing**: Run linting and tests
4. **Deployment**: Follow proper deployment procedures

### Debugging Commands
```bash
# Backend debugging
DEBUG=* npm start

# Frontend debugging
cd frontend && npm run dev -- --debug

# Database debugging
psql -h localhost -U node -d coffee_coop
```

---

## Quality & Development Excellence

### Code Review Checklist
**Before Creating PR:**
- [ ] All tests pass locally
- [ ] Code follows naming conventions  
- [ ] No TODO comments
- [ ] Functions have single responsibility
- [ ] Error handling is explicit
- [ ] Performance & security reviewed

**Review Criteria:**
1. **Readability**: Can a junior developer understand in 5 minutes?
2. **Maintainability**: Can this be modified safely in 6 months?
3. **Testability**: Are all code paths easily testable?
4. **Performance**: Will this scale with 10x data?
5. **Security**: Are all inputs validated and outputs sanitized?

### Excellence Indicators
**Green Flags (Superior Code):**
- Code reads like well-written prose
- Functions do exactly what their names suggest
- Error messages are helpful and actionable
- Tests serve as living documentation
- New developers can contribute within hours

**Red Flags (Technical Debt):**
- "It works but I don't know why"
- Copy-paste code patterns
- Comments explaining what code does (instead of why)
- Magic numbers and strings scattered throughout
- Functions with more than 4 parameters

### Golden Rules
1. **Write code for humans first, computers second**
2. **Make it work, make it right, make it fast - in that order**
3. **Fail fast and fail loudly**
4. **Security is not negotiable**
5. **Use background processes with `&`**
6. **Validate all inputs**
7. **Handle all errors explicitly**
8. **Follow established patterns**
9. **Test after changes**
10. **Document decisions, not implementations**

---


---

*This document serves as the authoritative guide for all development activities on the Coffee Cooperative Management System. All code changes and development decisions should align with these guidelines.*

**Important**: This document focuses on **development and technical guidelines only**. For complete business requirements, system specifications, user stories, and functional requirements, always refer to [PRD-Coffee-Cooperative-System.md](./PRD-Coffee-Cooperative-System.md).

**Last Updated**: 2025-07-12  
**Version**: 1.0  
**Maintainer**: Development Team