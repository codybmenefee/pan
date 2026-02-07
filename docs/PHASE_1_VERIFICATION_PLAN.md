# Phase 1 Verification Plan

Complete testing and verification guide for Phase 1 migration components.

## Overview

Phase 1 adds:
1. **Data Model Extensions**: farmerObservations, zones, weatherHistory tables
2. **Pipeline Integration**: Python pipeline writes to Convex
3. **Agent Gateway**: Braintrust-logged agent with context assembly
4. **Frontend Components**: Farmer observation input UI
5. **Railway Cron**: Automated daily pipeline execution

## Prerequisites

Before starting verification, ensure:
- [ ] Railway pipeline service is deployed and running
- [ ] Convex deployment is active and accessible
- [ ] Frontend app is running locally or deployed
- [ ] Environment variables are set (see below)
- [ ] You have access to Convex dashboard
- [ ] You have access to Railway dashboard

### Required Environment Variables

**Railway Pipeline Service:**
- `CONVEX_DEPLOYMENT_URL`
- `CONVEX_API_KEY`
- `WRITE_TO_CONVEX=true`

**Frontend/Agent Gateway:**
- `VITE_CONVEX_URL` (or `CONVEX_URL`)
- `BRAINTRUST_API_KEY` (optional for testing)
- `ANTHROPIC_API_KEY` (for agent gateway)

## Verification Checklist

### 1. Schema Extensions ✅

**Goal**: Verify new tables exist and can store data.

#### 1.1 Check Schema in Convex Dashboard

1. Open Convex dashboard: https://dashboard.convex.dev
2. Navigate to your deployment
3. Go to "Schema" or "Data" tab
4. Verify these tables exist:
   - `farmerObservations`
   - `zones`
   - `weatherHistory`
5. Verify `pastures` table has new fields:
   - `overrideMinNDVIThreshold` (optional)
   - `overrideMinRestPeriodDays` (optional)

**Expected Result**: All tables visible with correct field types.

#### 1.2 Test Schema via Convex Functions

```bash
# In Convex dashboard, open Functions tab
# Or use Convex CLI: npx convex dev
```

Test queries:
- `farmerObservations:listByFarm` - should return empty array initially
- `zones:listByPasture` - should return empty array initially
- `pastures:get` - should show optional override fields as `undefined`

**Expected Result**: Functions execute without errors, return empty arrays or null for optional fields.

---

### 2. Farmer Observations CRUD ✅

**Goal**: Verify farmers can create and query observations.

#### 2.1 Create Observation via Convex Dashboard

1. Open Convex dashboard → Functions
2. Run mutation: `farmerObservations:create`
3. Use test data:
```json
{
  "farmId": "<your-farm-id>",
  "authorId": "test-user-123",
  "level": "farm",
  "targetId": "<farm-external-id>",
  "content": "Test observation: Noticed good grass growth after recent rain.",
  "tags": ["positive", "weather"],
  "createdAt": "2026-01-23T12:00:00Z"
}
```

**Expected Result**: Mutation succeeds, returns observation ID.

#### 2.2 Query Observations

Test queries:
- `farmerObservations:listByFarm` with `farmId`
- `farmerObservations:listByTarget` with `level: "farm"` and `targetId`
- `farmerObservations:listRecent` with `limit: 5`

**Expected Result**: All queries return the created observation.

#### 2.3 Test via Frontend (if UI implemented)

1. Open app in browser
2. Navigate to farm or pasture view
3. Look for "Add Observation" button or form
4. Create observation:
   - Level: Farm/Pasture/Zone
   - Content: "Test observation from UI"
   - Tags: ["test"]
5. Submit form

**Expected Result**: Observation appears in list, no errors in console.

---

### 3. Zones CRUD ✅

**Goal**: Verify zones can be created and queried (backend only, no UI yet).

#### 3.1 Create Zone via Convex Dashboard

1. Get a pasture ID from your farm
2. Run mutation: `zones:create`
3. Use test data:
```json
{
  "pastureId": "<pasture-id>",
  "name": "Water Trough #1",
  "type": "water",
  "geometry": {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[174.0, -40.0], [174.01, -40.0], [174.01, -40.01], [174.0, -40.01], [174.0, -40.0]]]
    }
  }
}
```

**Expected Result**: Mutation succeeds, returns zone ID.

#### 3.2 Query Zones

Test queries:
- `zones:listByPasture` with `pastureId`
- `zones:get` with zone ID

**Expected Result**: Queries return created zone with correct geometry.

---

### 4. Pipeline Integration ✅

**Goal**: Verify Python pipeline writes observations to Convex.

#### 4.1 Test Pipeline Locally

```bash
cd src/ingestion

# Activate virtual environment (if using one)
source venv/bin/activate  # or: python -m venv venv && source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export CONVEX_DEPLOYMENT_URL="https://your-deployment.convex.cloud"
export CONVEX_API_KEY="your-api-key"
export WRITE_TO_CONVEX="true"

# Run pipeline in dev mode
python pipeline.py --dev --write-convex --output /tmp/pan_test_output
```

**Expected Result**:
- Pipeline completes without errors
- Logs show: "Writing observations to Convex..."
- Logs show: "Wrote N observations"
- Output directory contains `pipeline_result.json`

#### 4.2 Verify Observations in Convex

1. Open Convex dashboard
2. Navigate to `observations` table
3. Filter by `farmExternalId` matching your test farm
4. Check latest observations:
   - Should have recent `date` field
   - Should have `ndviMean`, `ndviMin`, `ndviMax` values
   - Should have `sourceProvider` (e.g., "sentinel2")
   - Should have `isValid: true` for valid observations

**Expected Result**: New observations appear with correct data structure.

#### 4.3 Test Pipeline Error Handling

```bash
# Test with invalid Convex URL
export CONVEX_DEPLOYMENT_URL="https://invalid-url.convex.cloud"
python pipeline.py --dev --write-convex

# Should log error but not crash
```

**Expected Result**: Pipeline logs error, continues execution, doesn't write to Convex.

---

### 5. Railway Cron Job ✅

**Goal**: Verify automated pipeline execution.

#### 5.1 Check Railway Service Configuration

```bash
railway service link pipeline
railway status --json | jq '.environments.edges[0].node.serviceInstances.edges[] | select(.node.serviceName == "pipeline") | {startCommand: .node.startCommand, cronSchedule: .node.cronSchedule, nextCronRunAt: .node.nextCronRunAt}'
```

**Expected Result**:
- `startCommand`: `"python pipeline.py --dev --write-convex"`
- `cronSchedule`: `"0 6 * * *"` (or your configured schedule)
- `nextCronRunAt`: Future timestamp

#### 5.2 Check Railway Logs

```bash
railway logs --service pipeline --tail 50
```

**Expected Result**: 
- No "No start command found" errors
- Python environment detected
- Pipeline execution logs visible

#### 5.3 Trigger Manual Run (Optional)

You can trigger a manual deployment to test immediately:

```bash
railway up --service pipeline
```

Or in Railway dashboard:
1. Go to pipeline service
2. Click "Deploy" or "Redeploy"
3. Watch logs for execution

**Expected Result**: Pipeline runs, writes to Convex, logs show success.

#### 5.4 Verify Cron Execution

Wait for next scheduled run (or check logs after scheduled time):

```bash
# Check logs around cron time (6 AM UTC)
railway logs --service pipeline --since 2h
```

**Expected Result**: 
- Pipeline executes at scheduled time
- Observations written to Convex
- No errors in logs

---

### 6. Agent Gateway ✅

**Goal**: Verify agent gateway can assemble context and execute.

#### 6.1 Check Agent Gateway Files Exist

Verify these files exist:
- `app/lib/agent/context.ts`
- `app/lib/agent/triggers.ts`
- `app/lib/agent/tools.ts`
- `app/lib/braintrust.ts`
- `app/convex/grazingAgentGateway.ts`

#### 6.2 Test Context Assembly

If you have a Convex HTTP action or API route:

```bash
# Test context assembly (adjust URL to your deployment)
curl -X POST https://your-app.railway.app/api/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "trigger": "morning_brief",
    "farmId": "<farm-id>"
  }'
```

Or test Convex function directly:
- In Convex dashboard, run: `grazingAgentGateway:getFarmContext`
- Pass `farmId` parameter

**Expected Result**: Returns structured context with:
- Farm geometry and settings
- Pastures with status
- Recent observations (satellite + farmer)
- Plans history

#### 6.3 Test Braintrust Integration (Optional)

If `BRAINTRUST_API_KEY` is set:

1. Trigger agent execution
2. Check Braintrust dashboard: https://www.braintrust.dev
3. Look for new traces/logs

**Expected Result**: Agent interactions logged in Braintrust with:
- Prompts (system + user)
- Tool calls
- Responses

#### 6.4 Test Agent Tools

Test individual tools (if exposed via API):
- `getFarmGeometry`
- `getPastureStatus`
- `getRecentObservations`
- `createPlan`

**Expected Result**: Tools execute and return expected data structures.

---

### 7. Frontend Components ✅

**Goal**: Verify farmer observation UI works.

#### 7.1 Check Component Exists

Verify file exists: `app/src/components/observations/FarmerObservationInput.tsx`

#### 7.2 Test Component Rendering

1. Start frontend: `cd app && npm run dev`
2. Navigate to farm or pasture view
3. Look for observation input component
4. Verify form fields:
   - Level selector (Farm/Pasture/Zone)
   - Target dropdown (populated based on level)
   - Content textarea
   - Tags input

**Expected Result**: Component renders, form fields are interactive.

#### 7.3 Test Observation Creation

1. Fill out form:
   - Select level: "Pasture"
   - Select target pasture
   - Enter content: "Test observation from UI"
   - Add tags: ["test", "ui"]
2. Submit form
3. Check browser console for errors
4. Verify observation appears in list/feed

**Expected Result**: 
- Form submits successfully
- No console errors
- Observation appears in UI
- Observation visible in Convex dashboard

#### 7.4 Test React Hooks

Verify hooks exist and work:
- `useFarmerObservations(farmId)`
- `useFarmerObservationsByTarget(level, targetId)`
- `useRecentFarmerObservations(limit)`
- `useCreateFarmerObservation()`

**Expected Result**: Hooks return data, mutations succeed.

---

### 8. End-to-End Flow ✅

**Goal**: Verify complete data flow from pipeline to frontend.

#### 8.1 Complete Data Flow Test

1. **Trigger Pipeline**:
   ```bash
   # Manually or wait for cron
   railway up --service pipeline
   ```

2. **Wait for Pipeline Completion**:
   - Check Railway logs
   - Verify observations written to Convex

3. **Check Convex Data**:
   - Open Convex dashboard
   - Verify new observations in `observations` table
   - Verify data structure is correct

4. **Check Frontend**:
   - Refresh app
   - Navigate to pasture detail view
   - Verify latest observation data displays
   - Check NDVI values, dates, etc.

5. **Create Farmer Observation**:
   - Use UI to add observation
   - Verify it appears in list

6. **Test Agent Gateway** (if implemented):
   - Trigger agent execution
   - Verify context includes both satellite and farmer observations
   - Verify agent can generate plan

**Expected Result**: Complete flow works without errors, data visible in UI.

---

### 9. Regression Testing ✅

**Goal**: Ensure existing functionality still works.

#### 9.1 Test Existing Features

- [ ] Farm/pasture map rendering
- [ ] Pasture detail views
- [ ] Existing agent (`grazingAgentDirect.ts`) still works
- [ ] Plan approval flows
- [ ] User authentication

**Expected Result**: No regressions, all existing features work.

---

### 10. Performance & Error Handling ✅

**Goal**: Verify system handles edge cases.

#### 10.1 Test Error Scenarios

1. **Invalid Farm ID**:
   - Try to query observations for non-existent farm
   - Expected: Returns empty array, no crash

2. **Missing Environment Variables**:
   - Run pipeline without `CONVEX_API_KEY`
   - Expected: Logs error, doesn't write to Convex

3. **Network Failures**:
   - Simulate Convex API failure
   - Expected: Pipeline retries or logs error gracefully

4. **Invalid Data**:
   - Try to create observation with invalid `level`
   - Expected: Validation error, mutation fails

#### 10.2 Test Performance

- Pipeline execution time (should complete in < 5 minutes for dev farm)
- Frontend query performance (observations load quickly)
- Agent gateway response time (if implemented)

**Expected Result**: System handles errors gracefully, performance is acceptable.

---

## Success Criteria Summary

Phase 1 is verified when:

✅ **Schema**: All new tables exist and accept data  
✅ **CRUD**: Farmer observations and zones can be created/queried  
✅ **Pipeline**: Python pipeline writes observations to Convex  
✅ **Railway**: Cron job runs automatically  
✅ **Frontend**: Observation input UI works  
✅ **Agent Gateway**: Context assembly and tools work (if implemented)  
✅ **End-to-End**: Complete data flow from pipeline → Convex → Frontend  
✅ **No Regressions**: Existing features still work  

## Troubleshooting

### Pipeline Not Writing to Convex

1. Check environment variables in Railway:
   ```bash
   railway variables --service pipeline
   ```

2. Check Convex API key is valid (Deploy Key from Convex dashboard)

3. Check pipeline logs for errors:
   ```bash
   railway logs --service pipeline
   ```

### Observations Not Appearing in Frontend

1. Check Convex queries are correct
2. Verify React hooks are using correct farm/pasture IDs
3. Check browser console for errors
4. Verify Convex deployment URL matches frontend config

### Agent Gateway Not Working

1. Check `BRAINTRUST_API_KEY` is set (if using Braintrust)
2. Verify context assembly returns data
3. Check agent logs for errors
4. Verify Anthropic API key is set (if using Anthropic)

## Next Steps

After Phase 1 verification:

1. **Phase 2**: Implement intelligence layer (pasture scoring, plan generation)
2. **Phase 3**: Enhance agent gateway with full tool execution
3. **Phase 4**: Add weather history integration
4. **Phase 5**: Build zones UI for creating/managing zones

---

## Quick Verification Script

Save this as `verify_phase1.sh`:

```bash
#!/bin/bash
set -e

echo "=== Phase 1 Verification ==="

echo "1. Checking schema..."
# Add schema checks here

echo "2. Testing farmer observations..."
# Add CRUD tests here

echo "3. Testing pipeline..."
cd src/ingestion
python pipeline.py --dev --write-convex --output /tmp/verify_output

echo "4. Checking Railway configuration..."
railway status --json | jq '.environments.edges[0].node.serviceInstances.edges[] | select(.node.serviceName == "pipeline")'

echo "✅ Phase 1 verification complete!"
```

Run with: `bash verify_phase1.sh`
