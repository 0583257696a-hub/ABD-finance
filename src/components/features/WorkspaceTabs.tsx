'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import FundsWorkspace from './FundsWorkspace'
import InsurancePage from '@/app/(dashboard)/insurance/page'
import SimulationsPage from '@/app/(dashboard)/simulations/page'
import ReturnsPage from '@/app/(dashboard)/returns/page'
import AbdReturnsPage from '@/app/(dashboard)/abd-returns/page'
import CalculatorsPage from '@/app/(dashboard)/calculators/page'
import RecommendationsPage from '@/app/(dashboard)/recommendations/page'
import MeetingSummaryPage from '@/app/(dashboard)/meeting-summary/page'
import SettingsPage from '@/app/(dashboard)/settings/page'

type WorkspaceTab = {
  id: string
  label: string
  description: string
  render: () => React.ReactNode
}

const TABS: WorkspaceTab[] = [
  { id: 'funds', label: 'קופות', description: 'דשבורד קופות, טעינת נתונים וחלון קופה מלא', render: () => <FundsWorkspace /> },
  { id: 'insurance', label: 'פוליסות ביטוח', description: 'הר הביטוח ופוליסות ביטוח של הלקוח', render: () => <InsurancePage /> },
  { id: 'simulations', label: 'סימולציות', description: 'תשתיות לקצבה, סימולציות וטבלאות תשואות', render: () => <SimulationsPage /> },
  { id: 'client-returns', label: 'טבלת תשואות', description: 'תשואות הקופות הקיימות של הלקוח', render: () => <ReturnsPage /> },
  { id: 'abd-returns', label: 'תשואות ABD Finance', description: 'טבלאות רשות שוק ההון והשוואת מסלולים', render: () => <AbdReturnsPage /> },
  { id: 'calculators', label: 'מחשבונים', description: 'מחשבוני פרישה וקצבה', render: () => <CalculatorsPage /> },
  { id: 'recommendations', label: 'המלצות ניוד', description: 'מודול המלצות וסנכרון מסלולי השקעה', render: () => <RecommendationsPage /> },
  { id: 'summary', label: 'סיכום פגישה', description: 'מסמך סיכום, המלצות ותהליכים להמשך', render: () => <MeetingSummaryPage /> },
  { id: 'settings', label: 'הגדרות', description: 'הגדרות משתמש, תצוגה, מיתוג ותבניות', render: () => <SettingsPage /> },
]

function getInitialTab() {
  if (typeof window === 'undefined') return 'funds'
  const requested = new URLSearchParams(window.location.search).get('tab')
  return TABS.some(tab => tab.id === requested) ? requested || 'funds' : 'funds'
}

export default function WorkspaceTabs() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(getInitialTab)
  const active = useMemo(() => TABS.find(tab => tab.id === activeTab) || TABS[0], [activeTab])

  useEffect(() => {
    const requested = searchParams.get('tab') || 'funds'
    if (TABS.some(tab => tab.id === requested)) {
      setActiveTab(requested)
    }
  }, [searchParams])

  return (
    <main dir="rtl" style={pageStyle}>
      <section style={tabContentStyle}>{active.render()}</section>
    </main>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', fontFamily: 'var(--font-main)' }
const tabContentStyle: React.CSSProperties = { minWidth: 0 }
