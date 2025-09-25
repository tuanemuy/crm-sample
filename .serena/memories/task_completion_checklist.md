# Task Completion Checklist

## After Completing Any Code Changes

### Required Steps (MUST DO)
1. **Type Checking**: Run `pnpm typecheck` to ensure no TypeScript errors
2. **Linting**: Run `pnpm lint:fix` to fix linting issues automatically
3. **Formatting**: Run `pnpm format` to ensure consistent code formatting
4. **Testing**: Run `pnpm test` if tests exist for the modified code

### Important Checks
- Verify all imports are correct and used
- Ensure error handling follows Result<T, E> pattern
- Check that new functions have proper TypeScript types
- Confirm no console.log statements left in production code
- Validate that all Zod schemas are properly defined

## For Backend Changes
- Ensure Repository methods return Result types
- Verify Application services use context pattern
- Check that domain types are properly exported
- Confirm port interfaces match implementations
- Test database operations work correctly

## For Frontend Changes
- Verify Server Actions handle errors properly
- Check forms use React Hook Form with Zod validation
- Ensure components follow React 19 patterns
- Validate Tailwind CSS classes are correct
- Test responsive design works properly

## For New Features
- Add appropriate tests for new functionality
- Update types in domain layer if needed
- Implement repository methods if data persistence required
- Create application service for business logic
- Add server action for frontend integration
- Build React components for UI

## Before Committing
1. Run full quality check: `pnpm typecheck && pnpm lint:fix && pnpm format`
2. Ensure all tests pass: `pnpm test`
3. Review changes with `git diff`
4. Write clear, descriptive commit message
5. Update task status if using task management

## Common Issues to Check
- No unused imports or variables
- All async operations properly awaited
- Error messages are user-friendly
- No hardcoded values that should be config
- Database transactions handled properly
- File uploads use StorageManager correctly