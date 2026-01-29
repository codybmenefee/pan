#!/bin/bash
# Railway GraphQL API helper script

QUERY="$1"
VARIABLES="${2:-{}}"

RAILWAY_TOKEN="${RAILWAY_TOKEN:-$(cat ~/.railway/token 2>/dev/null || echo "")}"

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "Error: RAILWAY_TOKEN not set" >&2
  exit 1
fi

curl -s -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $QUERY, \"variables\": $VARIABLES}" | jq .
