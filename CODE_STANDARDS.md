# Code Standards - StudyHi Platform

**Version:** 1.0  
**Last Updated:** February 7, 2026  
**Status:** Active

---

## Purpose

This document establishes coding standards, best practices, and security guidelines for the StudyHi Learning Management System. All contributors must follow these standards to ensure code quality, security, and maintainability.

---

## Table of Contents

1. [Security Standards](#security-standards)
2. [TypeScript Standards](#typescript-standards)
3. [API Route Standards](#api-route-standards)
4. [Database Standards](#database-standards)
5. [React Component Standards](#react-component-standards)
6. [Error Handling Standards](#error-handling-standards)
7. [Testing Standards](#testing-standards)
8. [Documentation Standards](#documentation-standards)

---

## Security Standards

### 1. Authentication & Authorization

#### ✅ DO
```typescript
// Always check authentication in API routes
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id; // Use typed access
  // ... rest of handler
}
```

#### ❌ DON'T
```typescript
// Never assume user is authenticated
export async function GET(req: Request) {
  const userId = req.headers.get('user-id'); // ❌ Insecure
  // ... handler
}

// Never use fallback to demo users
const userId = session?.user?.id || 'demo-user-1'; // ❌ Security risk
```

### 2. Input Validation

#### ✅ DO
```typescript
// Use Zod for input validation
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = createUserSchema.parse(body); // Throws if invalid
  // ... use validated data
}
```

#### ❌ DON'T
```typescript
// Never trust user input
export async function POST(req: Request) {
  const { email, password } = await req.json(); // ❌ No validation
  // ... use directly
}
```

### 3. URL and Path Validation

#### ✅ DO
```typescript
// Validate URLs before fetching
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block private IPs
    const host = parsed.hostname;
    if (host === 'localhost' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Validate file paths
function isPathSafe(userPath: string, baseDir: string): boolean {
  const resolved = path.resolve(baseDir, userPath);
  return resolved.startsWith(baseDir);
}
```

#### ❌ DON'T
```typescript
// Never fetch arbitrary URLs
await fetch(userProvidedUrl); // ❌ SSRF risk

// Never use simple regex for path sanitization
const safe = userPath.replace(/\.\./g, ''); // ❌ Bypassable
```

### 4. Environment Variables

#### ✅ DO
```typescript
// Fail fast if required vars missing
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required');
}

// Use typed env validation
const env = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
}).parse(process.env);
```

#### ❌ DON'T
```typescript
// Never hardcode secrets
const secret = 'my-secret-key'; // ❌ Security risk

// Never use weak fallbacks
const secret = process.env.SECRET || 'default'; // ❌ Insecure
```

### 5. File Uploads

#### ✅ DO
```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  
  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }
  
  // Validate path
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  const targetPath = path.resolve(uploadDir, sanitizedFilename);
  if (!targetPath.startsWith(uploadDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  
  // ... save file
}
```

#### ❌ DON'T
```typescript
// Never skip validation
const file = formData.get('file');
await writeFile(file.name, file); // ❌ Multiple risks
```

---

## TypeScript Standards

### 1. Type Safety

#### ✅ DO
```typescript
// Use proper types
interface User {
  id: string;
  email: string;
  name: string;
}

// Use type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

// Use generic types
function getById<T>(id: string, items: T[]): T | undefined {
  return items.find(item => item.id === id);
}
```

#### ❌ DON'T
```typescript
// Never use 'any'
const user: any = session.user; // ❌ Loses type safety

// Never use unsafe assertions
const userId = (session.user as any).id; // ❌ Runtime error risk

// Never use implicit any
function getData(id) { // ❌ Implicit any parameter
  // ...
}
```

### 2. Null Safety

#### ✅ DO
```typescript
// Use optional chaining
const email = user?.profile?.email;

// Use nullish coalescing
const name = user?.name ?? 'Anonymous';

// Check before access
if (session?.user?.id) {
  const userId = session.user.id;
  // ... safe to use
}
```

#### ❌ DON'T
```typescript
// Never assume non-null
const userId = session.user.id; // ❌ May throw

// Never use ! operator without certainty
const email = user!.email; // ❌ Runtime error if null
```

---

## API Route Standards

### 1. HTTP Methods & Status Codes

#### ✅ DO
```typescript
// GET - Read data
export async function GET(req: Request) {
  // ...
  return NextResponse.json(data, { status: 200 });
}

// POST - Create resource
export async function POST(req: Request) {
  // ...
  return NextResponse.json(created, { status: 201 });
}

// PUT - Update resource (full)
export async function PUT(req: Request) {
  // ...
  return NextResponse.json(updated, { status: 200 });
}

// PATCH - Update resource (partial)
export async function PATCH(req: Request) {
  // ...
  return NextResponse.json(updated, { status: 200 });
}

// DELETE - Delete resource
export async function DELETE(req: Request) {
  // ...
  return NextResponse.json(null, { status: 204 });
}
```

#### Status Code Usage
- `200` - Success
- `201` - Created
- `204` - No Content (DELETE success)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error

### 2. Response Format

#### ✅ DO
```typescript
// Success response
return NextResponse.json({
  data: result,
  success: true,
}, { status: 200 });

// Error response
return NextResponse.json({
  error: 'Invalid email format',
  success: false,
}, { status: 400 });

// List response with pagination
return NextResponse.json({
  data: items,
  pagination: {
    page: 1,
    perPage: 20,
    total: 100,
    totalPages: 5,
  },
  success: true,
});
```

#### ❌ DON'T
```typescript
// Never expose internal errors
return NextResponse.json({
  error: error.message, // ❌ May leak details
  stack: error.stack,   // ❌ Security risk
});

// Never use inconsistent formats
return NextResponse.json(result); // ❌ No success field
return { data: result };          // ❌ Not using NextResponse
```

---

## Database Standards

### 1. Prisma Queries

#### ✅ DO
```typescript
// Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// Use transactions for related operations
await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData }),
]);

// Use batch operations
await prisma.notification.createMany({
  data: notifications,
});

// Use proper error handling
try {
  await prisma.user.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
  }
  throw error;
}
```

#### ❌ DON'T
```typescript
// Never fetch all fields unnecessarily
const users = await prisma.user.findMany(); // ❌ Fetches everything

// Never create in loops (N+1 problem)
for (const item of items) {
  await prisma.item.create({ data: item }); // ❌ Slow
}

// Never ignore Prisma errors
await prisma.user.create({ data }).catch(() => {}); // ❌ Silent failure
```

### 2. Schema Design

#### ✅ DO
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  posts     Post[]
  
  @@index([email])  // Index frequently queried fields
}

model Post {
  id        String   @id @default(cuid())
  userId    String
  title     String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
}
```

#### ❌ DON'T
```prisma
model User {
  id    Int    @id @default(autoincrement())  // ❌ Use cuid() for distributed systems
  email String                                // ❌ Missing @unique
  // ❌ Missing indexes
  // ❌ Missing createdAt/updatedAt
}
```

---

## React Component Standards

### 1. Component Structure

#### ✅ DO
```typescript
'use client'; // Only when needed

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface UserCardProps {
  userId: string;
  showDetails?: boolean;
}

export function UserCard({ userId, showDetails = false }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // ... fetch user
  }, [userId]);
  
  if (loading) return <Skeleton />;
  if (!user) return <ErrorState />;
  
  return (
    <div className="user-card">
      {/* ... */}
    </div>
  );
}
```

#### ❌ DON'T
```typescript
// Never use default exports
export default function UserCard() { // ❌ Use named exports
  // ...
}

// Never use 'use client' unnecessarily
'use client'; // ❌ Only add when needed (useState, useEffect, etc)

export function ServerComponent() {
  // This could be a server component
}
```

### 2. Performance

#### ✅ DO
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // ...
});

// Use useCallback for functions passed to children
const handleClick = useCallback(() => {
  // ...
}, [dependency]);

// Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.value - b.value);
}, [items]);
```

---

## Error Handling Standards

### 1. API Routes

#### ✅ DO
```typescript
export async function POST(req: Request) {
  try {
    // Validate auth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate input
    const body = await req.json();
    const validated = schema.parse(body);
    
    // Process
    const result = await processData(validated);
    
    return NextResponse.json({ data: result, success: true });
    
  } catch (error) {
    // Log detailed error server-side
    console.error('[API_ROUTE_ERROR]', {
      path: req.url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Return generic error to client
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
```

#### ❌ DON'T
```typescript
export async function POST(req: Request) {
  const result = await riskyOperation(); // ❌ No error handling
  return NextResponse.json(result);
}
```

---

## Testing Standards

### 1. Unit Tests

#### ✅ DO
```typescript
import { describe, it, expect } from '@jest/globals';
import { isUrlSafe } from './validators';

describe('isUrlSafe', () => {
  it('should allow valid public URLs', () => {
    expect(isUrlSafe('https://example.com')).toBe(true);
  });
  
  it('should block private IPs', () => {
    expect(isUrlSafe('http://192.168.1.1')).toBe(false);
    expect(isUrlSafe('http://10.0.0.1')).toBe(false);
  });
  
  it('should block localhost', () => {
    expect(isUrlSafe('http://localhost')).toBe(false);
  });
});
```

### 2. Integration Tests

#### ✅ DO
```typescript
import { POST } from './route';

describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    });
    
    const res = await POST(req);
    const data = await res.json();
    
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('test@example.com');
  });
});
```

---

## Documentation Standards

### 1. Code Comments

#### ✅ DO
```typescript
/**
 * Validates if a URL is safe to fetch (prevents SSRF attacks)
 * 
 * @param url - The URL to validate
 * @returns true if safe, false if potentially dangerous
 * 
 * Blocks:
 * - Private IP ranges (10.x, 192.168.x, etc.)
 * - Localhost
 * - Cloud metadata endpoints
 * - Non-HTTP/HTTPS protocols
 */
export function isUrlSafe(url: string): boolean {
  // ...
}
```

#### ❌ DON'T
```typescript
// Validates URL
export function isUrlSafe(url: string): boolean { // ❌ Too brief
  // ...
}

// This function checks if the URL is safe and returns true if it is
// otherwise it returns false because the URL might be dangerous
export function isUrlSafe(url: string): boolean { // ❌ Too verbose
  // ...
}
```

---

## Code Review Checklist

Before submitting a PR, verify:

### Security ✅
- [ ] All API routes have authentication checks
- [ ] User input is validated
- [ ] No hardcoded secrets
- [ ] No information leakage in errors
- [ ] File paths are validated
- [ ] URLs are validated before fetching

### Type Safety ✅
- [ ] No `any` types used
- [ ] No unsafe type assertions
- [ ] Proper null checks
- [ ] Interfaces defined for complex types

### Code Quality ✅
- [ ] Functions under 50 lines
- [ ] No code duplication
- [ ] Descriptive variable names
- [ ] JSDoc comments on public APIs
- [ ] No console.log (use proper logging)

### Testing ✅
- [ ] Unit tests for new functions
- [ ] Integration tests for API routes
- [ ] Manual testing completed
- [ ] Edge cases covered

### Performance ✅
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Proper indexes used
- [ ] Large lists paginated

---

## Enforcement

These standards are enforced through:
1. **ESLint** - Automated linting
2. **TypeScript** - Type checking
3. **Code Review** - Manual review
4. **Testing** - Automated tests
5. **CI/CD** - Automated checks

---

## Updates

This document should be updated:
- When new patterns are established
- When security issues are discovered
- When technology changes
- Quarterly review minimum

---

**Last Review:** February 7, 2026  
**Next Review:** May 7, 2026  
**Maintainer:** Development Team
