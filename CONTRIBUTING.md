# Contributing to OpenPasture

Thanks for helping improve OpenPasture! This project focuses on the Morning Farm Brief experience and adaptive grazing intelligence.

## Table of Contents

- [First-Time Contributors](#first-time-contributors)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Running Tests](#running-tests)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Pull Requests](#pull-requests)
- [Code Review Process](#code-review-process)
- [Issues](#issues)
- [Code of Conduct](#code-of-conduct)

## First-Time Contributors

Welcome! Here's how to get started:

1. **Fork the repository** - Click the "Fork" button on GitHub
2. **Clone your fork** - `git clone https://github.com/YOUR_USERNAME/pan.git`
3. **Set up the development environment** - Follow the steps below
4. **Find an issue** - Look for issues labeled `good first issue` or `help wanted`
5. **Ask questions** - Open a discussion if you need clarification

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- A [Convex](https://convex.dev) account (free tier available)
- A [Clerk](https://clerk.dev) account (free tier available) - or use dev auth mode

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
# Convex - Get from your Convex dashboard
VITE_CONVEX_URL=https://your-project.convex.cloud

# Clerk Authentication (choose one option)
# Option A: Use Clerk (production-like)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Option B: Skip Clerk for local development
VITE_DEV_AUTH=true
```

### 3. Set Up Convex

If you haven't already, create a Convex project:

```bash
npx convex dev
```

This will:
- Prompt you to log in or create a Convex account
- Create a new project (or link to existing)
- Start the Convex dev server

### 4. Set Up Clerk (Optional)

For full authentication:

1. Create a Clerk application at [clerk.dev](https://clerk.dev)
2. Copy your publishable key to `.env.local`
3. Configure your Clerk application settings

Alternatively, set `VITE_DEV_AUTH=true` to bypass authentication during development.

### 5. Start Development

In separate terminals:

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Vite dev server
npm run dev
```

The app will be available at http://localhost:5173

## Development Workflow

1. **Create a branch** from `dev` for your work
2. **Make small, focused changes** - One feature or fix per PR
3. **Run checks before committing**:
   ```bash
   npm run lint      # Check for linting errors
   npm run test      # Run unit tests
   npx tsc -b        # TypeScript compilation check
   ```
4. **Include tests** for new functionality when possible
5. **Update documentation** if behavior changes

## Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode during development
npm run test:watch
```

Tests are located alongside source files with `.test.ts` or `.test.tsx` extensions.

### Writing Tests

- Use Vitest for unit tests
- Place test files next to the code they test
- Focus on testing pure functions and business logic
- See `src/lib/*.test.ts` for examples

## Code Style

We use ESLint and Prettier for code consistency.

```bash
# Check for linting issues
npm run lint

# Check formatting
npm run format:check

# Auto-fix formatting
npm run format
```

### Key Style Guidelines

- Use TypeScript strict mode
- Prefer functional components with hooks
- Keep components small and focused
- Use meaningful variable and function names
- Add comments only when the code isn't self-explanatory

## Git Workflow

### Branching Strategy

- `main` - Production-ready code
- `dev` - Integration branch for ongoing development
- Feature branches - Created from `dev`, merged back via PR

### Branch Naming

Use descriptive branch names:
- `feat/add-pasture-editing` - New features
- `fix/map-zoom-issue` - Bug fixes
- `docs/update-setup-guide` - Documentation
- `refactor/simplify-auth-flow` - Code improvements

### Commit Messages

Write clear, concise commit messages:

```
feat: add pasture boundary editing

- Add drag handles for boundary vertices
- Implement save confirmation dialog
- Update map component to handle edit mode
```

**Format:**
- Start with type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Use imperative mood ("add" not "added")
- Keep first line under 72 characters
- Add details in body when needed

## Pull Requests

### Before Opening a PR

1. Ensure all checks pass locally:
   ```bash
   npm run lint && npm run test && npx tsc -b
   ```
2. Rebase your branch on latest `dev`
3. Write a clear PR description

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Bullet points of specific changes
- Be specific about what files/components changed

## Test Plan
- How you tested these changes
- Include screenshots for UI changes

## Related Issues
Closes #123
```

### PR Guidelines

- Keep PRs small and focused (under 400 lines when possible)
- Include screenshots or videos for UI changes
- Respond to review feedback promptly
- Squash commits if requested

## Code Review Process

All PRs require at least one approval before merging.

### For Authors

- Be responsive to feedback
- Explain your decisions when asked
- Make requested changes or discuss alternatives

### For Reviewers

- Review within 1-2 business days when possible
- Be constructive and specific in feedback
- Approve when ready, request changes when needed
- Focus on correctness, maintainability, and clarity

### What We Look For

- Code correctness and edge cases
- TypeScript types are accurate
- No unnecessary complexity
- Tests for new functionality
- Documentation updates if needed

## Issues

### Reporting Bugs

Use the bug report template and include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

### Requesting Features

Use the feature request template and include:
- Clear description of the feature
- Use case and motivation
- Potential implementation approach (optional)

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

---

Questions? Open a discussion or reach out to the maintainers. Thanks for contributing!
