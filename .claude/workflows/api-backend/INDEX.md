# Api Backend

HTTP/GraphQL/WebSocket endpoint design, documentation, mocking, contracts, and versioning.

| Pack | Description | Path |
|---|---|---|
| `api-contract-normalizer` | Generates CRUD REST API endpoints with request validation, TypeScript types, consistent response formats, error handling, and documentation. Includes route handlers, validation schemas (Zod/Joi), typed responses, and usage examples. Use when building "REST API", "CRUD endpoints", "API routes", or "backend endpoints". | `.claude/workflows/api-backend/api-contract-normalizer/RULE.md` |
| `api-docs-generator` | Generates comprehensive API documentation in Markdown, HTML, or Docusaurus format from Express, Next.js, Fastify, or other API routes. Creates endpoint references, request/response examples, authentication guides, and error documentation. Use when users request "generate api docs", "api documentation", "endpoint documentation", or "api reference". | `.claude/workflows/api-backend/api-docs-generator/RULE.md` |
| `api-endpoint-generator` | Unifies API response patterns across endpoints including pagination format, error structure, status codes, response envelopes, and versioning strategy. Provides contract documentation, shared TypeScript types, middleware utilities, and migration plan. Use when standardizing "API contracts", "response formats", "API conventions", or "API consistency". | `.claude/workflows/api-backend/api-endpoint-generator/RULE.md` |
| `api-mock-server` | Creates mock API servers for testing and development with MSW, json-server, or custom handlers. Use when users request "API mocking", "mock server", "MSW setup", "test fixtures", or "mock API responses". | `.claude/workflows/api-backend/api-mock-server/RULE.md` |
| `api-versioning-deprecation-planner` | Plans safe API evolution with versioning strategies, client migration guides, deprecation timelines, and backward compatibility considerations. Use for "API versioning", "deprecation planning", "API evolution", or "breaking changes". | `.claude/workflows/api-backend/api-versioning-deprecation-planner/RULE.md` |
| `graphql-schema-designer` | Designs GraphQL schemas with types, queries, mutations, subscriptions, resolvers, and DataLoader patterns for efficient data fetching. Use when users request "GraphQL API", "schema design", "GraphQL setup", "resolvers", or "Apollo Server". | `.claude/workflows/api-backend/graphql-schema-designer/RULE.md` |
| `openapi-generator` | Generates OpenAPI 3.0/3.1 specifications from Express, Next.js, Fastify, Hono, or NestJS routes. Creates complete specs with schemas, examples, and documentation that can be imported into Postman, Insomnia, or used with Swagger UI. Use when users request "generate openapi", "create swagger spec", "openapi documentation", or "api specification". | `.claude/workflows/api-backend/openapi-generator/RULE.md` |
| `rest-to-graphql-migrator` | Migrates REST APIs to GraphQL incrementally with schema stitching, REST datasources, and gradual endpoint migration. Use when users request "migrate to GraphQL", "REST to GraphQL", "GraphQL wrapper", or "API modernization". | `.claude/workflows/api-backend/rest-to-graphql-migrator/RULE.md` |
| `websocket-realtime-builder` | Implements real-time features using WebSockets with Socket.io, rooms, authentication, and reconnection handling. Use when users request "real-time updates", "WebSocket", "Socket.io", "live chat", or "push notifications". | `.claude/workflows/api-backend/websocket-realtime-builder/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
