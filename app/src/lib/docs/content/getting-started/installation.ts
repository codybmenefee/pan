import type { ArticleContent } from '../types'

export const installation: ArticleContent = {
  title: 'Installation',
  description:
    'Technical setup guide for developers running the platform locally or deploying to production. Covers environment configuration, dependencies, and common troubleshooting.',
  sections: [
    {
      heading: 'System Requirements',
      content: `The platform requires:

- **Node.js 18+** - LTS version recommended
- **npm 9+** - Comes with Node.js
- **Modern browser** - Chrome, Firefox, Safari, or Edge (latest versions)

For the backend:
- **Convex account** - Free tier available at convex.dev
- **Anthropic API key** - Required for AI functionality`,
    },
    {
      heading: 'Environment Setup',
      content: `Clone the repository and install dependencies:`,
      codeExample: {
        language: 'bash',
        code: `git clone <repository-url>
cd app
npm install`,
      },
    },
    {
      heading: 'Environment Variables',
      content: `Create a \`.env.local\` file with the following variables:

**Required:**
- \`VITE_CONVEX_URL\` - Your Convex deployment URL (e.g., https://your-deployment.convex.cloud)

**Authentication (choose one):**
- \`VITE_CLERK_PUBLISHABLE_KEY\` - For Clerk authentication in production
- \`VITE_DEV_AUTH=true\` - For development mode without authentication

**Optional:**
- \`BRAINTRUST_API_KEY\` - For agent observability (set in Convex dashboard)
- \`BRAINTRUST_PROJECT_NAME\` - Defaults to 'grazing-agent'`,
      codeExample: {
        language: 'bash',
        filename: '.env.local',
        code: `VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_DEV_AUTH=true`,
      },
    },
    {
      heading: 'Development Mode',
      content: `Start the development servers. You'll need two terminal windows:

**Terminal 1 - Frontend:**`,
      codeExample: {
        language: 'bash',
        code: `npm run dev`,
      },
    },
    {
      heading: 'Backend Server',
      content: `**Terminal 2 - Convex Backend:**`,
      codeExample: {
        language: 'bash',
        code: `npx convex dev`,
      },
    },
    {
      heading: 'Accessing the Application',
      content: `Once both servers are running:

- Frontend: http://localhost:5173
- Convex Dashboard: https://dashboard.convex.dev

The Convex dashboard provides access to:
- Database tables and records
- Function logs and debugging
- Environment variable management
- Deployment history`,
    },
    {
      heading: 'Seeding Sample Data',
      content: `For development and testing, you can seed the database with sample farm data. From the Convex dashboard:

1. Navigate to Functions
2. Find \`seedData.seedSampleFarm\`
3. Run the function

This creates a demonstration farm with:
- Multiple pastures with geometry
- Historical observations
- Sample grazing events

Alternatively, use the Convex CLI:`,
      codeExample: {
        language: 'bash',
        code: `npx convex run seedData:seedSampleFarm`,
      },
    },
    {
      heading: 'Production Deployment',
      content: `For production deployments:

1. **Convex Production Deployment**
   - Create a production deployment in Convex dashboard
   - Set environment variables (including ANTHROPIC_API_KEY)
   - Deploy with \`npx convex deploy\`

2. **Frontend Hosting**
   - Build the frontend: \`npm run build\`
   - Deploy \`dist/\` folder to your hosting provider (Vercel, Netlify, etc.)
   - Set \`VITE_CONVEX_URL\` to production Convex URL

3. **Authentication**
   - Configure Clerk with production keys
   - Set up allowed domains and redirect URLs`,
    },
    {
      heading: 'Troubleshooting',
      content: `**"Cannot find module" errors**
Run \`npm install\` to ensure all dependencies are installed.

**Convex connection errors**
Verify \`VITE_CONVEX_URL\` is set correctly and the Convex dev server is running.

**Authentication errors**
For development, ensure \`VITE_DEV_AUTH=true\` is set. For production, verify Clerk configuration.

**Build errors with Braintrust**
The Convex bundler has known issues with native Node.js modules. See the CLAUDE.md file for the dynamic require workaround.

**Empty dashboard**
Run the seed function to populate sample data, or import your own farm data.`,
    },
  ],
  relatedArticles: [
    '/docs/getting-started/quick-start',
    '/docs/farm-setup/import',
    '/docs/platform-interfaces/auth',
  ],
}
