# Development Patterns and Best Practices

## Hexagonal Architecture Pattern

### Domain Layer Rules
- No dependencies on external frameworks
- Pure business logic only
- Define port interfaces for external dependencies
- Use branded types for entity IDs
- Types should be immutable where possible

### Application Layer Pattern
```typescript
// Each use case is a function that takes context
export async function createCustomer(
  ctx: Context,
  input: CreateCustomerInput
): Promise<Result<Customer, ApplicationError>> {
  // Validate input
  // Call domain logic
  // Use repository through context
  // Return Result type
}
```

### Repository Pattern
```typescript
// All repository methods return Result types
export class DrizzlePgliteCustomerRepository implements CustomerRepository {
  async create(customer: Customer): Promise<Result<Customer, RepositoryError>> {
    // Implementation using Drizzle ORM
    return Result.ok(customer);
  }
}
```

## Error Handling Pattern
```typescript
// Define domain-specific errors
export class CustomerError extends AnyError {
  constructor(message: string, cause?: unknown) {
    super("CustomerError", message, cause);
  }
}

// Use Result type for returns
return Result.err(new CustomerError("Customer not found"));
```

## Context Pattern for Dependency Injection
```typescript
// Define context interface
export interface Context {
  customerRepository: CustomerRepository;
  userRepository: UserRepository;
  // ... other dependencies
}

// Create context in main entry point
const context = createContext();

// Pass context to application services
const result = await createCustomer(context, input);
```

## Server Action Pattern
```typescript
"use server";
export async function createCustomerAction(input: FormData) {
  // Parse and validate input
  const validated = schema.safeParse(input);
  
  // Call application service
  const result = await createCustomer(context, validated.data);
  
  // Handle Result and return appropriate response
  if (result.isErr()) {
    return { error: result.error.message };
  }
  return { data: result.value };
}
```

## React Component Pattern
```typescript
// Server Component by default
export async function CustomerList() {
  const customers = await getCustomers();
  return <CustomerTable customers={customers} />;
}

// Client Component when needed
"use client";
export function CustomerForm() {
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
  });
  // Form implementation
}
```

## Testing Pattern
```typescript
describe("createCustomer", () => {
  it("should create a customer successfully", async () => {
    // Arrange: Setup mock context
    const mockContext = createMockContext();
    
    // Act: Call function
    const result = await createCustomer(mockContext, input);
    
    // Assert: Check Result
    expect(result.isOk()).toBe(true);
  });
});
```

## Database Migration Pattern
- Use Drizzle Kit for migrations
- Keep migrations in `src/core/adapters/drizzlePglite/migrations/`
- Version migrations with timestamps
- Test migrations in development first

## File Organization Pattern
- One domain per folder
- Types in `types.ts`
- Ports in `ports/` subfolder
- One use case per file
- Group related components together

## Import Pattern
```typescript
// Use path aliases
import { Customer } from "@/core/domain/customer/types";
import { createCustomer } from "@/core/application/customer/createCustomer";
import { context } from "@/context";
```

## Validation Pattern
- Use Zod schemas for all external input
- Validate at system boundaries (API, forms)
- Transform to domain types after validation
- Keep validation schemas close to usage