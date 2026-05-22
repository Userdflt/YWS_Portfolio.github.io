# Api Tooling Clients

API client collections and request runners (Postman, Insomnia, Bruno, cURL, REST Client).

| Pack | Description | Path |
|---|---|---|
| `bruno-collection-generator` | Generates Bruno collection files (.bru) from Express, Next.js, Fastify, or other API routes. Creates organized collections with environments, authentication, and folder structure for the open-source Bruno API client. Use when users request "generate bruno collection", "bruno api testing", "create bru files", or "bruno import". | `.claude/workflows/api-tooling-clients/bruno-collection-generator/RULE.md` |
| `curl-command-generator` | Generates ready-to-run cURL commands from Express, Next.js, Fastify, or other API routes. Creates copy-paste commands with proper headers, authentication, and request bodies. Use when users request "generate curl commands", "curl examples", "api curl", or "command line api testing". | `.claude/workflows/api-tooling-clients/curl-command-generator/RULE.md` |
| `insomnia-collection-generator` | Generates Insomnia collection export files from Express, Next.js, Fastify, or other API routes. Creates organized workspaces with request groups, environments, and authentication. Use when users request "generate insomnia collection", "export to insomnia", "create insomnia workspace", or "insomnia import". | `.claude/workflows/api-tooling-clients/insomnia-collection-generator/RULE.md` |
| `postman-collection-generator` | Generates Postman collection JSON files from Express, Next.js, Fastify, Hono, or other API routes. Scans route definitions, extracts endpoints, methods, params, and creates importable collections. Use when users request "generate postman collection", "export to postman", "create postman file", or "postman import". | `.claude/workflows/api-tooling-clients/postman-collection-generator/RULE.md` |
| `vscode-rest-client-generator` | Generates .http files for the VS Code REST Client extension from Express, Next.js, Fastify, or other API routes. Creates organized request files with variables, environments, and authentication. Use when users request "generate http files", "rest client requests", "create .http file", or "vscode api testing". | `.claude/workflows/api-tooling-clients/vscode-rest-client-generator/RULE.md` |

---

Tier-1 catalog: `.claude/workflows/catalog.md`. Tier-0 discovery rule: `.claude/rules/workflow-discovery.md`.
