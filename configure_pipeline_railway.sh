#!/bin/bash
# Configure Railway pipeline service with cron schedule

ENV_ID="77c0140b-e29f-4923-bd75-c3967ec6d5f5"
SERVICE_ID="c6b91591-7f8a-49f2-a2dd-07c0d4366983"

# Get Railway API token
RAILWAY_TOKEN=$(railway whoami --json 2>/dev/null | jq -r '.token // empty')
if [ -z "$RAILWAY_TOKEN" ]; then
  RAILWAY_TOKEN=$(cat ~/.railway/token 2>/dev/null || echo "")
fi

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "Railway token not found. Please configure via Railway dashboard:"
  echo "1. Go to: https://railway.com/project/c09ac01f-7649-4f95-b4f0-1c7fbdba54cd"
  echo "2. Select 'pipeline' service"
  echo "3. Configure:"
  echo "   - Root Directory: src/ingestion"
  echo "   - Cron Schedule: 0 6 * * *"
  echo "   - Start Command: python pipeline.py --all-farms --write-convex"
  echo "   - Environment Variables: CONVEX_DEPLOYMENT_URL, CONVEX_API_KEY"
  exit 0
fi

# Use Railway GraphQL API to configure
echo "Configuring pipeline service via Railway API..."

# Note: Full GraphQL configuration requires the railway-api.sh script
# For now, provide manual instructions
echo ""
echo "To complete configuration, use Railway dashboard or run:"
echo "railway link"
echo "railway service pipeline"
echo ""
echo "Then configure in Railway dashboard:"
echo "- Root Directory: src/ingestion"
echo "- Cron Schedule: 0 6 * * * (runs daily at 6 AM)"
echo "- Start Command: python pipeline.py --all-farms --write-convex"
echo "- Set environment variables: CONVEX_DEPLOYMENT_URL and CONVEX_API_KEY"
