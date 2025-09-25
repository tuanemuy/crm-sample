# Code Style and Conventions

## General Principles
- TypeScript strict mode enabled
- Functional programming approach with Result types
- Domain-driven design principles
- Clean/Hexagonal architecture patterns

## Naming Conventions
- **Files**: camelCase for TypeScript files (e.g., `customerRepository.ts`)
- **Components**: PascalCase for React components
- **Functions**: camelCase for functions and methods
- **Types/Interfaces**: PascalCase for types and interfaces
- **Constants**: UPPER_SNAKE_CASE for constants
- **Domain folders**: lowercase (e.g., `customer`, `lead`, `deal`)

## TypeScript Conventions
- Use explicit type annotations for function parameters and return types
- Prefer interfaces over type aliases for object types
- Use branded types for domain identifiers (e.g., `CustomerId`, `LeadId`)
- Import Zod as `import { z } from "zod/v4"` (compatibility mode)

## Error Handling
- All backend functions return `Result<T, E>` or `Promise<Result<T, E>>`
- Error types extend base `AnyError` class from `src/lib/error.ts`
- Each module has its own error types (e.g., `RepositoryError`, `ApplicationError`)
- Use neverthrow's Result.ok() and Result.err() for returns

## File Organization
- Domain logic in `src/core/domain/{domain}/`
- Application services in `src/core/application/{domain}/`
- Adapters in `src/core/adapters/{service}/`
- React components in `src/app/components/`
- Server actions in `src/actions/{domain}.ts`

## React/Next.js Conventions
- Use functional components with hooks
- Fetch data at component level, not page level
- Server Components by default, Client Components when needed
- Use Server Actions for mutations
- Form handling with React Hook Form and Zod schemas

## Testing Conventions
- Test files named `{file}.test.ts` or `{file}.{scenario}.test.ts`
- Unit tests for domain logic and application services
- Integration tests for adapters
- Use Vitest with describe/it blocks
- Mock dependencies using context pattern

## Import Order
1. External libraries
2. Core domain imports
3. Application layer imports
4. Adapter imports
5. Component imports
6. Utility/lib imports
7. Type imports

## Documentation
- No inline comments unless absolutely necessary
- Use descriptive function and variable names
- TypeScript types serve as documentation
- Separate documentation files in `docs/` folder