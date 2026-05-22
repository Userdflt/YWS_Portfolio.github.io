# Module Boundaries

<!-- CUSTOMIZE: Adapt these rules to your project's module pattern. The examples below use common patterns — replace with your actual module structure. -->

- Import other modules only via their public entrypoint (e.g., `index.ts`, `__init__.py`, `mod.rs`, or the package's exported API).
- Do not deep-import module internals from outside that module.
- If a module needs to expose more API, re-export it from the module's public entrypoint.

## Examples

```
// Good (public entrypoint)
import { UserProfile } from '../modules/user-profile';
```

```
// Bad (deep import of module internals)
import { AvatarUploader } from '../modules/user-profile/components/settings/AvatarUploader';
```

<!-- CUSTOMIZE: Replace the examples above with your actual module paths. Common patterns:

**Feature modules (React/Vue/Angular):**
- Public entrypoint: `features/<feature>/index.ts`
- Deep import (avoid): `features/<feature>/components/internal/Widget.tsx`

**Python packages:**
- Public entrypoint: `from myapp.users import UserService`
- Deep import (avoid): `from myapp.users.repository.postgres import PostgresUserRepo`

**Go packages:**
- Public entrypoint: `import "myapp/pkg/auth"` (exported symbols only)
- Deep import (avoid): `import "myapp/internal/auth/tokens"`

**Rust crates/modules:**
- Public entrypoint: `use myapp::auth::AuthService;`
- Deep import (avoid): `use myapp::auth::internal::token_store;`

**Java packages:**
- Public entrypoint: `import com.myapp.auth.AuthService;`
- Deep import (avoid): `import com.myapp.auth.internal.TokenStore;`
-->

## Types Placement

- Module-local types live inside the module's own type definition file.
- App-wide shared types stay in a root types location and may re-export module types.
