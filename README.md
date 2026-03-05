# Sonata Finance

A comprehensive financial management platform that empowers users to track, analyze, and optimize their financial health through intelligent insights and user-friendly interfaces.

## Features

- **Dashboard**: Visual overview of your financial health
- **Budget**: Monthly expense tracking and planning
- **Investments**: Track and analyze your investment portfolio
- **Liabilities**: Monitor and manage your debts
- **AI-Powered Insights**: Get intelligent financial analysis with Sidekick
- **Secure Authentication**: Login via email/password or Google Sign-In

## Technology Stack

- React with TypeScript frontend
- Express.js backend
- PostgreSQL with Drizzle ORM
- OpenAI API for financial analysis
- Firebase Authentication
- Comprehensive data visualization
- Modern responsive design

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL database
- OpenAI API key
- Firebase project

### Environment Variables

Create a `.env` file with the following variables:

```
# Database
DATABASE_URL=your_postgres_connection_string

# Authentication
SESSION_SECRET=your_session_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Firebase (Frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Email (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.