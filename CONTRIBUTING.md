# Contributing to BlockHub

Thank you for considering contributing to BlockHub! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Specify your environment (OS, browser, version)

### Suggesting Enhancements

- Check if the enhancement has already been suggested in the Issues section
- Use the feature request template when creating a new issue
- Provide a clear description of the enhancement
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blockhub.git
   cd blockhub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blockhub.git
   cd blockhub
   ```

2. Build and start the Docker container:
   ```bash
   docker-compose up -d
   ```

## Coding Guidelines

### JavaScript/TypeScript

- Follow the ESLint configuration
- Use TypeScript for type safety
- Use async/await for asynchronous code
- Write meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props and state
- Follow the project's component structure

### CSS/Tailwind

- Use Tailwind CSS classes
- Follow the project's design system
- Ensure responsive design works on all screen sizes

## Testing

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Test on different browsers if making UI changes

## Documentation

- Update documentation for new features or changes
- Use clear and concise language
- Include code examples where appropriate

## Commit Messages

- Use clear and meaningful commit messages
- Start with a verb in the present tense (e.g., "Add", "Fix", "Update")
- Reference issue numbers when applicable

## Review Process

- All PRs will be reviewed by at least one maintainer
- Address review comments promptly
- Be open to feedback and suggestions

Thank you for contributing to BlockHub!