export type NeedsAssessmentData = Record<string, string>

export type MeetingFact = {
  id: string
  isAuto: boolean
  label: string
  value: string
}

export type MeetingRecommendation = {
  id: string
  sourceFundId?: string
  text: string
  isAuto?: boolean
}

export type MeetingFollowUp = {
  id: string
  text: string
  isAuto?: boolean
}

export type MeetingScreenshot = {
  id: string
  imageData: string
  caption?: string
}

export type MeetingSummaryData = {
  documentDate?: string
  adviceType?: 'pension' | 'retirement'
  brandName?: string
  documentTitle?: string
  clientLine?: string
  introText?: string
  showFundsSummaryTable?: boolean
  showNeedsSection?: boolean
  showFactsTable?: boolean
  showPensionSnapshotTable?: boolean
  showInfrastructureTable?: boolean
  showMigrationTable?: boolean
  facts?: MeetingFact[]
  hiddenAutoFacts?: string[]
  recommendations?: MeetingRecommendation[]
  hiddenAutoRecommendations?: string[]
  manualFollowUps?: MeetingFollowUp[]
  hiddenAutoFollowUps?: string[]
  screenshots?: MeetingScreenshot[]
  sections?: Record<string, boolean>
  manualFacts?: string[]
  manualRecommendations?: string[]
  followUps?: string[]
  editedSections?: Record<string, string>
}
