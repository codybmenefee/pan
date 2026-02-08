# Phase 1 Quick Test Guide

Quick verification steps to test Phase 1 components are working.

## Prerequisites Check ✅

All files and configuration are in place:
- ✅ Schema extensions (farmerObservations, zones, weatherHistory)
- ✅ CRUD functions
- ✅ Pipeline integration
- ✅ Agent gateway components
- ✅ Frontend components
- ✅ Railway cron configuration

## Quick Tests (15 minutes)

### 1. Test Pipeline Locally (5 min)

```bash
cd src/ingestion

# Activate virtual environment (if it exists)
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Set environment variables
export CONVEX_DEPLOYMENT_URL="https://tame-cow-155.convex.cloud"
export CONVEX_API_KEY="your-deploy-key-here"
export WRITE_TO_CONVEX="true"

# Run pipeline (use python3 if python command not found)
python3 pipeline.py --dev --write-convex --output /tmp/pan_test

# Check output
cat /tmp/pan_test/pipeline_result.json
```

**Note**: On macOS, use `python3` instead of `python`. If you have a virtual environment, activate it first.

**Expected**: Pipeline completes, writes observations to Convex, creates output file.

**Verify in Convex Dashboard**:
1. Go to https://dashboard.convex.dev
2. Navigate to `observations` table
3. Check for new entries with today's date

### 2. Test Farmer Observations (5 min)

**Via Convex Dashboard**:
1. Open Functions tab
2. Run mutation: `farmerObservations:create`
3. Use test data:
```json
{
  "farmId": "<your-farm-id>",
  "authorId": "test-user",
  "level": "farm",
  "targetId": "<farm-external-id>",
  "content": "Quick test observation",
  "tags": ["test"],
  "createdAt": "2026-01-23T12:00:00Z"
}
```

**Verify**:
- Run query: `farmerObservations:listByFarm` with same `farmId`
- Should return the observation you just created

### 3. Test Frontend (5 min)

```bash
cd app
npm run dev
```

1. Open http://localhost:5173
2. Navigate to farm/pasture view
3. Look for observation input component
4. Create a test observation
5. Verify it appears in the UI

**Expected**: Form works, observation appears, no console errors.

## Railway Cron Test

### Check Next Run Time

```bash
railway status --json | jq '.environments.edges[0].node.serviceInstances.edges[] | select(.node.serviceName == "pipeline") | .node.nextCronRunAt'
```

### Trigger Manual Run

```bash
railway up --service pipeline
railway logs --service pipeline --tail 50
```

**Expected**: Pipeline runs, writes to Convex, logs show success.

### Verify After Cron Run

After the scheduled run (6 AM UTC), check:
1. Railway logs show successful execution
2. Convex `observations` table has new entries
3. Frontend shows updated data

## Full Verification

For complete testing, see: [PHASE_1_VERIFICATION_PLAN.md](./PHASE_1_VERIFICATION_PLAN.md)

## Common Issues

### Pipeline Not Writing to Convex

**Check**:
- `CONVEX_API_KEY` is the Deploy Key (not the URL)
- `CONVEX_DEPLOYMENT_URL` is correct
- Pipeline logs show "Writing observations to Convex..."

**Fix**:
```bash
railway variables set CONVEX_API_KEY="your-deploy-key" --service pipeline
```

### Observations Not in Frontend

**Check**:
- Convex queries use correct `farmExternalId`
- React hooks are subscribed to correct farm
- Browser console for errors

**Fix**: Verify `VITE_CONVEX_URL` in `app/.env.local` matches your deployment.

### Railway Cron Not Running

**Check**:
- Cron schedule is set: `railway status --json | jq '...cronSchedule'`
- Service is not paused
- Logs show execution attempts

**Fix**: Verify cron schedule in Railway dashboard Settings tab.

## Success Indicators

✅ Pipeline writes observations to Convex  
✅ Farmer observations can be created and queried  
✅ Frontend displays observations  
✅ Railway cron runs automatically  
✅ No errors in logs or console  

## Next Steps

Once Phase 1 is verified:
1. Monitor daily cron runs
2. Test agent gateway (if Braintrust API key is set)
3. Add more test data
4. Prepare for Phase 2 (intelligence layer)
