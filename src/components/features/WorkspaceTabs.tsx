'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MeetingSummaryPage from '@/app/(dashboard)/meeting-summary/page'
import MeetingsPage from '@/app/(dashboard)/meetings/page'
import MeetingSummariesHistoryPage from '@/app/(dashboard)/meeting-summaries/page'
import SettingsPage from '@/app/(dashboard)/settings/page'

type WorkspaceTab = {
  id: string
  label: string
  description: string
  render: () => React.ReactNode
}

// Dashboard tier only — meetings overview, history, and settings. The full
// feature set (funds/insurance/recommendations/simulations/calculators/
// returns/Smart Agent) lives exclusively inside an active meeting
// (src/app/meeting/[id]/page.tsx), not here. meeting-summary (the live,
// editable document) stays reachable standalone since a session can be
// resumed via its own summary page outside the meeting timer chrome.
const TABS: WorkspaceTab[] = [
  { id: 'meetings', label: 'פגישות', description: 'התחלת פגישה, זימון פגישות ושליחת שאלוני הכנה ללקוח', render: () => <MeetingsPage /> },
  { id: 'meeting-summaries', label: 'סיכומי פגישות', description: 'ארכיון סיכומי פגישות שהסתיימו', render: () => <MeetingSummariesHistoryPage /> },
  { id: 'summary', label: 'סיכום פגישה', description: 'מסמך סיכום, המלצות ותהליכים להמשך', render: () => <MeetingSummaryPage /> },
  { id: 'settings', label: 'הגדרות', description: 'הגדרות משתמש, תצוגה, מיתוג ותבניות', render: () => <SettingsPage /> },
]

function getInitialTab() {
  if (typeof window === 'undefined') return 'meetings'
  const requested = new URLSearchParams(window.location.search).get('tab')
  return TABS.some(tab => tab.id === requested) ? requested || 'meetings' : 'meetings'
}

export default function WorkspaceTabs() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(getInitialTab)
  const active = useMemo(() => TABS.find(tab => tab.id === activeTab) || TABS[0], [activeTab])

  useEffect(() => {
    const requested = searchParams.get('tab') || 'meetings'
    if (TABS.some(tab => tab.id === requested)) {
      setActiveTab(requested)
    }
  }, [searchParams])

  return (
    <div dir="rtl" style={pageStyle}>
      <section style={tabContentStyle}>{active.render()}</section>
    </div>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', fontFamily: 'var(--font-main)' }
const tabContentStyle: React.CSSProperties = { minWidth: 0 }
