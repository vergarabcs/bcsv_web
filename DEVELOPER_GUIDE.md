# Developer Quick Start Guide

## First Time Setup

```bash
# Clone the repository
git clone https://github.com/vergarabcs/bcsv_web.git
cd bcsv_web

# Install dependencies
npm install

# Install e2e test dependencies
cd tests_e2e && npm install && cd ..

# Start development server
npm run start
```

Visit `http://localhost:3000` to see the app.

## Common Commands

```bash
# Development
npm run start              # Start dev server with IP display
npm run build              # Build for production
npm run dev                # Run production build
npm run lint               # Run ESLint

# Testing
npm test                   # Run unit tests
cd tests_e2e && npx playwright test --reporter=line  # Run e2e tests

# Backend (if using Amplify)
npm run backend            # Start Amplify sandbox
```

## Project Architecture

### State Management
- **Zustand**: Used for app-level state (doublesQueue, badmintonScore, etc.)
- **Immer**: For immutable state updates
- **Zundo**: For undo/redo functionality

### Routing
- **Next.js App Router**: File-based routing in `/app` directory
- **Dynamic routing**: Handled by AppRouter component
- **Lazy loading**: Components loaded on-demand

### Styling
- **Material-UI**: Primary UI component library
- **CSS Modules**: Component-scoped styles (`.module.css`)
- **Global styles**: `app/globals.css`

### Data Persistence
- **localStorage**: Primary storage for client-side data
- **AWS Amplify**: Optional cloud sync (configured but usage varies by app)

## Adding a New App

1. Create a new directory in `app/` (e.g., `app/my-app/`)
2. Add required files:
   ```
   app/my-app/
   ├── page.tsx           # Route entry point
   ├── MyApp.tsx          # Main component
   ├── MyApp.module.css   # Styles
   ├── types.ts           # TypeScript types
   └── useMyAppStore.ts   # Zustand store (if needed)
   ```
3. Register in `app/lib/components/AppRouter.tsx`:
   ```typescript
   const MyApp = lazy(() => import("@/app/my-app/MyApp"));
   
   const appList: AppMeta[] = [
     // ...existing apps
     {
       id: 'my-app',
       title: 'My App',
       description: 'Description of what my app does',
       component: MyApp
     }
   ];
   ```
4. Create e2e tests in `tests_e2e/tests/my-app.spec.ts`

## Testing Guidelines

### Unit Tests
- Use Jest + React Testing Library
- Place tests next to the code: `MyComponent.test.ts`
- Test business logic thoroughly (algorithms, state management)
- Mock external dependencies

### E2E Tests
- Use Playwright
- Run from `tests_e2e/` directory
- Use `--reporter=line` flag for cleaner output
- Test critical user flows

### Running Specific Tests
```bash
# Single unit test file
npm test -- app/hooks/__tests__/useTimer.test.ts

# Single e2e test
cd tests_e2e
npx playwright test tests/doublesQueue/comprehensive.spec.ts --reporter=line
```

## Code Style

### TypeScript
- Use strict mode
- Prefer interfaces over types for objects
- Export types from `types.ts` files
- Use enums for fixed sets of values

### React
- Functional components with hooks
- Use `'use client'` directive for client components
- Prefer Material-UI components over HTML elements
- Extract complex logic to custom hooks

### State Management (Zustand)
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface MyState {
  count: number;
  increment: () => void;
}

export const useMyStore = create<MyState>()(
  immer((set) => ({
    count: 0,
    increment: () => set((state) => { state.count++ }),
  }))
);
```

### CSS Modules
```typescript
import styles from './MyComponent.module.css';

const MyComponent = () => (
  <div className={styles.container}>Content</div>
);
```

## Debugging

### Chrome DevTools
- React DevTools extension recommended
- Zustand DevTools available via browser extension

### VS Code
- Recommended extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### Common Issues

**"next: not found" when running npm run lint**
```bash
npm install  # Reinstall dependencies
```

**Amplify backend not connecting**
```bash
npm run backend  # Start local Amplify sandbox
```

**Tests failing**
```bash
# Clear Jest cache
npm test -- --clearCache

# Update Playwright browsers
cd tests_e2e && npx playwright install
```

## Performance Tips

1. **Lazy load large components** - Use React.lazy() for route-level code splitting
2. **Memoize expensive calculations** - Use useMemo/useCallback
3. **Optimize images** - Use Next.js Image component
4. **Monitor bundle size** - Check `.next/analyze` after builds

## Contributing Workflow

1. Check [TODO.md](./TODO.md) for available tasks
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run linting and tests: `npm run lint && npm test`
5. Commit with descriptive message: `git commit -m "feat: add feature X"`
6. Push and create a pull request

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Documentation**: See [PROJECT_SUGGESTIONS.md](./PROJECT_SUGGESTIONS.md) for detailed analysis
- **Requirements**: App-specific requirements in `app/[app-name]/requirements.md`

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Docs](https://mui.com/)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [Playwright Docs](https://playwright.dev/)
