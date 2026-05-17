# BCSV Web - Multi-App Platform

A Next.js application platform hosting multiple web applications, built with AWS Amplify, Material-UI, and TypeScript.

## 🎯 What's Inside

This repository contains several standalone web applications:

1. **Doubles Queue** - Advanced queue management system for badminton doubles with ELO rating system
2. **Badminton Score** - Real-time score tracking with gamepad support and PWA capabilities  
3. **Schedule Finder** - Find common availability among multiple people
4. **Word Factory** - Word puzzle game built with a comprehensive dictionary
5. **Form Validation** - Demo of server-side validation patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run start

# Build for production
npm run build

# Run production server
npm run dev
```

The app will be available at `http://localhost:3000`

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (from tests_e2e directory)
cd tests_e2e
npm install
npx playwright test --reporter=line
```

## 📱 Applications Overview

### Doubles Queue
Advanced badminton queue manager with:
- Multi-court management
- ELO-based rating system
- Smart player matching algorithm
- Session statistics and trends
- See [requirements](./app/doublesQueue/requirements.md) for full details

### Badminton Score
Progressive Web App for score tracking:
- Customizable game settings
- Gamepad/controller support
- Installable on mobile devices
- Offline capable

### Schedule Finder
Collaborative scheduling tool:
- Visual Gantt chart interface
- Find common free times
- Support for multiple participants
- Timezone aware

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: Material-UI (MUI) v7
- **State Management**: Zustand with Immer
- **Authentication**: AWS Amplify + Cognito
- **Backend**: AWS Amplify Gen 2 (AppSync + DynamoDB)
- **Testing**: Jest + Playwright
- **Language**: TypeScript

## 📋 What to Work On Next

See [PROJECT_SUGGESTIONS.md](./PROJECT_SUGGESTIONS.md) for a comprehensive analysis of improvement opportunities.

Quick priorities:
1. Fix build/lint infrastructure
2. Add unit tests for critical algorithms
3. Complete Doubles Queue export/import feature
4. Improve PWA capabilities
5. Add comprehensive documentation

See [TODO.md](./TODO.md) for a quick-reference checklist.

## 🏗️ Project Structure

```
bcsv_web/
├── app/                      # Next.js app directory
│   ├── doublesQueue/        # Badminton queue manager
│   ├── badmintonScore/      # Score tracker PWA
│   ├── scheduleFinder/      # Schedule coordination tool
│   ├── word-factory/        # Word puzzle game
│   ├── serverSideValidationApp/  # Form validation demo
│   └── lib/                 # Shared utilities and components
├── amplify/                 # AWS Amplify backend config
├── tests_e2e/              # Playwright e2e tests
├── public/                 # Static assets
└── tools/                  # Utility scripts
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Key areas needing help:
- Unit test coverage
- Documentation
- PWA enhancements  
- Accessibility improvements

## 🚢 Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws) of the AWS Amplify documentation.

## 🔒 Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for security issue reporting guidelines.

## 📄 License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.