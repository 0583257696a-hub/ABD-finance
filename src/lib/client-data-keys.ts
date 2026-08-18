/**
 * Every browser-storage key that can hold CLIENT data (identity, portfolio,
 * derived findings, calculator inputs seeded from the client). ONE list, used
 * by resetWorkspace() (new meeting / end of meeting), the idle guard and
 * logout — so "clear the client's data" always means the same thing.
 *
 * Pure UI prefs (theme, sidebar collapse, column widths, cookie consent,
 * accessibility) are deliberately NOT here.
 */
export const CLIENT_DATA_STORAGE_KEYS = [
  'abd-workspace-v2',
  'abd_next_funds',
  'abd_next_insurance',
  'abd_next_client',
  'abd_next_needs',
  'abd_next_recommendations',
  'abd_next_infrastructure_ids',
  'abd_next_phoenix_inputs',
  'abd_next_phoenix_selected_parts',
  'abd_next_phoenix_autofill_sig',
  'abd_next_simulations_compound_inputs',
  'abd_smart_agent_findings_v1',
  'abd_returns_favorites',
] as const

/** Which meeting the current workspace belongs to — the meeting page resets the workspace when this doesn't match. */
export const WORKSPACE_MEETING_ID_KEY = 'abd_ws_meeting_id'

export function clearClientDataStorage() {
  if (typeof window === 'undefined') return
  for (const key of CLIENT_DATA_STORAGE_KEYS) localStorage.removeItem(key)
  localStorage.removeItem(WORKSPACE_MEETING_ID_KEY)
}
