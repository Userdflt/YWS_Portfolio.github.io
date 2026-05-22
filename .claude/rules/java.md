<!-- OPTIONAL: Remove this file if your project does not use Java or Kotlin. The /setup skill handles this automatically. -->
---
paths:
  - "**/*.java"
  - "**/*.kt"
  - "**/*.kts"
  - "pom.xml"
  - "build.gradle*"
  - "settings.gradle*"
---

# Java / Kotlin Best Practices

## Project Structure
- Follow standard Maven/Gradle project layout
- `src/main/java/` (or `src/main/kotlin/`) for source code
- `src/test/java/` (or `src/test/kotlin/`) for tests
- `src/main/resources/` for configuration and static resources
- Package structure mirrors domain: `com.company.project.module`
- Keep packages cohesive — one domain concept per package

## Naming Conventions
- `PascalCase` for classes, interfaces, enums, annotations
- `camelCase` for methods, variables, parameters
- `UPPER_SNAKE_CASE` for constants (`static final`)
- Packages are all lowercase, no underscores
- Interfaces named by capability: `Readable`, `Serializable`, `UserRepository`
- Avoid Hungarian notation or type prefixes (`strName`, `iCount`)

## Code Organization
- One public class per file (Java), one primary class per file (Kotlin)
- Order: constants, fields, constructors, public methods, private methods
- Keep classes under 300 lines, methods under 30 lines when practical
- Extract complex logic into well-named private methods
- Use records (Java 16+) or data classes (Kotlin) for DTOs

## Dependency Injection
- Use constructor injection over field injection
- Keep constructors simple — no business logic
- Use framework DI (Spring, Guice, Dagger) for wiring
- Prefer interfaces over concrete types in constructor parameters
- Avoid service locator pattern — prefer explicit dependencies

## Error Handling
- Use checked exceptions only for recoverable conditions
- Prefer unchecked exceptions (RuntimeException subclasses) for programming errors
- Create custom exception classes for domain errors
- Never catch `Exception` or `Throwable` generically
- Always log or re-throw — never silently swallow exceptions
- Use try-with-resources for `AutoCloseable` resources

## Kotlin-Specific
- Prefer `val` over `var` (immutability by default)
- Use data classes for value objects
- Use sealed classes for exhaustive when expressions
- Use extension functions to add behavior without inheritance
- Use coroutines for async work instead of callbacks
- Null safety: avoid `!!` — use `?.`, `?:`, `let`, `require`

## Testing
- Use JUnit 5 for Java, JUnit 5 or Kotest for Kotlin
- Use Mockito or MockK for mocking
- Follow Arrange-Act-Assert pattern
- Test naming: `should_returnUser_when_validIdProvided`
- Use `@ParameterizedTest` for data-driven tests
- Integration tests with `@SpringBootTest` or TestContainers

## Patterns
- Repository pattern for data access
- Service layer for business logic
- Controller/handler for HTTP endpoints
- Use Builder pattern for complex object construction
- Prefer composition over inheritance
- Use Optional (Java) for nullable return values — never for parameters

## Code Quality
- Format with Google Java Format or ktlint (Kotlin)
- Lint with SpotBugs, Error Prone, or detekt (Kotlin)
- Static analysis with SonarQube or Checkstyle
- Javadoc for public APIs, KDoc for Kotlin
- Keep dependencies up to date — audit with Dependabot or Renovate
