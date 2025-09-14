# O-UI Business Rules Engine

This is a comprehensive business rules engine with Monaco Editor integration, built with Next.js and TypeScript.

## Features
- Monaco Editor with custom business rules language
- IndexedDB-first offline architecture  
- Auto-generated components (tree, table, form, modal)
- Branching system with Copy-on-Write support
- Real-time Python code generation

## Getting Started
```bash
npm install
npm run dev
```

## Architecture
- **Action System**: IndexedDB-first with TanStack Query
- **Editor**: Monaco with custom completion providers
- **Branching**: Git-like workspace isolation
- **Components**: Schema-driven auto-generation

