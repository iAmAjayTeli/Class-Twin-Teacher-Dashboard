# Contributing to ClassTwin

Thank you for considering contributing to ClassTwin! Here's how you can help.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Commit using conventional commits: `git commit -m "feat: add feature"`
6. Push and open a Pull Request

## Development Setup

`ash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Run both frontend and backend
npm run dev
`

## Code Style

- Use **2-space indentation**
- Follow existing component patterns
- Add JSDoc comments for utility functions
- Use meaningful variable names

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` â€” New feature
- `fix:` â€” Bug fix
- `docs:` â€” Documentation only
- `chore:` â€” Build, tooling, or maintenance
- `refactor:` â€” Code change that neither fixes a bug nor adds a feature

## Reporting Issues

Please use GitHub Issues and include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
