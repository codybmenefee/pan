/**
 * Documentation Content Types
 *
 * These types define the structure for documentation articles stored as TypeScript modules.
 */

export interface ArticleSection {
  heading: string
  content: string // Markdown content
  codeExample?: {
    language: string
    code: string
    filename?: string
  }
}

export interface ArticleContent {
  title: string
  description: string
  sections: ArticleSection[]
  relatedArticles?: string[] // hrefs to related docs
}

// Content registry key format: "category/article"
export type ContentKey = `${string}/${string}`

export interface ContentRegistry {
  [key: ContentKey]: ArticleContent
}
