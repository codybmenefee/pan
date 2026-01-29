import type { ArticleContent } from '../types'

export const grazingControlSystem: ArticleContent = {
  title: 'Grazing as a Control System',
  description:
    'Understanding rotational grazing through the lens of closed-loop control theory. This framework explains why traditional management fails at scale and how systematic approaches address the limitation.',
  sections: [
    {
      heading: 'The Control System Analogy',
      content: `A control system maintains a desired state by continuously measuring, comparing, and adjusting. A thermostat is the classic example: it measures temperature, compares to a setpoint, and activates heating or cooling.

Grazing management is a biological control system:
- **Setpoint**: Optimal pasture condition for productivity and sustainability
- **Measurement**: Forage availability, recovery status, vegetation health
- **Actuator**: Animal movement and grazing pressure
- **Disturbance**: Weather, disease, equipment failures

Unlike a thermostat, grazing systems have significant **delays** (recovery takes weeks, not minutes) and **nonlinear responses** (overgrazing damage compounds, undergrazing wastes potential). These characteristics make intuitive management difficult.`,
    },
    {
      heading: 'Inputs: What the System Measures',
      content: `The platform aggregates multiple input signals:

**Satellite Imagery (NDVI)**
Remote sensing provides objective, consistent measurement of vegetation vigor. The platform uses NDVI as the primary forage indicator because:
- It's available for any location globally
- It measures actual plant health, not estimated biomass
- It updates regularly (daily to weekly depending on provider)

**Recovery Time**
Days since last grazing event. Calculated from recorded grazing events in the system. Recovery is a hard constraint—paddocks need minimum rest regardless of current NDVI.

**Weather History**
Recent temperature and precipitation affect expected growth rates. The platform weights actual conditions over forecasts since forecasts are unreliable beyond a few days.

**Farmer Inputs**
Observations, overrides, and feedback. Local knowledge about water access, fence conditions, or animal behavior that satellites cannot detect.`,
    },
    {
      heading: 'Actions: What the System Recommends',
      content: `The platform generates three types of recommendations:

**Target Paddock Selection**
Which paddock should animals graze today? Selection considers:
- NDVI relative to threshold (default: 0.40)
- Recovery days relative to minimum (default: 21 days)
- Previous utilization (what percentage has been grazed)

**Section Geometry**
Where within the paddock should grazing occur? Sections are approximately 20% of paddock area, positioned to:
- Avoid overlap with previously grazed sections
- Stay within paddock boundaries
- Maintain practical aspect ratios for fencing

**Confidence Assessment**
How reliable is this recommendation? Confidence reflects:
- Data coverage (cloud-free satellite observations)
- Data recency (how fresh are the readings)
- Signal agreement (do multiple indicators align)`,
    },
    {
      heading: 'Outputs: Pasture and Animal Response',
      content: `The biological system responds to grazing actions:

**Pasture Condition**
Grazed areas experience temporary NDVI decline followed by recovery. The rate and extent of recovery depends on:
- Grazing intensity (how much was consumed)
- Weather during recovery
- Soil health and root reserves
- Time since last grazing

**Animal Performance**
While the platform doesn't directly track animal metrics, grazing quality affects:
- Weight gain and body condition
- Milk production (dairy operations)
- Conception rates and reproductive success

**Soil Health**
Longer-term indicator affected by:
- Compaction from animal traffic
- Manure distribution
- Root growth and decomposition cycles`,
    },
    {
      heading: 'Feedback: Closing the Loop',
      content: `The platform incorporates feedback through several mechanisms:

**Automatic Feedback**
- Subsequent NDVI readings show recovery (or lack thereof)
- Rest day calculations update after each grazing event
- Paddock status changes reflect current conditions

**Farmer Feedback**
- Plan approval/rejection signals recommendation quality
- Written feedback captures reasons for overrides
- Threshold adjustments encode farm-specific knowledge

**Learning Over Time**
The platform accumulates history at the farm level:
- Which paddocks consistently perform well or poorly
- How long recovery actually takes in your conditions
- Patterns in your rotation that work or don't

This feedback loop is what distinguishes a control system from a static rule engine. The system adapts to your farm's specific characteristics.`,
    },
    {
      heading: 'Why Traditional Management Fails at Scale',
      content: `A skilled grazier running this control system manually can succeed on a small operation. The limiting factor is cognitive bandwidth.

Consider a 20-paddock farm:
- 20 paddocks × 5 key variables = 100 data points to track
- Daily decisions compound—today's choice affects tomorrow's options
- Weather introduces stochastic variation requiring constant adjustment
- Fatigue and distraction increase error rates

The decision surface expands combinatorially with farm size. A 40-paddock farm doesn't require twice the attention—it requires exponentially more.

The platform addresses this by:
- Automating data collection and aggregation
- Applying consistent decision logic without fatigue
- Documenting reasoning for review and learning
- Scaling compute, not human attention

The farmer's judgment remains essential. But the farmer's time is freed from data management for higher-value decisions.`,
    },
  ],
  relatedArticles: [
    '/docs/core-concepts/overview',
    '/docs/core-concepts/stock-density-recovery',
    '/docs/core-concepts/time-constraint',
  ],
}
