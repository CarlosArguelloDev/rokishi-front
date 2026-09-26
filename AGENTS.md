# Repository Guidelines

## Project Structure & Module Organization

Application code lives in `src/`. `main.tsx` initializes React and `App.tsx` composes the screen. Put reusable UI in `src/components/`, views in `src/pages/`, page shells in `src/layouts/`, and images in `src/assets/`. Files served unchanged belong in `public/`. Kumo and Tailwind setup is in `src/App.css`; document styles are in `src/index.css`.

Use the `@/` alias for imports from `src`. Prefer `@cloudflare/kumo` components and `@phosphor-icons/react` icons before creating local equivalents.

## Build, Test, and Development Commands

- `npm install`: install the exact dependency tree recorded in `package-lock.json`.
- `npm run dev`: start Vite with hot module replacement, normally at `http://localhost:5173`.
- `npm run lint`: run Oxlint with React and TypeScript rules.
- `npm run build`: type-check with TypeScript and create the production bundle in `dist/`.
- `npm run preview`: serve the generated bundle for local production verification.

Run `npm run lint` and `npm run build` before submitting changes. Do not commit `node_modules/` or `dist/`.

## Coding Style & Naming Conventions

Write TypeScript with two-space indentation, single quotes, and no semicolons, matching existing files. React component files and exported components use `PascalCase`; variables, hooks, and functions use `camelCase`; constants use `UPPER_SNAKE_CASE`. Keep component props explicitly typed and avoid `any`. CSS classes use descriptive kebab-case names such as `showcase-grid`.

Keep components focused and accessible. Use semantic elements, visible focus states, labels, and appropriate `aria-*` attributes. Preserve Kumo's required CSS import order in `App.css`. Reuse design tokens such as `--color-kumo-default` instead of introducing isolated colors.

## Testing Guidelines

No automated test runner is configured yet. Until one is added, `npm run lint` and `npm run build` are mandatory checks. Manually verify changed interactions in the Vite development server at desktop and mobile widths, including keyboard navigation, overflow, loading states, and light/dark appearance. When tests are introduced, colocate them as `ComponentName.test.tsx` and add the command to `package.json`.

## Commit & Pull Request Guidelines

History uses concise Conventional Commit subjects such as `fix:` and `docs:`; use `feat:`, `fix:`, `docs:`, or `chore:` as appropriate. Keep commits focused. Pull requests should explain user-visible behavior, list verification commands, and link relevant issues. Include before/after screenshots for visual changes and call out new dependencies or configuration.

## Security & Configuration

Never place secrets in frontend code. Values prefixed with `VITE_` are bundled for the browser and must be treated as public. Keep API URLs environment-specific and validate external data before rendering it.

## Rokishi Project Context

Rokishi is a management system for 3D printing and production using different types of machines.

The application consists of two independent repositories:

- `rokishi-front`: React, TypeScript, Vite, Tailwind and Kumo.
- `rokishi-back`: REST API written in Go with PostgreSQL.

The backend is deployed to Heroku. The frontend is deployed to Cloudflare Pages.

When implementing a feature, determine whether it requires changes to the frontend, backend, or both.

If the backend repository is available in the workspace, inspect the relevant implementation before integrating an endpoint. If it is unavailable, request the API contract instead of inventing one.

Do not modify the backend solely because the frontend would be easier to implement differently.

## API Integration

The Go API is the source of truth for business rules and data contracts.

- Reuse existing endpoints whenever possible.
- Do not invent API routes, JSON fields, response structures, or error codes.
- Keep API requests separate from presentational components.
- Use TypeScript types for request and response data.
- Validate or narrow untrusted API responses when necessary.
- Handle loading, empty, success, and error states.
- Do not duplicate backend business logic in React.
- Avoid introducing an HTTP client dependency unless the existing approach is insufficient.
- Keep API URLs configurable through environment variables.

Use `VITE_API_URL` as the frontend's public API base URL, provided this matches the existing configuration.

Never place API keys, database credentials, or private tokens in frontend environment variables.

## Fullstack Development Workflow

When a requested feature involves both repositories:

1. Inspect the existing frontend implementation.
2. Inspect the relevant backend endpoints and data structures.
3. Identify the current API contract.
4. Explain which changes belong to each repository.
5. Present a short implementation plan before making significant changes.
6. Implement only the requested functionality.
7. Preserve compatibility with existing API consumers when possible.
8. Run the relevant checks in both repositories.
9. Summarize changes separately for frontend and backend.

If a required backend endpoint does not exist, explain the missing contract before implementing a frontend integration.

Do not create mock API responses as a substitute for an existing production endpoint without explicitly identifying them as mocks.

## UI and User Experience

Follow the existing visual language established by Kumo, Tailwind, and the project's components.

- Reuse existing layouts, components, and design tokens.
- Avoid creating duplicate UI components.
- Keep pages focused on their corresponding functionality.
- Preserve responsive behavior on desktop and mobile.
- Use semantic HTML and accessible interactive elements.
- Provide appropriate feedback for asynchronous operations.
- Prevent duplicate submissions when a request is already processing.
- Display useful error messages without exposing internal server details.
- Preserve the existing light and dark theme behavior.

Do not redesign unrelated screens while implementing a feature.

## API Deployment Compatibility

The frontend and backend are deployed independently.

When changing an API integration:

- Consider whether the frontend can work with the currently deployed backend.
- Prefer backward-compatible API changes.
- Identify whether the backend must be deployed before the frontend.
- Do not assume both deployments happen simultaneously.
- Do not change production API URLs without authorization.
- Do not modify Cloudflare Pages, Jenkins, or Heroku configuration unless explicitly requested.

Local development must use the configured development API URL rather than hardcoded production addresses.

## Completion Requirements

Before completing a task:

1. Review the changes for unrelated modifications.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run any additional relevant tests if available.
5. Report checks that could not be executed.
6. Explain how to verify the feature manually.
7. Identify any required backend changes or deployment dependencies.

Do not commit, push, or deploy changes unless explicitly requested.

Finish with a concise summary of modified files, implemented functionality, verification results, and outstanding decisions.