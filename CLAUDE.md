# Gaming Platform - CLAUDE.md

> **Note for Claude Code on the Web**: Claude should commit and push changes to feature branches during sessions to
> prevent work loss (cloud workspace is temporary). Developer reviews and merges changes on GitHub after the session.

## Project Overview

A modern gaming/social platform with real-time features including duels, chat, friends system, and matchmaking. Built
for long-term scalability with support for future mobile, desktop apps, and microservices architecture.

## Core Principles

- **Scalability First**: Design for millions of users from day one
- **DRY & Modular**: Reusable, composable components and utilities
- **Type Safety**: STRICT TypeScript across the entire stack
- **Test Coverage**: Minimum 80% coverage with Vitest + E2E with Playwright
- **Best Practices**: Follow conventions from top-tier companies
- **Dynamic Design**: Flexible architecture that adapts to future needs

---

## Tech Stack

### Current Stack

#### Frontend

- **Framework**: TanStack Start (React)
- **State Management**:
  - TanStack Query (80% - server state)
  - Zustand (20% - client-only state)
- **Forms**: TanStack Form
- **Styling**: Tailwind CSS + shadcn/ui
- **Compiler**: React Compiler
- **TypeScript**: Strict mode

#### Backend

- **Runtime**: Node.js
- **Framework**: Fastify (vanilla, no framework wrapper)
- **Database**: PostgreSQL
- **Query Builder**: Kysely
- **Caching**: Redis
- **Job Queue**: BullMQ
- **Validation**: Zod

#### Real-time

- **Live Features**: Native WebSockets (duels, chat, matchmaking)
- **Updates**: Server-Sent Events (SSE)
- **No Socket.io** unless absolutely necessary

#### Infrastructure

- **Monorepo**: Turborepo + pnpm
- **Environment**: t3-env
- **Error Tracking**: Sentry
- **Containerization**: Docker + Docker Compose
- **Deployment**: Cloud-managed containers (AWS ECS, GCP Cloud Run)
- **Cloud**: Provider-agnostic initially (TanStack Start with Nitro)
- **Future**: AWS compute + Cloudflare CDN + video processing service

#### API & Documentation

- **Current**: REST API
- **Future**: GraphQL (for mobile apps)
- **Docs**: OpenAPI/Swagger
- **Diagrams**: Mermaid
- **Validation**: Zod schemas

#### Developer Experience

- **Testing**: Vitest (80% coverage), Playwright (E2E)
- **Linting**: ESLint (strict configs)
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions
- **Commits**: Conventional Commits (manual handling)

#### Authentication

- **Tokens**: JWT
- **OAuth**: Third-party providers (Google, Discord, etc.)
- **Sessions**: Optional for web

### Future Stack

#### Planned Additions

- **Feature Flags**: GrowthBook
- **Component Library**: Storybook
- **Analytics**: ClickHouse
- **Product Analytics**: PostHog
- **Monitoring**: Datadog
- **Message Queue**: Kafka / NATS JetStream / RabbitMQ
- **Orchestration**: Kubernetes (when scale demands it)

#### Platform Expansion

- Mobile apps (React Native or native)
- Desktop apps (Tauri or Electron)
- Microservices architecture

---

## Project Structure

### Monorepo Layout

```
/
├── apps/
│   ├── web/                 # TanStack Start app
│   ├── mobile/              # Future: React Native
│   └── desktop/             # Future: Tauri/Electron
├── packages/
│   ├── api/                 # Fastify backend
│   ├── database/            # Kysely schemas, migrations
│   ├── shared/              # Shared types, utils
│   ├── websocket/           # WebSocket server
│   ├── ui/                  # Shared UI components (shadcn)
│   ├── validators/          # Zod schemas
│   ├── eslint-config/       # Shared ESLint configs
│   └── typescript-config/   # Shared TS configs
├── docker/
│   ├── docker-compose.yml
│   └── Dockerfile.*
├── .github/
│   └── workflows/           # GitHub Actions
├── docs/
│   ├── api/                 # OpenAPI specs
│   ├── architecture/        # Mermaid diagrams
│   └── guides/
├── turbo.json
├── pnpm-workspace.yaml
└── CLAUDE.md                # This file
```

---

## Code Quality Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

### ESLint Standards

- Airbnb or similar enterprise-grade base config
- TypeScript ESLint strict rules
- React hooks rules
- Import sorting and organization
- No console.log in production code
- Consistent naming conventions

### Testing Requirements

- **Unit Tests**: 80% minimum coverage (Vitest)
- **Integration Tests**: Critical paths
- **E2E Tests**: User flows (Playwright)
- **Test Structure**: Arrange-Act-Assert pattern
- **Mocking**: Minimal, prefer integration tests where possible

### Code Organization

- **Barrel Exports**: Use index.ts for clean imports
- **Colocation**: Keep related files together
- **Feature-Based**: Organize by feature, not file type
- **Naming**:
  - Components: PascalCase
  - Utilities: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case or PascalCase for components

---

## Architecture Patterns

### Backend Architecture

#### API Structure

- **REST First**: OpenAPI-documented REST endpoints
- **Versioning**: `/api/v1/` prefix
- **Response Format**: Consistent JSON structure

```typescript
{
  data: T | null,
  error: { code: string, message: string } | null,
  meta: { pagination?, timestamp }
}
```

#### Database

- **Kysely**: Type-safe query builder
- **Migrations**: Version-controlled, linear
- **Transactions**: Use for multi-table operations
- **Indexes**: Strategic indexing for performance
- **Constraints**: Enforce data integrity at DB level

#### Caching Strategy

- **Redis**: Session data, frequently accessed data
- **Cache Invalidation**: Event-driven with BullMQ
- **TTL**: Sensible defaults, configurable per resource

#### Background Jobs

- **BullMQ**: For async tasks
- **Job Types**:
  - Email/notifications
  - Data aggregation
  - Cleanup tasks
  - Match history processing

### Frontend Architecture

#### State Management

- **Server State**: TanStack Query
  - Caching, refetching, optimistic updates
  - Automatic background sync
- **Client State**: Zustand
  - UI state (modals, theme, sidebar)
  - Ephemeral data (form drafts)

#### Component Patterns

- **Composition**: Small, reusable components
- **Compound Components**: For complex UI (e.g., Card with Card.Header)
- **Render Props & Hooks**: For logic reuse
- **Error Boundaries**: Graceful error handling

#### Forms

- **TanStack Form**: Type-safe form management
- **Zod Validation**: Shared schemas with backend
- **Optimistic Updates**: Immediate UI feedback

#### Styling

- **Tailwind CSS**: Utility-first
- **shadcn/ui**: Base component library
- **Variants**: CVA (Class Variance Authority)
- **Responsive**: Mobile-first design

### Real-time Architecture

#### WebSocket Features

- **Duels**: Live game state synchronization
- **Chat**: Real-time messaging
- **Matchmaking**: Live queue updates
- **Friends**: Online status, presence

#### SSE Features

- **Notifications**: New messages, friend requests
- **Updates**: Non-critical state changes
- **Fallback**: When WebSocket not available

#### Connection Management

- **Reconnection**: Exponential backoff
- **Heartbeat**: Keep connections alive
- **State Sync**: On reconnect, sync missed events
- **Auth**: JWT token validation on connection

---

## Development Workflow

### Branch Strategy

- **Claude Code on Web**: Claude commits and pushes to feature branches (`claude/*` prefix) during sessions
- **Developer**: Reviews changes on GitHub and handles final merge to main branch
- **Conventional Commits**: All commits follow conventional commit format
- **Session Branches**: Auto-generated feature branches (e.g., `claude/feature-name-sessionID`)

### CI/CD Pipeline (GitHub Actions)

#### On Pull Request

1. **Lint**: ESLint + Prettier check
2. **Type Check**: TypeScript compilation
3. **Test**: Vitest unit + integration tests
4. **E2E**: Playwright critical paths
5. **Build**: Verify all apps build successfully
6. **Coverage**: Enforce 80% minimum

#### On Merge to Main

1. All PR checks
2. **Docker Build**: Multi-stage builds
3. **Deploy**: To staging environment
4. **Smoke Tests**: Basic E2E validation

#### On Release Tag

1. **Deploy**: To production
2. **Monitoring**: Sentry release tracking
3. **Rollback**: Automatic on critical errors

### Environment Variables

- **t3-env**: Type-safe environment validation
- **Validation**: Fail fast on missing/invalid vars
- **.env.example**: Document all required variables
- **Secrets**: Never commit, use CI/CD secrets

### Docker Strategy

#### Development

```yaml
# docker-compose.yml
services:
  postgres:
  redis:
  api:
  web:
  websocket:
```

#### Production

- **Multi-stage builds**: Minimize image size
- **Layer caching**: Optimize build times
- **Health checks**: Ensure container health
- **Resource limits**: Prevent resource exhaustion

#### Progression Path

1. **Now**: Docker Compose (local dev)
2. **Next**: Cloud-managed containers (AWS ECS / GCP Cloud Run)
3. **Future**: Kubernetes (when horizontal scaling needed)

---

## API Design

### REST Conventions

#### Endpoints

```
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

GET    /api/v1/duels
POST   /api/v1/duels
GET    /api/v1/duels/:id
PATCH  /api/v1/duels/:id/join

GET    /api/v1/chat/conversations
POST   /api/v1/chat/conversations
GET    /api/v1/chat/conversations/:id/messages
POST   /api/v1/chat/conversations/:id/messages
```

#### Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

#### Request/Response

- **Content-Type**: `application/json`
- **Validation**: Zod schemas
- **Documentation**: OpenAPI 3.0+ spec
- **Pagination**: Cursor-based for real-time data, offset for static

### GraphQL (Future)

- **Mobile-first**: Optimize for mobile bandwidth
- **Schema-first**: Define schema before implementation
- **DataLoader**: Batch and cache database queries
- **Subscriptions**: For real-time updates

---

## Security Considerations

### Authentication & Authorization

- **JWT**: Short-lived access tokens (15min)
- **Refresh Tokens**: Long-lived, HTTP-only cookies
- **OAuth**: Google, Discord, GitHub providers
- **RBAC**: Role-based access control
- **Rate Limiting**: Protect against abuse

### Data Security

- **Input Validation**: Zod on both client and server
- **SQL Injection**: Kysely prevents via parameterized queries
- **XSS**: React escaping + CSP headers
- **CSRF**: SameSite cookies, CSRF tokens for state-changing operations
- **Secrets**: Environment variables, never in code

### Infrastructure Security

- **HTTPS**: Enforce in production
- **CORS**: Strict origin policies
- **Headers**: Security headers (Helmet.js)
- **Dependencies**: Regular security audits (npm audit, Snyk)

---

## Performance Optimization

### Frontend

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next-gen formats, lazy loading
- **Bundle Size**: Monitor and optimize
- **React Compiler**: Automatic memoization
- **CDN**: Static assets via Cloudflare

### Backend

- **Database Indexes**: Strategic indexing
- **Query Optimization**: Avoid N+1 queries
- **Caching**: Redis for hot data
- **Connection Pooling**: Efficient database connections
- **Compression**: gzip/brotli responses

### Real-time

- **Multiplexing**: Share connections where possible
- **Binary Protocols**: For high-frequency data
- **Throttling**: Limit update frequency
- **Selective Updates**: Only send changed data

---

## Monitoring & Observability

### Error Tracking

- **Sentry**: Frontend and backend errors
- **Source Maps**: For production debugging
- **Context**: User, session, request info
- **Alerts**: Critical error notifications

### Future Monitoring

- **Datadog**: APM, infrastructure monitoring
- **PostHog**: Product analytics, feature flags
- **ClickHouse**: Analytics warehouse
- **Metrics**: Custom business metrics

### Logging

- **Structured Logging**: JSON format
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Correlation IDs**: Trace requests across services
- **Retention**: 30 days default, longer for errors

---

## Database Schema Principles

### Design Guidelines

- **Normalization**: 3NF minimum
- **Denormalization**: Strategic, for performance
- **UUIDs**: For distributed systems
- **Timestamps**: `created_at`, `updated_at` on all tables
- **Soft Deletes**: `deleted_at` for recoverable data
- **Enums**: Database enums or lookup tables

### Example Tables

```sql
-- Users
users (id, email, username, created_at, updated_at, deleted_at)

-- Friends
friendships (id, user_id, friend_id, status, created_at, updated_at)

-- Duels
duels (id, game_type, status, created_at, updated_at, finished_at)
duel_participants (id, duel_id, user_id, score, placement)

-- Chat
conversations (id, type, created_at, updated_at)
conversation_members (id, conversation_id, user_id, joined_at)
messages (id, conversation_id, user_id, content, created_at)

-- Matchmaking
matchmaking_queue (id, user_id, game_type, elo, joined_at)
```

### Migrations

- **Linear**: No branching migration history
- **Reversible**: All migrations have down() method
- **Idempotent**: Safe to run multiple times
- **Tested**: Test migrations before production

---

## Documentation Standards

### Code Documentation

- **JSDoc**: For public APIs and complex functions
- **README**: Per package with setup instructions
- **Examples**: Include usage examples
- **Architecture Diagrams**: Mermaid for complex flows

### API Documentation

- **OpenAPI**: Auto-generated from Zod schemas
- **Swagger UI**: Interactive API explorer
- **Examples**: Request/response examples
- **Changelog**: API version changes

### Architecture Diagrams

```mermaid
# Example: System Architecture
graph TD
    Client[Web Client] -->|HTTPS| LB[Load Balancer]
    LB --> API[Fastify API]
    LB --> WS[WebSocket Server]
    API --> DB[(PostgreSQL)]
    API --> Cache[(Redis)]
    API --> Queue[BullMQ]
    WS --> Cache
```

---

## Deployment Strategy

### Environments

- **Local**: Docker Compose
- **Development**: Shared dev environment
- **Staging**: Production mirror
- **Production**: Multi-region (future)

### Cloud Strategy

1. **Phase 1**: Cloud-agnostic (Nitro deployment)
2. **Phase 2**: AWS ECS + RDS + ElastiCache
3. **Phase 3**: Cloudflare CDN integration
4. **Phase 4**: Video processing service
5. **Phase 5**: Kubernetes (when needed)

### Scaling Plan

- **Vertical**: Start with larger instances
- **Horizontal**: Add replicas as traffic grows
- **Database**: Read replicas for read-heavy operations
- **Caching**: Distributed Redis cluster
- **CDN**: Static assets and video content

---

## Key Features to Implement

### Core Features (MVP)

1. **User Authentication**: Sign up, login, OAuth
2. **User Profiles**: Avatar, bio, stats
3. **Friends System**: Add, remove, block, online status
4. **Chat**: 1-on-1 and group conversations
5. **Duels**: Real-time competitive matches
6. **Matchmaking**: ELO-based pairing
7. **Leaderboards**: Global and friend rankings

### Real-time Requirements

- WebSocket connections for live features
- SSE for notifications and updates
- Presence system (online/offline/in-game)
- Live match state synchronization
- Chat message delivery (<100ms)
- Matchmaking queue updates

### Future Features

- Tournaments and leagues
- Spectator mode
- Video replays
- In-game voice chat
- Achievements and badges
- Premium subscriptions
- Mobile and desktop apps

---

## Testing Strategy

### Unit Tests (Vitest)

- **Coverage**: 80% minimum
- **Focus**: Business logic, utilities, hooks
- **Isolation**: Mock external dependencies
- **Speed**: Fast feedback loop

### Integration Tests (Vitest)

- **Database**: Test with real PostgreSQL (testcontainers)
- **API**: Test endpoints with real dependencies
- **Redis**: Test caching logic
- **WebSocket**: Test real-time flows

### E2E Tests (Playwright)

- **Critical Paths**: Login, matchmaking, duels, chat
- **Cross-browser**: Chrome, Firefox, Safari
- **Visual Regression**: Screenshot comparison
- **Performance**: Lighthouse CI

### Test Organization

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
      Button.stories.tsx (future)
  features/
    duels/
      duels.service.ts
      duels.service.test.ts
      duels.e2e.test.ts
```

---

## Questions & Decisions

### When to Ask

- **Breaking Changes**: Always get approval first
- **Architecture Decisions**: Discuss before implementing
- **New Dependencies**: Justify the addition
- **API Design**: Review endpoints before coding
- **Database Schema**: Review before migrations

### When to Proceed

- **Bug Fixes**: Fix and explain
- **Refactoring**: Improve code quality
- **Tests**: Add missing coverage
- **Documentation**: Update as needed
- **Type Safety**: Strengthen types

---

## Resources & References

### Documentation

- [TanStack Start](https://tanstack.com/start)
- [Fastify](https://fastify.dev/)
- [Kysely](https://kysely.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Turborepo](https://turbo.build/repo)

### Best Practices

- [TypeScript Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)

### Tools

- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)

---

## Notes for Claude

- **Git Operations**: Commit and push changes to feature branches during web sessions (cloud workspace is temporary)
- **Ask Questions**: When uncertain about architecture decisions
- **Follow Patterns**: Maintain consistency with established patterns
- **Type Safety**: Never use `any`, always prefer proper types
- **Test Coverage**: Ensure new code maintains 80% coverage
- **Documentation**: Update relevant docs with changes
- **Performance**: Consider performance implications
- **Security**: Always validate input and handle errors
- **Accessibility**: Ensure UI components are accessible

---

**Last Updated**: 2025-11-16 **Version**: 1.0.0
