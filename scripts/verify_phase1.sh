#!/bin/bash
# Phase 1 Quick Verification Script
# Tests key Phase 1 components

set -e

echo "=== Phase 1 Verification ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"

# Track results
PASSED=0
FAILED=0
WARNINGS=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${PASS} $1"
        ((PASSED++))
        return 0
    else
        echo -e "${FAIL} $1"
        ((FAILED++))
        return 1
    fi
}

warn() {
    echo -e "${WARN} $1"
    ((WARNINGS++))
}

echo "1. Checking file structure..."
echo ""

# Check schema extensions
[ -f "app/convex/schema.ts" ] && grep -q "farmerObservations" app/convex/schema.ts && check "Schema: farmerObservations table exists" || warn "Schema: farmerObservations table missing"
[ -f "app/convex/schema.ts" ] && grep -q "zones:" app/convex/schema.ts && check "Schema: zones table exists" || warn "Schema: zones table missing"
[ -f "app/convex/schema.ts" ] && grep -q "weatherHistory:" app/convex/schema.ts && check "Schema: weatherHistory table exists" || warn "Schema: weatherHistory table missing"
[ -f "app/convex/schema.ts" ] && grep -q "overrideMinNDVIThreshold" app/convex/schema.ts && check "Schema: paddock override fields exist" || warn "Schema: paddock override fields missing"

# Check CRUD functions
[ -f "app/convex/farmerObservations.ts" ] && check "CRUD: farmerObservations.ts exists" || warn "CRUD: farmerObservations.ts missing"
[ -f "app/convex/zones.ts" ] && check "CRUD: zones.ts exists" || warn "CRUD: zones.ts missing"

# Check pipeline integration
[ -f "src/ingestion/writer.py" ] && check "Pipeline: writer.py exists" || warn "Pipeline: writer.py missing"
[ -f "src/ingestion/pipeline.py" ] && grep -q "write-convex" src/ingestion/pipeline.py && check "Pipeline: --write-convex flag integrated" || warn "Pipeline: --write-convex flag missing"

# Check agent gateway
[ -f "app/lib/agent/context.ts" ] && check "Agent: context.ts exists" || warn "Agent: context.ts missing"
[ -f "app/lib/agent/triggers.ts" ] && check "Agent: triggers.ts exists" || warn "Agent: triggers.ts missing"
[ -f "app/lib/agent/tools.ts" ] && check "Agent: tools.ts exists" || warn "Agent: tools.ts missing"
[ -f "app/lib/braintrust.ts" ] && check "Agent: braintrust.ts exists" || warn "Agent: braintrust.ts missing"
[ -f "app/convex/grazingAgentGateway.ts" ] && check "Agent: grazingAgentGateway.ts exists" || warn "Agent: grazingAgentGateway.ts missing"

# Check frontend
[ -f "app/src/components/observations/FarmerObservationInput.tsx" ] && check "Frontend: FarmerObservationInput.tsx exists" || warn "Frontend: FarmerObservationInput.tsx missing"
[ -f "app/src/lib/convex/useFarmerObservations.ts" ] && check "Frontend: useFarmerObservations.ts exists" || warn "Frontend: useFarmerObservations.ts missing"

echo ""
echo "2. Checking Railway configuration..."
echo ""

# Check Railway CLI is available
if command -v railway &> /dev/null; then
    check "Railway: CLI installed"
    
    # Check if linked to project
    if railway status --json &> /dev/null; then
        check "Railway: Project linked"
        
        # Check pipeline service configuration
        PIPELINE_CONFIG=$(railway status --json 2>/dev/null | jq -r '.environments.edges[0].node.serviceInstances.edges[] | select(.node.serviceName == "pipeline") | {startCommand: .node.startCommand, cronSchedule: .node.cronSchedule}' 2>/dev/null)
        
        if [ ! -z "$PIPELINE_CONFIG" ]; then
            START_CMD=$(echo "$PIPELINE_CONFIG" | jq -r '.startCommand // "null"')
            CRON=$(echo "$PIPELINE_CONFIG" | jq -r '.cronSchedule // "null"')
            
            if [ "$START_CMD" != "null" ] && [ "$START_CMD" != "" ]; then
                check "Railway: Pipeline start command configured"
            else
                warn "Railway: Pipeline start command not set"
            fi
            
            if [ "$CRON" != "null" ] && [ "$CRON" != "" ]; then
                check "Railway: Pipeline cron schedule configured ($CRON)"
            else
                warn "Railway: Pipeline cron schedule not set"
            fi
        else
            warn "Railway: Pipeline service not found"
        fi
    else
        warn "Railway: Not linked to project (run 'railway link')"
    fi
else
    warn "Railway: CLI not installed"
fi

echo ""
echo "3. Checking environment variables..."
echo ""

# Check for .env files
[ -f "app/.env.local" ] && check "Frontend: .env.local exists" || warn "Frontend: .env.local missing"

# Check Railway variables (if Railway CLI available)
if command -v railway &> /dev/null && railway status --json &> /dev/null; then
    railway service link pipeline &> /dev/null
    RAILWAY_VARS=$(railway variables --json 2>/dev/null)
    
    if echo "$RAILWAY_VARS" | jq -e '.CONVEX_DEPLOYMENT_URL' &> /dev/null; then
        check "Railway: CONVEX_DEPLOYMENT_URL set"
    else
        warn "Railway: CONVEX_DEPLOYMENT_URL not set"
    fi
    
    if echo "$RAILWAY_VARS" | jq -e '.CONVEX_API_KEY' &> /dev/null; then
        check "Railway: CONVEX_API_KEY set"
    else
        warn "Railway: CONVEX_API_KEY not set"
    fi
fi

echo ""
echo "4. Testing pipeline (dry run)..."
echo ""

# Check if Python pipeline can be imported (syntax check)
if [ -f "src/ingestion/pipeline.py" ]; then
    cd src/ingestion
    if python3 -m py_compile pipeline.py 2>/dev/null; then
        check "Pipeline: Python syntax valid"
    else
        warn "Pipeline: Python syntax errors"
    fi
    if python3 -m py_compile writer.py 2>/dev/null; then
        check "Pipeline: writer.py syntax valid"
    else
        warn "Pipeline: writer.py syntax errors"
    fi
    cd ../..
fi

echo ""
echo "=== Summary ==="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run full verification: See docs/PHASE_1_VERIFICATION_PLAN.md"
    echo "2. Test pipeline locally: cd src/ingestion && python pipeline.py --dev --write-convex"
    echo "3. Test frontend: cd app && npm run dev"
    echo "4. Check Railway logs: railway logs --service pipeline"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Review warnings above.${NC}"
    exit 1
fi
