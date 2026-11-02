# Contributing to Doit

First off, thank you for considering contributing to **Doit**! It's people like you who make open source projects wonderful.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## How Can I Contribute?

### Reporting Bugs
* Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/Surya-T-S/Doit/issues).
* Open a new issue using our **Bug Report** template.
* Include detailed steps to reproduce the behavior, expected outcome, and your OS version.

### Suggesting Enhancements
* Open a new issue using our **Feature Request** template.
* Clearly describe the goal and why this would benefit Doit users while maintaining our core principle of **minimalism and focus**.

### Pull Requests
1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server to test changes:
   ```bash
   npm run electron:dev
   ```
4. Verify there are zero TypeScript compiler errors:
   ```bash
   npm run build
   ```
5. Commit your changes using conventional commit messages (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
6. Push to your fork and submit a Pull Request.

---

## Development Guidelines

* **Keep it minimal**: Doit is intentionally distraction-free. Avoid unnecessary UI bloat or overly complex settings.
* **Offline-first**: Never introduce features that require mandatory cloud synchronization without local-first fallback.
* **Code style**: Use functional React components, TypeScript strict typing, and Tailwind CSS utilities.

