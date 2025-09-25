# Suggested Commands for Development

## Essential Development Commands

### Running the Application
- `pnpm dev` - Start development server with Turbopack (http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality Commands (Run after making changes)
- `pnpm typecheck` - Type check with TypeScript
- `pnpm lint:fix` - Lint and fix issues with Biome
- `pnpm format` - Format code with Biome
- `pnpm test` - Run tests with Vitest

### Database Commands
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations

### Task Management Commands
- `pnpm task todo <category>` - List all WIP tasks in category
- `pnpm task search <category> <query>` - Search tasks
- `pnpm task done <category> <id>` - Mark task as done
- `pnpm task wip <category> <id>` - Mark task as in progress
- `pnpm task get <category> <id>` - Get task details
- `pnpm task add <category> '[{"customId":"id","name":"Name","description":"Desc"}]'` - Add tasks

### Other Useful Commands
- `pnpm lint` - Check linting issues without fixing
- `pnpm format:check` - Check formatting without fixing

## Linux System Commands
- `ls -la` - List files with details
- `cd <directory>` - Change directory
- `pwd` - Print working directory
- `cat <file>` - Display file contents
- `grep -r <pattern> .` - Search for pattern in files
- `find . -name "*.ts"` - Find TypeScript files
- `tree -L 2` - Show directory tree (2 levels)

## Git Commands
- `git status` - Check repository status
- `git diff` - Show unstaged changes
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit staged changes
- `git log --oneline -10` - Show recent commits
- `git branch` - List branches
- `git checkout -b <branch>` - Create and switch to new branch

## Package Management
- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add production dependency
- `pnpm add -D <package>` - Add dev dependency
- `pnpm update` - Update dependencies
- `pnpm ls` - List installed packages

## Development Workflow
1. Make changes to code
2. Run `pnpm typecheck` to check types
3. Run `pnpm lint:fix` to fix linting issues
4. Run `pnpm format` to format code
5. Run `pnpm test` to ensure tests pass
6. Commit changes with descriptive message