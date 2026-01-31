"use node"

import { v } from 'convex/values'
import { action } from './_generated/server'
import { api } from './_generated/api'

const bugCategory = v.union(
  v.literal('ui_visual'),
  v.literal('functionality'),
  v.literal('performance'),
  v.literal('data'),
  v.literal('map'),
  v.literal('satellite'),
  v.literal('ai_recommendations'),
  v.literal('other')
)

const bugSeverity = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('critical')
)

const bugContext = v.object({
  url: v.string(),
  userAgent: v.string(),
  screenSize: v.optional(v.string()),
  timestamp: v.string(),
})

type BugCategory = 'ui_visual' | 'functionality' | 'performance' | 'data' | 'map' | 'satellite' | 'ai_recommendations' | 'other'
type BugSeverity = 'low' | 'medium' | 'high' | 'critical'

const CATEGORY_LABELS: Record<BugCategory, string> = {
  ui_visual: 'UI/Visual',
  functionality: 'Functionality',
  performance: 'Performance',
  data: 'Data',
  map: 'Map',
  satellite: 'Satellite',
  ai_recommendations: 'AI Recommendations',
  other: 'Other',
}

const SEVERITY_LABELS: Record<BugSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

interface GitHubIssueResponse {
  html_url: string
  number: number
}

/**
 * Create a GitHub issue for the bug report
 */
async function createGitHubIssue(args: {
  title: string
  description: string
  category: BugCategory
  severity: BugSeverity
  stepsToReproduce?: string
  context: {
    url: string
    userAgent: string
    screenSize?: string
    timestamp: string
  }
}): Promise<{ url: string; number: number } | null> {
  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    console.warn('GITHUB_TOKEN not configured, skipping GitHub issue creation')
    return null
  }

  const labels = ['bug', `severity:${args.severity}`]
  if (args.category !== 'other') {
    labels.push(`category:${args.category}`)
  }

  const body = `## Description
${args.description}

${args.stepsToReproduce ? `## Steps to Reproduce
${args.stepsToReproduce}

` : ''}## Context
- **Category:** ${CATEGORY_LABELS[args.category]}
- **Severity:** ${SEVERITY_LABELS[args.severity]}
- **URL:** ${args.context.url}
- **User Agent:** ${args.context.userAgent}
${args.context.screenSize ? `- **Screen Size:** ${args.context.screenSize}` : ''}
- **Timestamp:** ${args.context.timestamp}

---
*This issue was automatically created from a user bug report.*`

  try {
    const response = await fetch('https://api.github.com/repos/codybmenefee/pan/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenPasture/1.0',
      },
      body: JSON.stringify({
        title: args.title,
        body,
        labels,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', response.status, errorText)
      return null
    }

    const data = await response.json() as GitHubIssueResponse
    return {
      url: data.html_url,
      number: data.number,
    }
  } catch (error) {
    console.error('Failed to create GitHub issue:', error)
    return null
  }
}

/**
 * Submit a bug report - creates a record in the database and a GitHub issue
 */
export const submit = action({
  args: {
    userExternalId: v.optional(v.string()),
    farmExternalId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    category: bugCategory,
    severity: bugSeverity,
    stepsToReproduce: v.optional(v.string()),
    context: bugContext,
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    bugReportId?: string
    githubIssueUrl?: string
    error?: string
  }> => {
    try {
      // Create GitHub issue first
      const githubResult = await createGitHubIssue({
        title: args.title,
        description: args.description,
        category: args.category,
        severity: args.severity,
        stepsToReproduce: args.stepsToReproduce,
        context: args.context,
      })

      // Insert bug report into database
      const bugReportId = await ctx.runMutation(api.bugReports.insertBugReport, {
        userExternalId: args.userExternalId,
        farmExternalId: args.farmExternalId,
        title: args.title,
        description: args.description,
        category: args.category,
        severity: args.severity,
        stepsToReproduce: args.stepsToReproduce,
        context: args.context,
        githubIssueUrl: githubResult?.url,
        githubIssueNumber: githubResult?.number,
      })

      return {
        success: true,
        bugReportId: bugReportId.toString(),
        githubIssueUrl: githubResult?.url,
      }
    } catch (error) {
      console.error('Failed to submit bug report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})
