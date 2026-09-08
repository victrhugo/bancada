# Bancada

Bancada is a free, open source platform for practicing DevOps through interactive learning. It
brings together simulators, exercises, quizzes, flashcards, checklists, roadmaps, and educational
terminals covering topics such as Docker, Kubernetes, Terraform, CI/CD, observability, security,
and system design.

## Development

Requirements:

- Node.js 22
- pnpm 10

Install the dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
pnpm check-format
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Governance and support

- Read the [changelog](CHANGELOG.md) for release history.
- See the [contribution guide](CONTRIBUTING.md) before proposing a change.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) when participating in the community.
- Report vulnerabilities according to the [security policy](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
