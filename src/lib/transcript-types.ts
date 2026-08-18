/** Suggestions extracted from a meeting transcript — shared by /api/transcribe/extract and the RecordingPanel. */
export type ExtractedSuggestions = {
  facts: Array<{ label: string; value: string }>
  decisions: string[]
  tasks: Array<{ text: string; owner?: 'advisor' | 'client'; due?: string }>
  concerns: string[]
  needs: Partial<{ retirementAgeGoal: string; maritalStatus: string; monthlyIncome: string; monthlyExpenses: string; goals: string }>
}
