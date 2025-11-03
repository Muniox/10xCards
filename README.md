# 10x-cards

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/yourusername/10x-cards)
[![Node](https://img.shields.io/badge/node-22.14.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An AI-powered educational flashcard application that revolutionizes the way you create and study flashcards. Using advanced LLM models, 10x-cards automatically generates high-quality flashcards from your text, saving you time while helping you learn more effectively through spaced repetition.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Overview

Creating high-quality flashcards manually is time-consuming and often discourages people from using one of the most effective learning methods: spaced repetition. 10x-cards solves this problem by leveraging AI to automatically generate flashcard suggestions from any text you provide.

### Key Features

- **AI-Powered Generation**: Paste any text (1,000-10,000 characters) and let AI create flashcard suggestions
- **Manual Control**: Review, edit, accept, or reject AI-generated flashcards
- **Manual Creation**: Create flashcards manually when needed
- **User Management**: Secure authentication with registration and login
- **Spaced Repetition**: Integrated learning sessions using proven spaced repetition algorithms
- **Full CRUD Operations**: Edit and delete your flashcards anytime
- **Privacy Focused**: GDPR-compliant data storage with the right to delete your account and data

## Tech Stack

### Frontend
- **[Astro](https://astro.build/) 5.13.7** - Modern web framework for fast, content-focused applications with minimal JavaScript
- **[React](https://react.dev/) 19.1.1** - UI library for interactive components
- **[TypeScript](https://www.typescriptlang.org/) 5** - Type-safe JavaScript for better developer experience
- **[Tailwind CSS](https://tailwindcss.com/) 4.1.13** - Utility-first CSS framework for rapid UI development
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible, customizable component library

### Backend
- **[Supabase](https://supabase.com/)** - Open-source Backend-as-a-Service providing:
  - PostgreSQL database
  - Built-in authentication
  - JavaScript SDK
  - Self-hosting capabilities

### AI Integration
- **[Openrouter.ai](https://openrouter.ai/)** - Unified API for multiple LLM providers:
  - Access to OpenAI, Anthropic, Google, and other models
  - Cost optimization through model selection
  - Financial limits and usage controls

### DevOps & Hosting
- **GitHub Actions** - CI/CD pipelines for automated testing and deployment
- **DigitalOcean** - Application hosting via Docker containers

## Getting Started Locally

### Prerequisites

- **Node.js 22.14.0** (specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Supabase account** (for database and authentication)
- **Openrouter.ai API key** (for AI flashcard generation)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/10x-cards.git
   cd 10x-cards
   ```

2. **Install Node.js version** (if using nvm):
   ```bash
   nvm install
   nvm use
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   Create a `.env` file in the project root with the following variables:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Openrouter AI Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:4321` (or the port shown in your terminal)

### Building for Production

```bash
npm run build
```

The production-ready files will be generated in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start the Astro development server with hot reload |
| Build | `npm run build` | Create an optimized production build |
| Preview | `npm run preview` | Preview the production build locally |
| Lint | `npm run lint` | Run ESLint to check for code quality issues |
| Lint Fix | `npm run lint:fix` | Automatically fix ESLint issues where possible |
| Format | `npm run format` | Format code using Prettier |
| Astro CLI | `npm run astro` | Access Astro CLI commands directly |

## Project Scope

### MVP Features (In Scope)

The current MVP includes the following functionality:

1. **AI-Powered Flashcard Generation**
   - Paste text content (1,000-10,000 characters)
   - Receive AI-generated flashcard suggestions
   - Review and modify suggestions before saving

2. **Manual Flashcard Management**
   - Create flashcards manually with custom front/back content
   - Edit existing flashcards (both manual and AI-generated)
   - Delete unwanted flashcards
   - View all flashcards in "My Flashcards" section

3. **User Authentication**
   - User registration and login
   - Secure session management
   - Account deletion with data removal

4. **Learning Sessions**
   - Spaced repetition algorithm integration
   - Interactive study sessions
   - Progress tracking per flashcard

5. **Data Management**
   - GDPR-compliant data storage
   - User privacy and data deletion rights
   - Statistics on AI generation vs. acceptance rates

### Out of Scope for MVP

The following features are explicitly excluded from the initial release:

- Custom or proprietary spaced repetition algorithms
- Gamification features (points, badges, leaderboards)
- Native mobile applications (iOS/Android)
- Document import from PDF, DOCX, or other formats
- Public API for third-party integrations
- Flashcard sharing or collaborative features
- Advanced notification systems
- Complex search and filtering by keywords
- Multi-language support

### User Journey

Typical user workflows include:

1. **New User**: Register → Paste text → Review AI suggestions → Accept flashcards → Start learning session
2. **Returning User**: Login → View my flashcards → Edit/Delete cards → Continue learning session
3. **Manual Creation**: Login → Create flashcard manually → Add to collection → Study in session

## Project Status

**Current Version**: 0.0.1 (MVP Development Phase)

This project is actively under development. The MVP focuses on core functionality:
- AI-powered flashcard generation
- Basic user management
- Spaced repetition learning sessions

### Success Metrics

The MVP aims to achieve:
- **75% acceptance rate** of AI-generated flashcards
- **75% of all flashcards** created using AI assistance (vs. manual creation)

These metrics will help validate the effectiveness of the AI generation feature and guide future improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with Astro, React, and AI to make learning more efficient.
