# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- AI tutor at `/tutor`: retrieval-augmented answers over the site content (hybrid BM25 + Gemini embeddings with Reciprocal Rank Fusion, grounded generation with Gemini Flash, numbered citations). See `docs/rag-tutor.md`.
- `pnpm rag:index` builds the incremental RAG index (`data/rag/index.json`).
- On Vercel the site now builds in server mode so `/api/tutor` runs as a serverless function; every other target keeps the static export.
- AI Engineering module: roadmap, RAG pipeline simulator, hands-on RAG exercise with pgvector, quiz, flashcards, production checklist, and interview questions.
- Unit tests for the RAG pipeline simulator engine.

### Changed

- Regenerated social images with Bancada branding.
- Replaced upstream author resources in the roadmap with official documentation.
- Centralized the public site URL in `lib/site.ts` (`NEXT_PUBLIC_SITE_URL`), so canonical tags, the sitemap, robots.txt and social images point to the real host.
- Translated the fixed labels on generated social images to Portuguese.
- Translated the games catalog, quiz titles, game pages and the interface of every simulator to Portuguese (pt-BR). Terminal commands, protocol messages and real tool output stay in English on purpose.
- Translated the search index static pages and added the AI roadmap to site search.
- Binary simulator predict-mode feedback is now in Portuguese (tests updated).
- Upgraded dependencies and pinned transitive versions to clear all high and critical audit findings.
- Fixed all TypeScript errors and made the typecheck a required CI step.

### Fixed

- The embedded Cards Against DevOps game imported a default export that does not exist.
- Removed links to blog posts that do not exist on this site.

### Removed

- Unused `calendar`, `chart` and `resizable` UI components and their dependencies.
- Third-party ad slots, sponsor blocks, and referral links inherited from the upstream project.

## [0.1.0] - 2026-09-08

### Added

- Interactive DevOps and system design simulators.
- Practical exercises, quizzes, flashcards, and checklists.
- Learning roadmaps for structured study paths.
- Educational terminals for hands-on command-line practice.
- Progressive Web App support.
- Unit and end-to-end test suites.
- Docker configuration and GitHub Actions workflows.
- Open source documentation and governance resources.
- Apache License 2.0.

[Unreleased]: https://github.com/victrhugo/bancada/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/victrhugo/bancada/releases/tag/v0.1.0
