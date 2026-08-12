# Development Guide

## Project Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Code Style

This project uses ESLint and Prettier for code quality and consistency.

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format code with Prettier
npm run format
```

### Conventions

- **JavaScript/TypeScript**: 4-space indentation, single quotes, no semicolons
- **Vue components**: PascalCase filenames, `<script setup>` preferred
- **CSS**: BEM-like naming, scoped styles in components

## State Management (Pinia)

Stores are located in `src/stores/`:

| Store | File | Purpose |
|-------|------|---------|
| App | `app.ts` | Theme, loading state, page title |
| User | `user.ts` | Auth token, user data, login state |
| Notification | `notification.ts` | Toast messages, error notifications |

## HTTP Requests

Use the configured Axios instance from `src/utils/request.js`:

```js
import { get, post } from '@/utils/request'

// GET request
const data = await get('/api/endpoint')

// POST request
const result = await post('/api/endpoint', { key: 'value' })
```

The instance automatically:
- Injects the ****** from localStorage
- Redirects to `/login` on 401 responses
- Times out after 10 seconds

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: code style changes
refactor: code refactoring
test: add or update tests
chore: build process or tool changes
```

## Directory Structure

```
src/
├── assets/       Static assets and global CSS
├── components/   Reusable Vue components
├── composables/  Vue composable hooks
├── data/         Static data definitions
├── locales/      i18n translation files
├── router/       Vue Router configuration
├── services/     API service modules
├── stores/       Pinia state management
├── utils/        Utility functions
└── views/        Page-level Vue components
```
