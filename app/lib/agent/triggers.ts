/**
 * Agent trigger definitions.
 *
 * Each trigger represents a specific use case for the grazing agent
 * with tailored prompt instructions.
 */

export type TriggerType = 'morning_brief' | 'observation_refresh' | 'plan_execution'

export interface TriggerConfig {
  type: TriggerType
  systemPrompt: string
  userPromptTemplate: string
  maxTokens?: number
  temperature?: number
}

export const TRIGGERS: Record<TriggerType, TriggerConfig> = {
  morning_brief: {
    type: 'morning_brief',
    systemPrompt: `You are a grazing intelligence specialist providing a daily morning brief for a farmer.

Your role is to:
1. Analyze the current state of the farm based on satellite observations and farmer notes
2. Provide a clear, plain-language summary of farm conditions
3. Recommend the best grazing action for today
4. Explain your reasoning in terms a farmer would understand

Use natural, conversational language. Avoid technical jargon unless necessary. Focus on actionable insights.`,
    userPromptTemplate: `Generate today's morning brief for {farmName}.

Farm Context:
{context}

Provide:
1. A brief summary of current farm conditions
2. Your recommended grazing action for today
3. Key factors influencing your recommendation
4. Any concerns or opportunities to highlight`,
    maxTokens: 2000,
    temperature: 0.7,
  },

  observation_refresh: {
    type: 'observation_refresh',
    systemPrompt: `You are a grazing intelligence specialist analyzing newly refreshed satellite observations.

Your role is to:
1. Compare new observations with previous data
2. Identify significant changes in vegetation health
3. Update grazing recommendations based on new data
4. Flag any anomalies or concerns`,
    userPromptTemplate: `New satellite observations have been processed for {farmName}.

Previous State:
{previousContext}

New Observations:
{newObservations}

Analyze the changes and provide:
1. Summary of what changed
2. Updated grazing recommendation
3. Confidence level in the new data`,
    maxTokens: 1500,
    temperature: 0.6,
  },

  plan_execution: {
    type: 'plan_execution',
    systemPrompt: `You are a grazing intelligence specialist helping execute an approved grazing plan.

Your role is to:
1. Generate detailed execution instructions for the approved plan
2. Provide virtual fence geometry if applicable
3. Create copy-ready instructions for manual or automated systems
4. Include safety and operational considerations`,
    userPromptTemplate: `Generate execution instructions for the approved plan on {farmName}.

Plan Details:
{planDetails}

Farm Context:
{context}

Provide:
1. Step-by-step execution instructions
2. Virtual fence geometry (GeoJSON format)
3. Copy-ready text for communication
4. Any operational notes or warnings`,
    maxTokens: 1500,
    temperature: 0.5,
  },
}

export function getTrigger(type: TriggerType): TriggerConfig {
  return TRIGGERS[type]
}

export function formatPrompt(
  trigger: TriggerConfig,
  variables: Record<string, string>
): string {
  let prompt = trigger.userPromptTemplate
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return prompt
}
