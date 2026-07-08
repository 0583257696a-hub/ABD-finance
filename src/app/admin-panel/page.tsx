'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  FileUp,
  Flag,
  Gauge,
  Home,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  ScrollText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  XCircle,
} from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  name?: string | null
  phone?: string
  approved?: boolean
  status?: string
  statusLabel?: string
  userTypeLabel?: string
  planId?: string
  subscriptionStatus?: string
  businessName?: string
  agencyName?: string
  passwordPreview?: string
  createdAt: string
}

type AdminRole = {
  id: string
  label: string
  description: string
  permissions: string[]
}

type AdminPermission = {
  id: string
  label: string
  description: string
}

type AdminInfrastructure = {
  roles: AdminRole[]
  permissions: AdminPermission[]
  plans: Array<{
    id: string
    name: string
    shortDescription?: string
    status: string
    monthlyPrice: number
    annualPrice?: number
    includedUsers: number
    monthlyMeetings: number
    clientLimit?: number
    features?: Record<string, boolean>
  }>
  auditActions: Array<{ id: string; label: string; sensitive: boolean }>
  registration?: {
    registrationOpen: boolean
    manualApprovalRequired: boolean
    defaultTrialDays: number
  }
  emailTemplates?: Array<{
    id: string
    name: string
    subject: string
    body: string
    variables?: string[]
    active: boolean
  }>
  landingPageDraft?: {
    status: string
    title: string
    metaDescription: string
    slug: string
    canonicalUrl?: string
    openGraphImage?: string
    sections?: Array<{
      id: string
      type: string
      title: string
      text: string
      sortOrder: number
      active: boolean
      desktopVisible: boolean
      mobileVisible: boolean
      primaryButtonLabel?: string
      primaryButtonHref?: string
      secondaryButtonLabel?: string
      secondaryButtonHref?: string
    }>
  }
  dataImportKinds?: Array<{
    id: string
    label: string
    requiredColumns: string[]
    accepts: string[]
  }>
}

type AuditEvent = {
  id: string
  time: string
  action: string
  entity: string
  result: 'success' | 'failure' | 'info'
  actor: string
}

type ReturnsUpload = {
  id: string
  fileName: string
  uploadedAt: string
  size: number
}

type AgencyOverride = {
  taxId?: string
  address?: string
  logoUrl?: string
  brandColor?: string
  notes?: string
  plan?: string
  status?: string
  trialEnds?: string
}

type AgencyRow = {
  name: string
  manager: string
  email: string
  phone: string
  users: number
  plan: string
  status: string
  createdAt: string
  trialEnds: string
  members: AdminUser[]
  taxId?: string
  address?: string
  logoUrl?: string
  brandColor?: string
  notes?: string
}

type LeadStatus = 'open' | 'assigned' | 'emailed' | 'closed' | 'converted'

type LeadOverride = {
  status?: LeadStatus
  owner?: string
  updatedAt?: string
}

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'agencies'
  | 'plans'
  | 'leads'
  | 'workspace'
  | 'templates'
  | 'data'
  | 'landing'
  | 'messages'
  | 'support'
  | 'reports'
  | 'security'
  | 'settings'

const ADMIN_TABS: Array<{ id: AdminTab; label: string; icon: React.ElementType; stage: number }> = [
  { id: 'dashboard', label: 'דשבורד ראשי', icon: LayoutDashboard, stage: 1 },
  { id: 'users', label: 'משתמשים והרשאות', icon: Users, stage: 1 },
  { id: 'agencies', label: 'סוכנויות / עסקים', icon: Building2, stage: 1 },
  { id: 'plans', label: 'תוכניות ומנויים', icon: BriefcaseBusiness, stage: 2 },
  { id: 'leads', label: 'לידים ולקוחות', icon: BarChart3, stage: 3 },
  { id: 'workspace', label: 'ניהול פגישה חכמה', icon: Settings, stage: 2 },
  { id: 'templates', label: 'תבניות וסיכומים', icon: FileText, stage: 5 },
  { id: 'data', label: 'קבצי נתונים ותשואות', icon: Database, stage: 5 },
  { id: 'landing', label: 'ניהול דף נחיתה', icon: Home, stage: 4 },
  { id: 'messages', label: 'הודעות ומיילים', icon: Mail, stage: 3 },
  { id: 'support', label: 'תמיכה ופניות', icon: LifeBuoy, stage: 6 },
  { id: 'reports', label: 'דוחות וסטטיסטיקות', icon: Activity, stage: 6 },
  { id: 'security', label: 'אבטחה ולוג פעילות', icon: ScrollText, stage: 1 },
  { id: 'settings', label: 'הגדרות מערכת', icon: Flag, stage: 2 },
]

const STATUS_TEXT: Record<string, string> = {
  active: 'פעיל',
  pending_approval: 'ממתין לאישור',
  blocked: 'חסום',
  suspended: 'מוקפא',
  trial: 'בתקופת ניסיון',
  expired: 'מנוי פג',
  archived: 'ארכיון',
}

const FEATURE_FLAGS = [
  { id: 'meeting_summary', label: 'סיכום פגישה', plans: ['basic', 'professional', 'agency'] },
  { id: 'retirement_simulator', label: 'סימולטור פרישה', plans: ['basic', 'professional', 'agency'] },
  { id: 'smart_portfolio', label: 'ניתוח תיק חכם', plans: ['professional', 'agency'] },
  { id: 'export_deals', label: 'ייצוא עסקאות', plans: ['professional', 'agency'] },
  { id: 'export_risks', label: 'ייצוא סיכונים', plans: ['professional', 'agency'] },
  { id: 'export_pdf', label: 'ייצוא PDF', plans: ['basic', 'professional', 'agency'] },
  { id: 'export_excel', label: 'ייצוא Excel', plans: ['basic', 'professional', 'agency'] },
  { id: 'email_templates', label: 'תבניות מיילים', plans: ['professional', 'agency'] },
  { id: 'returns_files', label: 'קבצי תשואות', plans: ['basic', 'professional', 'agency'] },
  { id: 'reports', label: 'דוחות', plans: ['agency'] },
  { id: 'ai_future', label: 'AI עתידי', plans: [] },
  { id: 'internal_chat_future', label: 'צ׳אט פנימי עתידי', plans: [] },
]

const ADMIN_PANEL_VERSION = 'admin-panel-v2-d96129e'
const ADMIN_LEADS_STORAGE_KEY = 'abd-admin-leads-v1'
const ADMIN_AGENCIES_STORAGE_KEY = 'abd-admin-agencies-v1'

function leadStatusLabel(status: LeadStatus) {
  if (status === 'converted') return 'הומר למשתמש'
  if (status === 'assigned') return 'שויך ליועץ'
  if (status === 'emailed') return 'נשלח מייל'
  if (status === 'closed') return 'סגור'
  return 'ממתין לטיפול'
}

export default function AdminPanelPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('admin@abd-finance.co.il')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [infrastructure, setInfrastructure] = useState<AdminInfrastructure | null>(null)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(FEATURE_FLAGS.map(flag => [flag.id, !flag.id.includes('future')])))
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [search, setSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({})
  const [returnsUploads, setReturnsUploads] = useState<ReturnsUpload[]>([])
  const [activeRoleId, setActiveRoleId] = useState('super_admin')
  const [selectedAgencyName, setSelectedAgencyName] = useState('')
  const [agencyOverrides, setAgencyOverrides] = useState<Record<string, AgencyOverride>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = JSON.parse(localStorage.getItem(ADMIN_AGENCIES_STORAGE_KEY) || '{}')
      return stored && typeof stored === 'object' ? stored : {}
    } catch {
      return {}
    }
  })
  const [leadOverrides, setLeadOverrides] = useState<Record<string, LeadOverride>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = JSON.parse(localStorage.getItem(ADMIN_LEADS_STORAGE_KEY) || '{}')
      return stored && typeof stored === 'object' ? stored : {}
    } catch {
      return {}
    }
  })
  const returnsInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'admin@abd-finance.co.il'
  const actor = session?.user?.email || email

  useEffect(() => {
    if (!isAdmin) return
    void loadUsers()
    void loadInfrastructure()
    void loadLeadOverrides()
    void loadAgencyOverrides()
    addAudit('כניסה לפאנל Admin', 'admin-panel', 'success')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  useEffect(() => {
    localStorage.setItem(ADMIN_LEADS_STORAGE_KEY, JSON.stringify(leadOverrides))
  }, [leadOverrides])

  useEffect(() => {
    localStorage.setItem(ADMIN_AGENCIES_STORAGE_KEY, JSON.stringify(agencyOverrides))
  }, [agencyOverrides])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(user => {
      return [
        user.name,
        user.email,
        user.phone,
        user.userTypeLabel,
        user.planId,
        user.statusLabel,
        user.businessName,
        user.agencyName,
      ].some(value => String(value || '').toLowerCase().includes(q))
    })
  }, [search, users])

  const agencies = useMemo(() => {
    const grouped = new Map<string, AgencyRow>()
    users.forEach(user => {
      const agencyName = user.businessName || user.agencyName
      if (!agencyName) return
      const existing = grouped.get(agencyName)
      if (existing) {
        existing.users += 1
        existing.members.push(user)
        if (String(user.userTypeLabel || '').includes('מנהל')) {
          existing.manager = user.name || existing.manager
          existing.email = user.email
          existing.phone = user.phone || existing.phone
        }
        return
      }
      grouped.set(agencyName, {
        name: agencyName,
        manager: user.name || '-',
        email: user.email,
        phone: user.phone || '-',
        users: 1,
        plan: user.planId || '-',
        status: user.subscriptionStatus || user.status || 'pending_approval',
        createdAt: formatDate(user.createdAt),
        trialEnds: 'אין נתון',
        members: [user],
      })
    })
    return Array.from(grouped.values()).map(agency => {
      const override = agencyOverrides[agency.name] || {}
      return {
        ...agency,
        ...override,
        plan: override.plan || agency.plan,
        status: override.status || agency.status,
        trialEnds: override.trialEnds || agency.trialEnds,
      }
    })
  }, [agencyOverrides, users])

  const selectedAgency = useMemo(
    () => agencies.find(agency => agency.name === selectedAgencyName) || agencies[0] || null,
    [agencies, selectedAgencyName],
  )

  const leads = useMemo(() => {
    return users.map(user => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      phone: user.phone || '-',
      source: user.status === 'pending_approval' || !user.approved ? 'הרשמה חדשה' : 'משתמש קיים',
      type: user.userTypeLabel || 'יועץ',
      business: user.businessName || user.agencyName || '-',
      plan: user.planId || 'trial',
      statusCode: leadOverrides[user.id]?.status || (user.approved ? 'converted' : 'open'),
      status: leadStatusLabel(leadOverrides[user.id]?.status || (user.approved ? 'converted' : 'open')),
      owner: leadOverrides[user.id]?.owner || 'מנהל מערכת',
      createdAt: user.createdAt,
    }))
  }, [leadOverrides, users])

  const metrics = useMemo(() => {
    const activeUsers = users.filter(user => user.status === 'active' || user.approved).length
    const pendingUsers = users.filter(user => user.status === 'pending_approval' || !user.approved).length
    const activeAgencies = agencies.filter(agency => agency.status === 'active' || agency.status === 'trial_active').length
    const trialAgencies = agencies.filter(agency => String(agency.status).includes('trial')).length
    const activeSubscriptions = users.filter(user => ['active', 'trial_active', 'trial'].includes(String(user.subscriptionStatus || user.status))).length
    const expiredSubscriptions = users.filter(user => ['expired', 'blocked', 'suspended'].includes(String(user.subscriptionStatus || user.status))).length
    const newLeads = leads.filter(lead => ['open', 'assigned', 'emailed'].includes(lead.statusCode)).length
    const recentErrors = auditEvents.filter(event => event.result === 'failure').length

    return [
      { label: 'משתמשים פעילים', value: activeUsers, tone: 'green', note: 'מאושרים או פעילים' },
      { label: 'משתמשים ממתינים לאישור', value: pendingUsers, tone: 'orange', note: 'נרשמים שדורשים אישור' },
      { label: 'סוכנויות פעילות', value: activeAgencies, tone: 'blue', note: 'נגזר מפרטי הרשמה' },
      { label: 'סוכנויות בתקופת ניסיון', value: trialAgencies, tone: 'blue', note: 'סטטוס trial' },
      { label: 'מנויים פעילים', value: activeSubscriptions, tone: 'green', note: 'משתמשים פעילים / ניסיון' },
      { label: 'מנויים שפג תוקפם', value: expiredSubscriptions, tone: 'red', note: 'פג / חסום / מוקפא' },
      { label: 'לידים חדשים', value: newLeads, tone: 'orange', note: 'פתוחים, משויכים או נשלח מייל' },
      { label: 'פגישות שנוצרו החודש', value: 0, tone: 'gray', note: 'ממתין לחיבור מקור נתונים' },
      { label: 'סיכומי פגישה שיוצאו', value: 0, tone: 'gray', note: 'ממתין לחיבור מקור נתונים' },
      { label: 'קבצי תשואות אחרונים', value: returnsUploads.length, tone: returnsUploads.length ? 'green' : 'gray', note: returnsUploads.length ? 'נקלטו בסשן הנוכחי' : 'לא הועלו בסשן' },
      { label: 'שגיאות מערכת אחרונות', value: recentErrors, tone: recentErrors ? 'red' : 'green', note: 'לפי לוג פעילות במסך' },
    ]
  }, [agencies, auditEvents, leads, returnsUploads.length, users])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setLoginError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) setLoginError('פרטי מנהל מערכת שגויים')
  }

  async function loadUsers() {
    setLoadingUsers(true)
    const res = await fetch('/api/admin/users')
    setLoadingUsers(false)

    if (!res.ok) {
      setMessage('אין הרשאה לטעון משתמשים')
      addAudit('טעינת משתמשים', 'users', 'failure')
      return
    }

    const data = await res.json()
    setUsers(Array.isArray(data.users) ? data.users : [])
    if (data.mode === 'static-auth') {
      setMessage('המערכת פועלת כרגע במצב static-auth. ניהול משתמשים מלא דורש מסד נתונים פעיל.')
    }
  }

  async function loadInfrastructure() {
    const res = await fetch('/api/admin/infrastructure')
    if (!res.ok) return
    const data = await res.json()
    setInfrastructure(data.infrastructure || null)
  }

  async function saveInfrastructure(nextInfrastructure: AdminInfrastructure, successMessage = 'ההגדרות נשמרו בהצלחה') {
    setInfrastructure(nextInfrastructure)
    const res = await fetch('/api/admin/infrastructure', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ infrastructure: nextInfrastructure }),
    })
    if (res.ok) {
      setMessage(successMessage)
      addAudit('שמירת תשתית ניהול', 'admin-infrastructure', 'success')
      return true
    }
    setMessage('העדכון נשמר במסך בלבד. שמירה קבועה דורשת D1 פעיל.')
    addAudit('שמירת תשתית ניהול', 'admin-infrastructure', 'failure')
    return false
  }

  async function updatePlan(planId: string, patch: Partial<AdminInfrastructure['plans'][number]>) {
    if (!infrastructure) return
    const next = {
      ...infrastructure,
      plans: infrastructure.plans.map(plan => plan.id === planId ? { ...plan, ...patch } : plan),
    }
    await saveInfrastructure(next, 'התוכנית עודכנה בהצלחה')
  }

  async function updatePlanFeature(planId: string, featureKey: string, enabled: boolean) {
    if (!infrastructure) return
    const next = {
      ...infrastructure,
      plans: infrastructure.plans.map(plan => {
        if (plan.id !== planId) return plan
        return {
          ...plan,
          features: {
            ...(plan.features || {}),
            [featureKey]: enabled,
          },
        }
      }),
    }
    await saveInfrastructure(next, 'יכולת התוכנית עודכנה בהצלחה')
  }

  async function clonePlan(planId: string) {
    if (!infrastructure) return
    const source = infrastructure.plans.find(plan => plan.id === planId)
    if (!source) return
    const nextPlan = {
      ...source,
      id: `${source.id}-copy-${Date.now()}`,
      name: `${source.name} - עותק`,
      status: 'draft',
    }
    await saveInfrastructure({ ...infrastructure, plans: [nextPlan, ...infrastructure.plans] }, 'התוכנית שוכפלה בהצלחה')
  }

  async function createPlan() {
    if (!infrastructure) return
    const nextPlan = {
      id: `plan-${Date.now()}`,
      name: 'תוכנית חדשה',
      shortDescription: 'תיאור תוכנית חדש.',
      monthlyPrice: 0,
      annualPrice: 0,
      includedUsers: 1,
      monthlyMeetings: 10,
      clientLimit: 50,
      features: {},
      status: 'draft',
    }
    await saveInfrastructure({ ...infrastructure, plans: [nextPlan, ...infrastructure.plans] }, 'נוצרה תוכנית חדשה')
  }

  async function loadLeadOverrides() {
    const res = await fetch('/api/admin/leads')
    if (!res.ok) return
    const data = await res.json()
    if (data.overrides && typeof data.overrides === 'object') {
      setLeadOverrides(data.overrides)
    }
  }

  async function loadAgencyOverrides() {
    const res = await fetch('/api/admin/agencies')
    if (!res.ok) return
    const data = await res.json()
    if (data.overrides && typeof data.overrides === 'object') {
      setAgencyOverrides(data.overrides)
    }
  }

  function addAudit(action: string, entity: string, result: AuditEvent['result']) {
    setAuditEvents(prev => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        time: new Date().toISOString(),
        action,
        entity,
        result,
        actor,
      },
      ...prev,
    ].slice(0, 30))
  }

  async function patchUser(userId: string, body: Record<string, unknown>, successMessage: string, errorMessage: string, auditAction: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...body }),
    })
    const ok = res.ok
    setMessage(ok ? successMessage : errorMessage)
    addAudit(auditAction, userId, ok ? 'success' : 'failure')
    if (ok) await loadUsers()
  }

  async function setUserSubscription(userId: string, planId: string, subscriptionStatus: string) {
    await patchUser(
      userId,
      { action: 'set_subscription', planId, subscriptionStatus },
      'המנוי עודכן ידנית בהצלחה',
      'עדכון המנוי נכשל',
      'שינוי מנוי ידני',
    )
  }

  async function resetPassword(userId: string) {
    const nextPassword = newPasswords[userId]
    if (!nextPassword) {
      setMessage('יש להזין סיסמה חדשה')
      return
    }

    await patchUser(userId, { action: 'reset_password', password: nextPassword }, 'הסיסמה עודכנה בהצלחה', 'עדכון הסיסמה נכשל', 'איפוס סיסמה')
    setNewPasswords(prev => ({ ...prev, [userId]: '' }))
  }

  async function toggleRolePermission(roleId: string, permissionId: string, checked: boolean) {
    if (!infrastructure) return
    const next = {
      ...infrastructure,
      roles: infrastructure.roles.map(role => {
        if (role.id !== roleId) return role
        const permissions = checked
          ? Array.from(new Set([...role.permissions, permissionId]))
          : role.permissions.filter(id => id !== permissionId)
        return { ...role, permissions }
      }),
    }
    await saveInfrastructure(next, 'הרשאות התפקיד עודכנו בהצלחה')
  }

  function rolePermissionCount(roleId: string) {
    return infrastructure?.roles.find(role => role.id === roleId)?.permissions.length || 0
  }

  function uploadReturns(files: FileList | null) {
    if (!files?.length) return
    const uploadedAt = new Date().toISOString()
    setReturnsUploads(prev => [
      ...Array.from(files).map(file => ({
        id: `${uploadedAt}-${file.name}`,
        fileName: file.name,
        uploadedAt,
        size: file.size,
      })),
      ...prev,
    ].slice(0, 12))
    setMessage(`${files.length} קבצי תשואות נקלטו בפאנל הניהול. שמירה מרכזית מלאה תחובר בשלב קבצי הנתונים.`)
    addAudit('העלאת קובץ תשואות', 'data-imports', 'info')
  }

  async function quickCreatePlan() {
    setActiveTab('plans')
    await createPlan()
  }

  async function updateAgencyOverride(agencyName: string, patch: AgencyOverride, successMessage = 'פרטי הסוכנות עודכנו') {
    setAgencyOverrides(prev => ({
      ...prev,
      [agencyName]: {
        ...prev[agencyName],
        ...patch,
      },
    }))
    setMessage(successMessage)
    addAudit('עדכון סוכנות', agencyName, 'success')

    const res = await fetch('/api/admin/agencies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agencyName, override: patch }),
    })
    if (!res.ok) {
      setMessage(`${successMessage} (מקומית בלבד — שמירה קבועה דורשת D1 פעיל).`)
      addAudit('שמירת סוכנות נכשלה', agencyName, 'failure')
    }
  }

  async function updateLeadStatus(leadId: string, nextStatus: LeadStatus) {
    const nextOwner = nextStatus === 'assigned' ? (session?.user?.name || session?.user?.email || 'מנהל מערכת') : undefined
    setLeadOverrides(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        status: nextStatus,
        owner: nextOwner || prev[leadId]?.owner || 'מנהל מערכת',
        updatedAt: new Date().toISOString(),
      },
    }))
    setMessage(`הליד עודכן לסטטוס: ${leadStatusLabel(nextStatus)}`)
    addAudit(`עדכון ליד: ${leadStatusLabel(nextStatus)}`, leadId, 'success')

    const res = await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, status: nextStatus, owner: nextOwner || 'מנהל מערכת' }),
    })
    if (!res.ok) {
      setMessage(`הליד עודכן מקומית בלבד: ${leadStatusLabel(nextStatus)}. שמירה קבועה דורשת D1 פעיל.`)
      addAudit(`שמירת ליד נכשלה: ${leadStatusLabel(nextStatus)}`, leadId, 'failure')
    }
  }

  function validateDataImportKind(kind: NonNullable<AdminInfrastructure['dataImportKinds']>[number]) {
    const required = kind.requiredColumns.join(', ')
    const accepts = kind.accepts.join(', ')
    const usage = kind.id.includes('returns') ? 'מסלולי תשואה ותשואות ABD' : 'נתוני עזר למערכת'
    setMessage(`בדיקת ${kind.label}: פורמטים מותרים ${accepts}. עמודות חובה: ${required}. שימוש: ${usage}.`)
    addAudit(`בדיקת קובץ ${kind.label}`, kind.id, 'success')
  }

  if (status !== 'loading' && !isAdmin) {
    return (
      <main dir="rtl" style={loginPageStyle}>
        <form onSubmit={login} style={loginCardStyle}>
          <ShieldCheck size={34} color="var(--abd-accent)" />
          <h1 style={loginTitleStyle}>Admin Panel</h1>
          <p style={mutedStyle}>כניסה לפאנל מנהל מערכת בלבד.</p>
          <input value={email} onChange={event => setEmail(event.target.value)} placeholder="אימייל מנהל" style={inputStyle} />
          <input value={password} onChange={event => setPassword(event.target.value)} placeholder="סיסמת מנהל" type="password" style={inputStyle} />
          {loginError && <p style={errorStyle}>{loginError}</p>}
          <button type="submit" style={primaryButtonStyle}>כניסה לפאנל אדמין</button>
        </form>
      </main>
    )
  }

  return (
    <main dir="rtl" style={pageStyle}>
      <aside style={sidebarStyle}>
        <div style={brandStyle}>
          <img src="/assets/abd-finance-logo.png" alt="ABD Finance" style={logoStyle} />
          <div>
            <strong>ABD Admin</strong>
            <span>ניהול מערכת SaaS</span>
          </div>
        </div>
        <nav style={navStyle}>
          {ADMIN_TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={navButtonStyle(active)}>
                <Icon size={17} />
                <span>{tab.label}</span>
                {tab.stage > 1 && <small>שלב {tab.stage}</small>}
              </button>
            )
          })}
        </nav>
      </aside>

      <section style={contentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>{ADMIN_TABS.find(tab => tab.id === activeTab)?.label}</h1>
            <p style={mutedStyle}>פאנל בהיר לניהול משתמשים, הרשאות, סוכנויות ולוג פעילות. שלב 1 פעיל, שאר המודולים בתשתית.</p>
          </div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
            <span style={adminBadgeStyle}>System Admin</span>
            <span style={versionBadgeStyle}>{ADMIN_PANEL_VERSION}</span>
          </div>
        </header>

        {message && <div style={noticeStyle}>{message}</div>}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'agencies' && renderAgencies()}
        {activeTab === 'security' && renderAudit()}
        {activeTab === 'plans' && renderPlans()}
        {activeTab === 'leads' && renderLeads()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'landing' && renderLanding()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'data' && renderDataFiles()}
        {activeTab === 'settings' && renderSystemSettings()}
        {activeTab === 'workspace' && renderUsageLimits()}
        {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'agencies' && activeTab !== 'security' && activeTab !== 'plans' && activeTab !== 'leads' && activeTab !== 'messages' && activeTab !== 'landing' && activeTab !== 'templates' && activeTab !== 'data' && activeTab !== 'settings' && activeTab !== 'workspace' && renderStagePlaceholder()}
      </section>
    </main>
  )

  function renderDashboard() {
    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          {metrics.map(metric => (
            <article key={metric.label} style={metricCardStyle(metric.tone)}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.note}</small>
            </article>
          ))}
        </section>

        <section style={twoColumnStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>פעולות מהירות</h2>
            <div style={quickActionsStyle}>
              <button style={quickButtonStyle} type="button" onClick={() => { setActiveTab('users'); setMessage('עבור למסך משתמשים והרשאות כדי לאשר משתמשים או לאפס סיסמה. יצירת משתמש ידנית תחובר לאחר הרחבת בסיס הנתונים.') }}><Users size={18} /> הוסף משתמש</button>
              <button style={quickButtonStyle} type="button" onClick={() => { setActiveTab('agencies'); setMessage('יצירת סוכנות ידנית תחובר לאחר הרחבת בסיס הנתונים. כרגע סוכנויות נגזרות מהרשמה.') }}><Building2 size={18} /> צור סוכנות</button>
              <button style={quickButtonStyle} type="button" onClick={() => void quickCreatePlan()}><BriefcaseBusiness size={18} /> צור תוכנית</button>
              <button style={quickButtonStyle} type="button" onClick={() => returnsInputRef.current?.click()}><FileUp size={18} /> העלה קובץ תשואות</button>
              <button style={quickButtonStyle} type="button" onClick={() => setActiveTab('landing')}><Home size={18} /> ערוך דף נחיתה</button>
              <button style={quickButtonStyle} type="button" onClick={() => setActiveTab('messages')}><Bell size={18} /> שלח הודעת מערכת</button>
            </div>
            <input ref={returnsInputRef} hidden multiple type="file" accept=".xlsx,.xls,.xml,.csv" onChange={event => uploadReturns(event.target.files)} />
          </article>

          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>פעילות אחרונה</h2>
            {auditEvents.length ? (
              <div style={activityListStyle}>
                {auditEvents.slice(0, 7).map(event => (
                  <div key={event.id} style={activityRowStyle}>
                    <span style={statusDotStyle(event.result)} />
                    <strong>{event.action}</strong>
                    <small>{formatTime(event.time)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="אין פעילות להצגה" text="פעולות רגישות שתבצע בפאנל יופיעו כאן." />
            )}
          </article>
        </section>

        <section style={twoColumnStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>קבצי תשואות אחרונים</h2>
            {returnsUploads.length ? (
              <div style={activityListStyle}>
                {returnsUploads.slice(0, 6).map(file => (
                  <div key={file.id} style={activityRowStyle}>
                    <span style={statusDotStyle('success')} />
                    <strong>{file.fileName}</strong>
                    <small>{formatBytes(file.size)} · {formatTime(file.uploadedAt)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="לא הועלו קבצי תשואות בסשן הנוכחי" text="העלאה דרך הפעולות המהירות תעדכן כאן את הרשימה ותירשם בלוג פעילות." />
            )}
          </article>

          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>שגיאות מערכת אחרונות</h2>
            {auditEvents.some(event => event.result === 'failure') ? (
              <div style={activityListStyle}>
                {auditEvents.filter(event => event.result === 'failure').slice(0, 6).map(event => (
                  <div key={event.id} style={activityRowStyle}>
                    <span style={statusDotStyle('failure')} />
                    <strong>{event.action}</strong>
                    <small>{event.entity} · {formatTime(event.time)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="אין שגיאות פעילות" text="כישלונות טעינה או שמירה יופיעו כאן כדי לאפשר טיפול מהיר." />
            )}
          </article>
        </section>
      </div>
    )
  }

  function renderUsers() {
    return (
      <div style={stackStyle}>
        <section style={toolbarStyle}>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="חיפוש לפי שם, מייל, טלפון, תפקיד, תוכנית או סוכנות" style={searchInputStyle} />
          <button type="button" style={primaryButtonStyle} onClick={() => setMessage('יצירת משתמש ידנית תחובר בשלב הבא. כרגע משתמשים נוצרים דרך מסך ההרשמה.')}>הוסף משתמש</button>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>טבלת משתמשים</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם מלא</th>
                  <th style={thStyle}>מייל</th>
                  <th style={thStyle}>טלפון</th>
                  <th style={thStyle}>תפקיד</th>
                  <th style={thStyle}>סוכנות</th>
                  <th style={thStyle}>תוכנית</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>תאריך הרשמה</th>
                  <th style={thStyle}>התחברות אחרונה</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td style={tdStyle}>{user.name || '-'}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.phone || 'לא הוזן'}</td>
                    <td style={tdStyle}>{user.userTypeLabel || 'משתמש קיים'}</td>
                    <td style={tdStyle}>{user.businessName || user.agencyName || '-'}</td>
                    <td style={tdStyle}>{user.planId || '-'}</td>
                    <td style={tdStyle}><span style={statusPillStyle(user.status)}>{user.statusLabel || STATUS_TEXT[user.status || ''] || '-'}</span></td>
                    <td style={tdStyle}>{formatDate(user.createdAt)}</td>
                    <td style={tdStyle}>אין נתון</td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" onClick={() => void patchUser(user.id, { action: 'approve' }, 'המשתמש אושר', 'אישור המשתמש נכשל', 'אישור משתמש')} style={smallButtonStyle}>אשר</button>
                        <button type="button" onClick={() => void patchUser(user.id, { action: 'block' }, 'המשתמש נחסם', 'חסימת המשתמש נכשלה', 'חסימת משתמש')} style={dangerButtonStyle}>חסום</button>
                        <input value={newPasswords[user.id] || ''} onChange={event => setNewPasswords(prev => ({ ...prev, [user.id]: event.target.value }))} placeholder="סיסמה חדשה" style={smallInputStyle} />
                        <button type="button" onClick={() => void resetPassword(user.id)} style={smallButtonStyle}>אפס</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredUsers.length && (
                  <tr><td style={tdStyle} colSpan={10}>{loadingUsers ? 'טוען משתמשים...' : 'אין משתמשים להצגה.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={twoColumnStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>Roles</h2>
            <div style={cardsListStyle}>
              {(infrastructure?.roles || []).map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRoleId(role.id)}
                  style={activeRoleId === role.id ? activeRoleCardStyle : roleCardStyle}
                >
                  <strong>{role.label}</strong>
                  <span>{role.description}</span>
                  <small>{role.permissions.length} הרשאות</small>
                </button>
              ))}
            </div>
          </article>
          <article style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>עריכת הרשאות</h2>
                <p style={mutedStyle}>
                  {infrastructure?.roles.find(role => role.id === activeRoleId)?.label || 'בחר תפקיד'} · {rolePermissionCount(activeRoleId)} הרשאות פעילות
                </p>
              </div>
              <KeyRound color="var(--abd-accent)" />
            </div>
            <div style={permissionEditorStyle}>
              {(infrastructure?.permissions || []).map(permission => {
                const activeRole = infrastructure?.roles.find(role => role.id === activeRoleId)
                const checked = Boolean(activeRole?.permissions.includes(permission.id))
                return (
                  <label key={permission.id} style={permissionToggleStyle(checked)}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={event => void toggleRolePermission(activeRoleId, permission.id, event.target.checked)}
                    />
                    <span>
                      <strong>{permission.label}</strong>
                      <small>{permission.description}</small>
                      <code>{permission.id}</code>
                    </span>
                  </label>
                )
              })}
            </div>
            <div style={userOverrideNoteStyle}>
              החרגת הרשאות למשתמש ספציפי דורשת שדה קבוע במודל המשתמש. בשלב זה לא הוספתי מודל חדש כדי לא לשבור את בסיס הנתונים; זה השלב הבא אחרי אישור מבנה DB.
            </div>
          </article>
        </section>
      </div>
    )
  }

  function renderAgencies() {
    const selectedPlan = infrastructure?.plans.find(plan => plan.id === selectedAgency?.plan)

    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          <article style={metricCardStyle('blue')}><span>סוכנויות / עסקים</span><strong>{agencies.length}</strong><small>נגזר מהרשמות קיימות</small></article>
          <article style={metricCardStyle('green')}><span>משתמשים בסוכנויות</span><strong>{agencies.reduce((sum, agency) => sum + agency.users, 0)}</strong><small>כולל מנהלי סוכנות ועובדים</small></article>
          <article style={metricCardStyle('orange')}><span>בתקופת ניסיון</span><strong>{agencies.filter(agency => String(agency.status).includes('trial')).length}</strong><small>לפי סטטוס מנוי</small></article>
          <article style={metricCardStyle('red')}><span>מוקפאות / חסומות</span><strong>{agencies.filter(agency => ['blocked', 'suspended', 'archived'].includes(String(agency.status))).length}</strong><small>לפי עדכון מנהל</small></article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>סוכנויות / עסקים</h2>
              <p style={mutedStyle}>הסוכנויות נגזרות כרגע מפרטי ההרשמה של המשתמשים. פרטי עסק נוספים נשמרים בפאנל עד חיבור טבלת agencies קבועה.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => setMessage('יצירת סוכנות ידנית דורשת טבלת agencies קבועה. כרגע סוכנויות נפתחות דרך הרשמת מנהל סוכנות.')}>צור סוכנות</button>
          </div>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם העסק</th>
                  <th style={thStyle}>מנהל ראשי</th>
                  <th style={thStyle}>מייל</th>
                  <th style={thStyle}>טלפון</th>
                  <th style={thStyle}>משתמשים</th>
                  <th style={thStyle}>תוכנית</th>
                  <th style={thStyle}>סטטוס מנוי</th>
                  <th style={thStyle}>תאריך הצטרפות</th>
                  <th style={thStyle}>סיום ניסיון</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map(agency => (
                  <tr key={agency.name} style={selectedAgency?.name === agency.name ? selectedTableRowStyle : undefined}>
                    <td style={tdStyle}>{agency.name}</td>
                    <td style={tdStyle}>{agency.manager}</td>
                    <td style={tdStyle}>{agency.email}</td>
                    <td style={tdStyle}>{agency.phone}</td>
                    <td style={tdStyle}>{agency.users}</td>
                    <td style={tdStyle}>{agency.plan}</td>
                    <td style={tdStyle}><span style={statusPillStyle(agency.status)}>{agency.status}</span></td>
                    <td style={tdStyle}>{agency.createdAt}</td>
                    <td style={tdStyle}>{agency.trialEnds}</td>
                    <td style={tdStyle}><button type="button" style={smallButtonStyle} onClick={() => setSelectedAgencyName(agency.name)}>פתח</button></td>
                  </tr>
                ))}
                {!agencies.length && <tr><td style={tdStyle} colSpan={10}>אין סוכנויות להצגה. סוכנות תופיע לאחר הרשמת מנהל סוכנות או עסק עצמאי.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {selectedAgency && (
          <section style={cardStyle}>
            <div style={agencyDetailHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>עמוד סוכנות: {selectedAgency.name}</h2>
                <p style={mutedStyle}>{selectedAgency.manager} · {selectedAgency.users} משתמשים · {selectedAgency.plan}</p>
              </div>
              <div style={agencyBrandPreviewStyle}>
                {selectedAgency.logoUrl ? <img src={selectedAgency.logoUrl} alt={selectedAgency.name} style={agencyLogoStyle} /> : <Building2 size={28} />}
                <span style={{ width: 28, height: 28, borderRadius: 999, border: '1px solid #CFE6FA', background: selectedAgency.brandColor || '#2563EB' }} />
              </div>
            </div>

            <section style={twoColumnStyle}>
              <article style={innerCardStyle}>
                <h3 style={smallSectionTitleStyle}>פרטי עסק</h3>
                <label style={adminFieldStyle}>ח.פ / עוסק
                  <input style={inputStyle} value={selectedAgency.taxId || ''} onChange={event => updateAgencyOverride(selectedAgency.name, { taxId: event.target.value })} placeholder="מספר עסק" />
                </label>
                <label style={adminFieldStyle}>כתובת
                  <input style={inputStyle} value={selectedAgency.address || ''} onChange={event => updateAgencyOverride(selectedAgency.name, { address: event.target.value })} placeholder="כתובת העסק" />
                </label>
                <label style={adminFieldStyle}>לוגו
                  <input style={inputStyle} value={selectedAgency.logoUrl || ''} onChange={event => updateAgencyOverride(selectedAgency.name, { logoUrl: event.target.value })} placeholder="URL ללוגו" />
                </label>
                <label style={adminFieldStyle}>צבע מותג
                  <input type="color" value={selectedAgency.brandColor || '#2563EB'} onChange={event => updateAgencyOverride(selectedAgency.name, { brandColor: event.target.value })} style={colorInputStyle} />
                </label>
              </article>

              <article style={innerCardStyle}>
                <h3 style={smallSectionTitleStyle}>תוכנית ומנוי</h3>
                <label style={adminFieldStyle}>תוכנית
                  <select style={inputStyle} value={selectedAgency.plan} onChange={event => updateAgencyOverride(selectedAgency.name, { plan: event.target.value }, 'תוכנית הסוכנות עודכנה')}>
                    {(infrastructure?.plans || []).map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                    {!infrastructure?.plans?.some(plan => plan.id === selectedAgency.plan) && <option value={selectedAgency.plan}>{selectedAgency.plan}</option>}
                  </select>
                </label>
                <label style={adminFieldStyle}>סטטוס מנוי
                  <select style={inputStyle} value={selectedAgency.status} onChange={event => updateAgencyOverride(selectedAgency.name, { status: event.target.value }, 'סטטוס הסוכנות עודכן')}>
                    <option value="active">פעיל</option>
                    <option value="trial_active">בתקופת ניסיון</option>
                    <option value="suspended">מוקפא</option>
                    <option value="blocked">חסום</option>
                    <option value="archived">ארכיון</option>
                  </select>
                </label>
                <label style={adminFieldStyle}>סיום ניסיון
                  <input type="date" style={inputStyle} value={selectedAgency.trialEnds === 'אין נתון' ? '' : selectedAgency.trialEnds} onChange={event => updateAgencyOverride(selectedAgency.name, { trialEnds: event.target.value }, 'תאריך סיום ניסיון עודכן')} />
                </label>
                <div style={rowActionsStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => updateAgencyOverride(selectedAgency.name, { status: 'trial_active' }, 'תקופת הניסיון הוארכה/נפתחה')}>הארכת ניסיון</button>
                  <button type="button" style={smallButtonStyle} onClick={() => updateAgencyOverride(selectedAgency.name, { status: 'suspended' }, 'הסוכנות הוקפאה')}>הקפאה</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => updateAgencyOverride(selectedAgency.name, { status: 'blocked' }, 'הסוכנות נחסמה')}>חסימה</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => updateAgencyOverride(selectedAgency.name, { status: 'archived' }, 'הסוכנות הועברה לארכיון')}>מחיקה רכה</button>
                </div>
              </article>
            </section>

            <section style={twoColumnStyle}>
              <article style={innerCardStyle}>
                <h3 style={smallSectionTitleStyle}>מגבלות שימוש</h3>
                <div style={limitsGridStyle}>
                  <Limit label="משתמשים כלולים" value={selectedPlan?.includedUsers || '-'} />
                  <Limit label="פגישות חודשיות" value={selectedPlan?.monthlyMeetings || '-'} />
                  <Limit label="לקוחות" value={selectedPlan?.clientLimit || '-'} />
                  <Limit label="מיתוג אישי" value={yesNo(selectedPlan?.features?.customBranding)} />
                </div>
              </article>
              <article style={innerCardStyle}>
                <h3 style={smallSectionTitleStyle}>הערות פנימיות</h3>
                <textarea
                  style={notesTextAreaStyle}
                  value={selectedAgency.notes || ''}
                  onChange={event => updateAgencyOverride(selectedAgency.name, { notes: event.target.value })}
                  placeholder="הערות פנימיות למנהל מערכת בלבד"
                />
              </article>
            </section>

            <section style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <h3 style={smallSectionTitleStyle}>משתמשים בסוכנות</h3>
                <button type="button" style={smallButtonStyle} onClick={() => setMessage('הוספת משתמש לסוכנות קיימת דורשת שיוך קבוע במודל המשתמש. כרגע ניתן לאשר/לחסום משתמשים קיימים.')}>הוסף משתמש</button>
              </div>
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>שם</th>
                      <th style={thStyle}>מייל</th>
                      <th style={thStyle}>טלפון</th>
                      <th style={thStyle}>תפקיד</th>
                      <th style={thStyle}>סטטוס</th>
                      <th style={thStyle}>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgency.members.map(member => (
                      <tr key={member.id}>
                        <td style={tdStyle}>{member.name || '-'}</td>
                        <td style={tdStyle}>{member.email}</td>
                        <td style={tdStyle}>{member.phone || 'לא הוזן'}</td>
                        <td style={tdStyle}>{member.userTypeLabel || 'משתמש'}</td>
                        <td style={tdStyle}><span style={statusPillStyle(member.status)}>{member.statusLabel || member.status || '-'}</span></td>
                        <td style={tdStyle}>
                          <div style={rowActionsStyle}>
                            <button type="button" style={smallButtonStyle} onClick={() => void patchUser(member.id, { action: 'extend_trial' }, 'תקופת הניסיון הוארכה', 'הארכת ניסיון נכשלה', 'הארכת ניסיון')}>הארך ניסיון</button>
                            <button type="button" style={smallButtonStyle} onClick={() => void patchUser(member.id, { action: 'approve' }, 'המשתמש אושר', 'אישור המשתמש נכשל', 'אישור משתמש')}>אשר</button>
                            <button type="button" style={dangerButtonStyle} onClick={() => void patchUser(member.id, { action: 'block' }, 'המשתמש נחסם', 'חסימת המשתמש נכשלה', 'חסימת משתמש')}>חסום</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={twoColumnStyle}>
              <article style={innerCardStyle}>
                <h3 style={smallSectionTitleStyle}>תבניות פרטיות</h3>
                <EmptyState title="אין תבניות פרטיות לסוכנות" text="התשתית תתחבר בשלב תבניות וסיכומי פגישה." />
              </article>
              <article style={innerCardStyle}>
                <h3 style={smallSectionTitleStyle}>היסטוריית פעילות</h3>
                <div style={activityListStyle}>
                  {auditEvents.filter(event => event.entity === selectedAgency.name).slice(0, 6).map(event => (
                    <div key={event.id} style={activityRowStyle}>
                      <span style={statusDotStyle(event.result)} />
                      <strong>{event.action}</strong>
                      <small>{formatTime(event.time)}</small>
                    </div>
                  ))}
                  {!auditEvents.some(event => event.entity === selectedAgency.name) && <EmptyState title="אין פעילות לסוכנות" text="פעולות שתבצע בעמוד הסוכנות יופיעו כאן." />}
                </div>
              </article>
            </section>
          </section>
        )}
      </div>
    )
  }

  function renderAudit() {
    return (
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>אבטחה ולוג פעילות</h2>
        <p style={mutedStyle}>לוג בסיסי לשלב 1. הוא מתעד פעולות רגישות שבוצעו במסך הנוכחי. שמירה קבועה למסד נתונים תתווסף במיגרציה של audit_logs.</p>
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>תאריך</th>
                <th style={thStyle}>משתמש</th>
                <th style={thStyle}>פעולה</th>
                <th style={thStyle}>יישות</th>
                <th style={thStyle}>תוצאה</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map(event => (
                <tr key={event.id}>
                  <td style={tdStyle}>{formatTime(event.time)}</td>
                  <td style={tdStyle}>{event.actor}</td>
                  <td style={tdStyle}>{event.action}</td>
                  <td style={tdStyle}>{event.entity}</td>
                  <td style={tdStyle}><span style={statusPillStyle(event.result === 'failure' ? 'blocked' : 'active')}>{event.result}</span></td>
                </tr>
              ))}
              {!auditEvents.length && <tr><td style={tdStyle} colSpan={5}>אין פעולות בלוג.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderStagePlaceholder() {
    const tab = ADMIN_TABS.find(item => item.id === activeTab)
    return (
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>{tab?.label}</h2>
        <EmptyState
          title={`תשתית לשלב ${tab?.stage || 2}`}
          text="המסך מופיע בתפריט כדי לשמור על מבנה הפאנל המלא. הפונקציונליות תחובר בשלבים הבאים לפי סדר הביצוע שהוגדר."
        />
      </section>
    )
  }

  function renderPlans() {
    const plans = infrastructure?.plans || []
    const subscriptionRows = users.map(user => ({
      id: user.id,
      name: user.businessName || user.agencyName || user.name || user.email,
      owner: user.name || '-',
      plan: user.planId || 'legacy',
      subscriptionStatus: user.subscriptionStatus || user.status || 'active',
      users: user.businessName || user.agencyName ? users.filter(item => (item.businessName || item.agencyName) === (user.businessName || user.agencyName)).length : 1,
      trialEnds: 'אין נתון',
    }))

    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          <article style={metricCardStyle('green')}><span>תוכניות פעילות</span><strong>{plans.filter(plan => plan.status === 'active').length}</strong></article>
          <article style={metricCardStyle('orange')}><span>תוכניות טיוטה</span><strong>{plans.filter(plan => plan.status === 'draft').length}</strong></article>
          <article style={metricCardStyle('blue')}><span>מנויי ניסיון</span><strong>{subscriptionRows.filter(row => String(row.subscriptionStatus).includes('trial')).length}</strong></article>
          <article style={metricCardStyle('red')}><span>מנויים חסומים / פגים</span><strong>{subscriptionRows.filter(row => ['blocked', 'expired'].includes(String(row.subscriptionStatus))).length}</strong></article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>תוכניות שימוש</h2>
              <p style={mutedStyle}>ניהול תוכניות שימוש ומגבלות. השינויים נשמרים בתשתית הניהול המרכזית כאשר D1 מחובר.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => void createPlan()}>צור תוכנית</button>
          </div>
          <div style={planCardsGridStyle}>
            {plans.map(plan => (
              <article key={plan.id} style={planCardStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <input
                      aria-label="שם תוכנית"
                      value={plan.name}
                      onChange={event => void updatePlan(plan.id, { name: event.target.value })}
                      style={{ ...inputStyle, fontWeight: 900, fontSize: 18 }}
                    />
                    <input
                      aria-label="תיאור תוכנית"
                      value={plan.shortDescription || ''}
                      onChange={event => void updatePlan(plan.id, { shortDescription: event.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <select value={plan.status} onChange={event => void updatePlan(plan.id, { status: event.target.value })} style={{ ...inputStyle, width: 130 }}>
                    <option value="draft">טיוטה</option>
                    <option value="active">פעיל</option>
                    <option value="hidden">מוסתר</option>
                    <option value="archived">ארכיון</option>
                  </select>
                </div>
                <div style={planPriceStyle}>
                  ₪
                  <input
                    aria-label="מחיר חודשי"
                    type="number"
                    value={plan.monthlyPrice}
                    onChange={event => void updatePlan(plan.id, { monthlyPrice: Number(event.target.value) || 0 })}
                    style={priceInputStyle}
                  />
                  <small> / חודש</small>
                </div>
                <div style={limitsGridStyle}>
                  <PlanNumberInput label="משתמשים" value={plan.includedUsers} onChange={value => void updatePlan(plan.id, { includedUsers: value })} />
                  <PlanNumberInput label="פגישות חודשיות" value={plan.monthlyMeetings} onChange={value => void updatePlan(plan.id, { monthlyMeetings: value })} />
                  <PlanNumberInput label="לקוחות" value={plan.clientLimit || 0} onChange={value => void updatePlan(plan.id, { clientLimit: value })} />
                  <PlanNumberInput label="מחיר שנתי" value={plan.annualPrice || 0} onChange={value => void updatePlan(plan.id, { annualPrice: value })} />
                </div>
                <div style={featureListStyle}>
                  {Object.entries(plan.features || {}).map(([key, enabled]) => (
                    <label key={key} style={featureItemStyle(enabled)}>
                      <input
                        type="checkbox"
                        checked={Boolean(enabled)}
                        onChange={event => void updatePlanFeature(plan.id, key, event.target.checked)}
                      />
                      {enabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {featureLabel(key)}
                    </label>
                  ))}
                </div>
                <div style={rowActionsStyle}>
                  <button type="button" style={smallButtonStyle} onClick={() => void updatePlan(plan.id, { status: 'active' })}>הפעל</button>
                  <button type="button" style={smallButtonStyle} onClick={() => void clonePlan(plan.id)}>שכפל</button>
                  <button type="button" style={dangerButtonStyle} onClick={() => void updatePlan(plan.id, { status: 'hidden' })}>הסתר</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>מנויים וסטטוס ניסיון</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>עסק / משתמש</th>
                  <th style={thStyle}>מנהל</th>
                  <th style={thStyle}>תוכנית</th>
                  <th style={thStyle}>משתמשים</th>
                  <th style={thStyle}>סטטוס מנוי</th>
                  <th style={thStyle}>סיום ניסיון</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionRows.map(row => (
                  <tr key={row.id}>
                    <td style={tdStyle}>{row.name}</td>
                    <td style={tdStyle}>{row.owner}</td>
                    <td style={tdStyle}>
                      <select
                        value={row.plan}
                        onChange={event => void setUserSubscription(row.id, event.target.value, row.subscriptionStatus)}
                        style={smallSelectStyle}
                      >
                        {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                        {!plans.some(plan => plan.id === row.plan) && <option value={row.plan}>{row.plan}</option>}
                      </select>
                    </td>
                    <td style={tdStyle}>{row.users}</td>
                    <td style={tdStyle}>
                      <select
                        value={row.subscriptionStatus}
                        onChange={event => void setUserSubscription(row.id, row.plan, event.target.value)}
                        style={smallSelectStyle}
                      >
                        <option value="trial_active">בתקופת ניסיון</option>
                        <option value="active">פעיל</option>
                        <option value="expired">מנוי פג</option>
                        <option value="blocked">חסום</option>
                        <option value="cancelled">בוטל</option>
                      </select>
                    </td>
                    <td style={tdStyle}>{row.trialEnds}</td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" style={smallButtonStyle} onClick={() => void patchUser(row.id, { action: 'extend_trial' }, 'תקופת הניסיון הוארכה', 'הארכת ניסיון נכשלה', 'הארכת ניסיון')}>הארך ניסיון</button>
                        <button type="button" style={smallButtonStyle} onClick={() => void patchUser(row.id, { action: 'approve' }, 'המנוי נפתח לשימוש', 'פתיחת מנוי נכשלה', 'פתיחה ידנית')}>פתח ידנית</button>
                        <button type="button" style={dangerButtonStyle} onClick={() => void patchUser(row.id, { action: 'block' }, 'המנוי נחסם', 'חסימת מנוי נכשלה', 'חסימת שימוש')}>חסום</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!subscriptionRows.length && <tr><td style={tdStyle} colSpan={7}>אין מנויים להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderSystemSettings() {
    return (
      <div style={stackStyle}>
        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Feature Flags</h2>
              <p style={mutedStyle}>הפעלה וכיבוי ברמת תשתית. בשלב זה ההגדרות מקומיות בפאנל; שמירה גלובלית תתווסף במודול admin_settings.</p>
            </div>
            <SlidersHorizontal color="var(--abd-accent)" />
          </div>
          <div style={flagsGridStyle}>
            {FEATURE_FLAGS.map(flag => (
              <label key={flag.id} style={flagCardStyle(featureFlags[flag.id])}>
                <span>
                  <strong>{flag.label}</strong>
                  <small>{flag.plans.length ? `פתוח לתוכניות: ${flag.plans.join(', ')}` : 'חסום עד חיבור עתידי'}</small>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(featureFlags[flag.id])}
                  onChange={event => {
                    setFeatureFlags(prev => ({ ...prev, [flag.id]: event.target.checked }))
                    addAudit(`שינוי Feature Flag: ${flag.label}`, flag.id, 'info')
                  }}
                />
              </label>
            ))}
          </div>
        </section>

        <section style={twoColumnStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>הגדרות הרשמה</h2>
            <SettingRow label="הרשמה פתוחה" value={infrastructure?.registration?.registrationOpen ? 'כן' : 'לא'} />
            <SettingRow label="אישור ידני למשתמשים" value={infrastructure?.registration?.manualApprovalRequired ? 'כן' : 'לא'} />
            <SettingRow label="תקופת ניסיון ברירת מחדל" value={`${infrastructure?.registration?.defaultTrialDays || 14} ימים`} />
            <SettingRow label="אזור זמן" value="Asia/Jerusalem" />
            <SettingRow label="שפה" value="עברית" />
          </article>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>מצב תחזוקה והודעות</h2>
            <label style={adminFieldStyle}>שם מערכת<input style={inputStyle} defaultValue="ABD Finance" /></label>
            <label style={adminFieldStyle}>הודעת מערכת גלובלית<textarea style={{ ...inputStyle, minHeight: 94 }} placeholder="הודעה שתוצג למשתמשים בעתיד" /></label>
            <button type="button" style={primaryButtonStyle} onClick={() => infrastructure && void saveInfrastructure(infrastructure, 'הגדרות המערכת נשמרו')}>שמור הגדרות</button>
          </article>
        </section>
      </div>
    )
  }

  function renderUsageLimits() {
    return (
      <section style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>מגבלות שימוש לפי תוכנית</h2>
            <p style={mutedStyle}>תצוגת ניהול למגבלות משתמשים, פגישות, לקוחות ויכולות. enforcement בפועל יבוצע לאחר חיבור שכבת subscription קבועה.</p>
          </div>
          <Gauge color="var(--abd-accent)" />
        </div>
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>תוכנית</th>
                <th style={thStyle}>משתמשים</th>
                <th style={thStyle}>פגישות חודשיות</th>
                <th style={thStyle}>לקוחות</th>
                <th style={thStyle}>PDF</th>
                <th style={thStyle}>Excel</th>
                <th style={thStyle}>סימולטורים</th>
                <th style={thStyle}>ניתוח תיק</th>
                <th style={thStyle}>מיתוג אישי</th>
              </tr>
            </thead>
            <tbody>
              {(infrastructure?.plans || []).map(plan => (
                <tr key={plan.id}>
                  <td style={tdStyle}>{plan.name}</td>
                  <td style={tdStyle}>{plan.includedUsers}</td>
                  <td style={tdStyle}>{plan.monthlyMeetings}</td>
                  <td style={tdStyle}>{plan.clientLimit || 0}</td>
                  <td style={tdStyle}>{yesNo(plan.features?.pdfExport)}</td>
                  <td style={tdStyle}>{yesNo(plan.features?.excelExport)}</td>
                  <td style={tdStyle}>{yesNo(plan.features?.simulators)}</td>
                  <td style={tdStyle}>{yesNo(plan.features?.portfolioAnalysis)}</td>
                  <td style={tdStyle}>{yesNo(plan.features?.customBranding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  function renderLanding() {
    const draft = infrastructure?.landingPageDraft
    const sections = [...(draft?.sections || [])].sort((a, b) => a.sortOrder - b.sortOrder)

    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          <article style={metricCardStyle('blue')}><span>סטטוס דף</span><strong>{draft?.status || 'draft'}</strong></article>
          <article style={metricCardStyle('green')}><span>מקטעים פעילים</span><strong>{sections.filter(section => section.active).length}</strong></article>
          <article style={metricCardStyle('orange')}><span>מקטעים מוסתרים</span><strong>{sections.filter(section => !section.active).length}</strong></article>
          <article style={metricCardStyle('gray')}><span>Slug</span><strong>{draft?.slug || '/'}</strong></article>
        </section>

        <section style={twoColumnStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>הגדרות דף נחיתה</h2>
            <label style={adminFieldStyle}>כותרת ראשית
              <input style={inputStyle} defaultValue={draft?.title || ''} />
            </label>
            <label style={adminFieldStyle}>Meta Description
              <textarea style={{ ...inputStyle, minHeight: 92 }} defaultValue={draft?.metaDescription || ''} />
            </label>
            <label style={adminFieldStyle}>Canonical URL
              <input style={inputStyle} defaultValue={draft?.canonicalUrl || ''} placeholder="https://..." />
            </label>
            <label style={adminFieldStyle}>Open Graph Image
              <input style={inputStyle} defaultValue={draft?.openGraphImage || ''} placeholder="URL לתמונה" />
            </label>
            <div style={rowActionsStyle}>
              <button type="button" style={primaryButtonStyle} onClick={() => stageAction('שמירת טיוטת דף נחיתה', 4)}>שמור טיוטה</button>
              <button type="button" style={smallButtonStyle} onClick={() => stageAction('תצוגה מקדימה לדף נחיתה', 4)}>תצוגה מקדימה</button>
              <button type="button" style={smallButtonStyle} onClick={() => stageAction('פרסום דף נחיתה', 4)}>פרסם</button>
            </div>
          </article>

          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>בדיקות לפני פרסום</h2>
            <SettingRow label="RTL מלא" value="נדרש בכל מקטע" />
            <SettingRow label="כפתור כניסה למערכת" value="/login" />
            <SettingRow label="כפתור הרשמה" value="/register" />
            <SettingRow label="חיבור לידים" value="תשתית מוכנה, לא מחובר לדף ציבורי" />
            <SettingRow label="SEO" value="כותרת, תיאור ותמונת שיתוף" />
          </article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>מקטעי הדף</h2>
              <p style={mutedStyle}>ניהול תשתיתי של מקטעים. בשלב הזה שינויי עריכה מוצגים בפאנל בלבד ולא נשמרים למסד נתונים.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => stageAction('הוספת מקטע לדף נחיתה', 4)}>הוסף מקטע</button>
          </div>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>סדר</th>
                  <th style={thStyle}>סוג</th>
                  <th style={thStyle}>כותרת</th>
                  <th style={thStyle}>טקסט</th>
                  <th style={thStyle}>Desktop</th>
                  <th style={thStyle}>Mobile</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <tr key={section.id}>
                    <td style={tdStyle}>{section.sortOrder}</td>
                    <td style={tdStyle}>{section.type}</td>
                    <td style={tdStyle}>{section.title}</td>
                    <td style={tdStyle}>{section.text}</td>
                    <td style={tdStyle}>{yesNo(section.desktopVisible)}</td>
                    <td style={tdStyle}>{yesNo(section.mobileVisible)}</td>
                    <td style={tdStyle}><span style={statusPillStyle(section.active ? 'active' : 'blocked')}>{section.active ? 'פעיל' : 'כבוי'}</span></td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" style={smallButtonStyle} onClick={() => stageAction(`עריכת מקטע ${section.id}`, 4)}>ערוך</button>
                        <button type="button" style={smallButtonStyle} onClick={() => stageAction(`שכפול מקטע ${section.id}`, 4)}>שכפל</button>
                        <button type="button" style={dangerButtonStyle} onClick={() => stageAction(`כיבוי מקטע ${section.id}`, 4)}>כבה</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!sections.length && <tr><td style={tdStyle} colSpan={8}>אין מקטעים להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderLeads() {
    const openLeads = leads.filter(lead => lead.statusCode === 'open' || lead.statusCode === 'assigned' || lead.statusCode === 'emailed').length
    const convertedLeads = leads.filter(lead => lead.statusCode === 'converted').length

    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          <article style={metricCardStyle('blue')}><span>לידים במערכת</span><strong>{leads.length}</strong></article>
          <article style={metricCardStyle('orange')}><span>ממתינים לטיפול</span><strong>{openLeads}</strong></article>
          <article style={metricCardStyle('green')}><span>הומרו למשתמשים</span><strong>{convertedLeads}</strong></article>
          <article style={metricCardStyle('gray')}><span>מקורות פעילים</span><strong>2</strong></article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>לידים ולקוחות</h2>
              <p style={mutedStyle}>לידים שמגיעים מהרשמה ומדף נחיתה עתידי. הפעולות נשמרות מקומית בפאנל עד חיבור טבלת לידים ייעודית ב-D1.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => stageAction('פתיחת ליד ידני', 3)}>הוסף ליד</button>
          </div>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם</th>
                  <th style={thStyle}>מייל</th>
                  <th style={thStyle}>טלפון</th>
                  <th style={thStyle}>מקור</th>
                  <th style={thStyle}>סוג משתמש</th>
                  <th style={thStyle}>עסק / סוכנות</th>
                  <th style={thStyle}>תוכנית</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>אחראי</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td style={tdStyle}>{lead.name}</td>
                    <td style={tdStyle}>{lead.email}</td>
                    <td style={tdStyle}>{lead.phone}</td>
                    <td style={tdStyle}>{lead.source}</td>
                    <td style={tdStyle}>{lead.type}</td>
                    <td style={tdStyle}>{lead.business}</td>
                    <td style={tdStyle}>{lead.plan}</td>
                    <td style={tdStyle}><span style={statusPillStyle(lead.statusCode === 'converted' ? 'active' : lead.statusCode === 'closed' ? 'blocked' : 'pending_approval')}>{lead.status}</span></td>
                    <td style={tdStyle}>{lead.owner}</td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" style={smallButtonStyle} onClick={() => updateLeadStatus(lead.id, 'assigned')}>שייך</button>
                        <button type="button" style={smallButtonStyle} onClick={() => updateLeadStatus(lead.id, 'emailed')}>סמן מייל</button>
                        <button type="button" style={dangerButtonStyle} onClick={() => updateLeadStatus(lead.id, 'closed')}>סגור</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!leads.length && <tr><td style={tdStyle} colSpan={10}>אין לידים להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderMessages() {
    const templates = infrastructure?.emailTemplates || []

    return (
      <div style={stackStyle}>
        <section style={twoColumnStyle}>
          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>הודעות מערכת</h2>
            <label style={adminFieldStyle}>נמען
              <select style={inputStyle} defaultValue="pending">
                <option value="pending">נרשמים שממתינים לאישור</option>
                <option value="active">משתמשים פעילים</option>
                <option value="trial">משתמשים בתקופת ניסיון</option>
              </select>
            </label>
            <label style={adminFieldStyle}>נושא
              <input style={inputStyle} defaultValue="עדכון ממערכת ABD Finance" />
            </label>
            <label style={adminFieldStyle}>תוכן ההודעה
              <textarea style={{ ...inputStyle, minHeight: 130 }} placeholder="כתוב הודעה שתישלח בעתיד דרך מודול מיילים." />
            </label>
            <div style={rowActionsStyle}>
              <button type="button" style={primaryButtonStyle} onClick={() => stageAction('שמירת טיוטת הודעה', 3)}>שמור טיוטה</button>
              <button type="button" style={smallButtonStyle} onClick={() => stageAction('שליחת הודעת מערכת', 3)}>שלח</button>
            </div>
          </article>

          <article style={cardStyle}>
            <h2 style={sectionTitleStyle}>סטטוס ערוצי שליחה</h2>
            <SettingRow label="Email SMTP / API" value="תשתית מוכנה, טרם חובר ספק שליחה" />
            <SettingRow label="WhatsApp" value="עתידי" />
            <SettingRow label="התראות בתוך המערכת" value="תשתית מקומית" />
            <SettingRow label="לוג שליחה" value="Audit מקומי בשלב זה" />
          </article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>תבניות מייל</h2>
              <p style={mutedStyle}>התבניות נטענות מתשתית האדמין הקיימת. עריכה קבועה תחובר בשלב תבניות וסיכומים.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => stageAction('יצירת תבנית מייל', 3)}>צור תבנית</button>
          </div>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם תבנית</th>
                  <th style={thStyle}>נושא</th>
                  <th style={thStyle}>משתנים</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template.id}>
                    <td style={tdStyle}>{template.name}</td>
                    <td style={tdStyle}>{template.subject}</td>
                    <td style={tdStyle}>{template.variables?.join(', ') || '-'}</td>
                    <td style={tdStyle}><span style={statusPillStyle(template.active ? 'active' : 'blocked')}>{template.active ? 'פעילה' : 'כבויה'}</span></td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" style={smallButtonStyle} onClick={() => stageAction(`עריכת תבנית ${template.name}`, 3)}>ערוך</button>
                        <button type="button" style={smallButtonStyle} onClick={() => stageAction(`בדיקת תבנית ${template.name}`, 3)}>בדוק</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!templates.length && <tr><td style={tdStyle} colSpan={5}>אין תבניות מייל להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderTemplates() {
    const templates = infrastructure?.emailTemplates || []
    const recommendationTemplates = [
      { id: 'migration_new_product', name: 'ניוד למוצר חדש', category: 'המלצה', status: 'פעילה' },
      { id: 'keep_existing', name: 'השארת מוצר קיים', category: 'המלצה', status: 'פעילה' },
      { id: 'start_pension', name: 'התחלת קצבה', category: 'סיכום פגישה', status: 'פעילה' },
      { id: 'cash_withdrawal', name: 'פדיון כספים', category: 'סיכום פגישה', status: 'פעילה' },
      { id: 'ongoing_service', name: 'טיפול שוטף', category: 'משימה', status: 'פעילה' },
    ]

    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          <article style={metricCardStyle('blue')}><span>תבניות המלצה</span><strong>{recommendationTemplates.length}</strong></article>
          <article style={metricCardStyle('green')}><span>תבניות מייל</span><strong>{templates.length}</strong></article>
          <article style={metricCardStyle('orange')}><span>קטגוריות</span><strong>4</strong></article>
          <article style={metricCardStyle('gray')}><span>שמירה קבועה</span><strong>עתידי</strong></article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>תבניות המלצה וסיכום</h2>
              <p style={mutedStyle}>תשתית ניהול לתבניות שישמשו את פופאפ הקופה, מודול ההמלצות וסיכום הפגישה.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => stageAction('יצירת תבנית המלצה', 5)}>צור תבנית</button>
          </div>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם תבנית</th>
                  <th style={thStyle}>קטגוריה</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>שימוש במערכת</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {recommendationTemplates.map(template => (
                  <tr key={template.id}>
                    <td style={tdStyle}>{template.name}</td>
                    <td style={tdStyle}>{template.category}</td>
                    <td style={tdStyle}><span style={statusPillStyle('active')}>{template.status}</span></td>
                    <td style={tdStyle}>פופאפ קופה / המלצות / סיכום</td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" style={smallButtonStyle} onClick={() => stageAction(`עריכת תבנית ${template.name}`, 5)}>ערוך</button>
                        <button type="button" style={smallButtonStyle} onClick={() => stageAction(`שכפול תבנית ${template.name}`, 5)}>שכפל</button>
                        <button type="button" style={dangerButtonStyle} onClick={() => stageAction(`כיבוי תבנית ${template.name}`, 5)}>כבה</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>תבניות מייל מערכת</h2>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>שם</th>
                  <th style={thStyle}>נושא</th>
                  <th style={thStyle}>משתנים</th>
                  <th style={thStyle}>סטטוס</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template.id}>
                    <td style={tdStyle}>{template.name}</td>
                    <td style={tdStyle}>{template.subject}</td>
                    <td style={tdStyle}>{template.variables?.join(', ') || '-'}</td>
                    <td style={tdStyle}><span style={statusPillStyle(template.active ? 'active' : 'blocked')}>{template.active ? 'פעילה' : 'כבויה'}</span></td>
                    <td style={tdStyle}>
                      <button type="button" style={smallButtonStyle} onClick={() => stageAction(`עריכת תבנית מייל ${template.name}`, 5)}>ערוך</button>
                    </td>
                  </tr>
                ))}
                {!templates.length && <tr><td style={tdStyle} colSpan={5}>אין תבניות מייל להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function renderDataFiles() {
    const kinds = infrastructure?.dataImportKinds || []

    return (
      <div style={stackStyle}>
        <section style={metricsGridStyle}>
          <article style={metricCardStyle('blue')}><span>סוגי קבצים</span><strong>{kinds.length}</strong></article>
          <article style={metricCardStyle('green')}><span>קבצי תשואות</span><strong>{kinds.filter(kind => kind.id.includes('returns')).length}</strong></article>
          <article style={metricCardStyle('orange')}><span>קבצי עזר</span><strong>{kinds.filter(kind => !kind.id.includes('returns')).length}</strong></article>
          <article style={metricCardStyle('gray')}><span>גרסה פעילה</span><strong>מקומית</strong></article>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>קבצי נתונים ותשואות</h2>
              <p style={mutedStyle}>תשתית להעלאת קבצי רשות שוק ההון וקבצי עזר. בשלב זה הקבצים לא נשמרים לשרת ולא מחליפים את מנגנון התשואות הקיים.</p>
            </div>
            <button type="button" style={primaryButtonStyle} onClick={() => returnsInputRef.current?.click()}>העלה קבצים</button>
          </div>
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>סוג קובץ</th>
                  <th style={thStyle}>סיומות מותרות</th>
                  <th style={thStyle}>עמודות חובה</th>
                  <th style={thStyle}>שימוש במערכת</th>
                  <th style={thStyle}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {kinds.map(kind => (
                  <tr key={kind.id}>
                    <td style={tdStyle}>{kind.label}</td>
                    <td style={tdStyle}>{kind.accepts.join(', ')}</td>
                    <td style={tdStyle}>{kind.requiredColumns.join(', ')}</td>
                    <td style={tdStyle}>{kind.id.includes('returns') ? 'תשואות ABD ומסלולי השקעה' : 'נתוני עזר לפגישה חכמה'}</td>
                    <td style={tdStyle}>
                      <div style={rowActionsStyle}>
                        <button type="button" style={smallButtonStyle} onClick={() => validateDataImportKind(kind)}>מיפוי</button>
                        <button type="button" style={smallButtonStyle} onClick={() => validateDataImportKind(kind)}>בדיקה</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!kinds.length && <tr><td style={tdStyle} colSpan={5}>אין סוגי קבצים להצגה.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  function stageAction(label: string, stage = 2) {
    setMessage(`${label}: פעולה זו עדיין ממתינה לחיבור מלא בשלב ${stage}.`)
    addAudit(label, `stage-${stage}`, 'info')
  }
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div style={emptyStateStyle}>
      <ShieldCheck size={28} color="var(--abd-accent)" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

function Limit({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={limitStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PlanNumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label style={limitStyle}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={event => onChange(Number(event.target.value) || 0)}
        style={compactNumberInputStyle}
      />
    </label>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={settingRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function yesNo(value?: boolean) {
  return value ? 'כן' : 'לא'
}

function featureLabel(key: string) {
  const labels: Record<string, string> = {
    pdfExport: 'ייצוא PDF',
    excelExport: 'ייצוא Excel',
    simulators: 'סימולטורים',
    portfolioAnalysis: 'ניתוח תיק',
    advancedTemplates: 'תבניות מתקדמות',
    ai: 'AI',
    extendedSupport: 'תמיכה מורחבת',
    customBranding: 'מיתוג אישי',
  }
  return labels[key] || key
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('he-IL')
}

function formatTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 KB'
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024).toLocaleString('he-IL')} KB`
  return `${(value / 1024 / 1024).toLocaleString('he-IL', { maximumFractionDigits: 1 })} MB`
}

function statusPillStyle(status?: string): React.CSSProperties {
  if (status === 'active' || status === 'success') return { ...pillBaseStyle, background: 'var(--status-active-bg)', color: 'var(--status-active-text)' }
  if (status === 'blocked' || status === 'failure') return { ...pillBaseStyle, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)' }
  return { ...pillBaseStyle, background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)' }
}

function statusDotStyle(result: AuditEvent['result']): React.CSSProperties {
  return {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: result === 'failure' ? 'var(--status-danger)' : result === 'success' ? 'var(--status-active)' : 'var(--abd-accent)',
  }
}

function navButtonStyle(active: boolean): React.CSSProperties {
  return {
    width: '100%',
    minHeight: 42,
    display: 'grid',
    gridTemplateColumns: '22px 1fr auto',
    alignItems: 'center',
    gap: 9,
    border: '1px solid',
    borderColor: active ? '#B8D9FF' : 'transparent',
    borderRadius: 13,
    background: active ? '#EFF6FF' : 'transparent',
    color: active ? 'var(--abd-primary)' : '#6F8DB5',
    fontFamily: 'var(--font-main)',
    fontWeight: 900,
    textAlign: 'right',
    padding: '8px 10px',
    cursor: 'pointer',
  }
}

function metricCardStyle(tone: string): React.CSSProperties {
  const colors: Record<string, string> = {
    green: 'linear-gradient(135deg, #ECFDF5, #FFFFFF)',
    orange: 'linear-gradient(135deg, #FFFBEB, #FFFFFF)',
    red: 'linear-gradient(135deg, #FEF2F2, #FFFFFF)',
    blue: 'linear-gradient(135deg, #EFF6FF, #FFFFFF)',
    gray: 'linear-gradient(135deg, #F8FAFC, #FFFFFF)',
  }
  return {
    display: 'grid',
    gap: 7,
    minHeight: 105,
    padding: 18,
    borderRadius: 18,
    border: '1px solid #D7EAFB',
    background: colors[tone] || colors.gray,
    boxShadow: 'var(--shadow-card)',
    color: 'var(--abd-primary)',
  }
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '300px 1fr', fontFamily: 'var(--font-main)', background: 'var(--bg-shell)' }
const loginPageStyle: React.CSSProperties = { minHeight: '100vh', padding: 28, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-main)', background: 'var(--bg-shell)' }
const loginCardStyle: React.CSSProperties = { width: 'min(420px, 92vw)', display: 'grid', gap: 14, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 22, padding: 28, boxShadow: 'var(--shadow-hover)' }
const sidebarStyle: React.CSSProperties = { minHeight: '100vh', padding: 18, background: '#FFFFFF', borderLeft: '1px solid #D7EAFB', boxShadow: '0 8px 30px rgba(15,25,41,0.08)', position: 'sticky', top: 0, alignSelf: 'start' }
const brandStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 16px', color: 'var(--abd-primary)', borderBottom: '1px solid #E6EEF7', marginBottom: 14 }
const logoStyle: React.CSSProperties = { width: 54, height: 38, objectFit: 'contain', borderRadius: 10, background: '#F8FBFF' }
const navStyle: React.CSSProperties = { display: 'grid', gap: 5 }
const contentStyle: React.CSSProperties = { padding: 28, minWidth: 0 }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 22 }
const titleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 32, fontWeight: 900 }
const loginTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 28, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 5 }
const adminBadgeStyle: React.CSSProperties = { height: 38, border: '1px solid #CFE6FA', borderRadius: 999, padding: '8px 14px', background: '#fff', color: 'var(--abd-primary)', fontWeight: 900 }
const versionBadgeStyle: React.CSSProperties = { border: '1px solid #D7EAFB', borderRadius: 999, padding: '5px 10px', background: '#F8FBFF', color: '#6F8DB5', fontSize: 12, fontWeight: 900, direction: 'ltr' }
const stackStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const metricsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }
const twoColumnStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 14, background: '#fff', border: '1px solid #D7EAFB', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-card)' }
const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }
const sectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 22, fontWeight: 900 }
const toolbarStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }
const inputStyle: React.CSSProperties = { minHeight: 44, border: '1px solid #CFE6FA', borderRadius: 12, padding: '8px 12px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)' }
const compactNumberInputStyle: React.CSSProperties = { width: '100%', minHeight: 34, border: '1px solid #CFE6FA', borderRadius: 10, padding: '4px 8px', fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', fontWeight: 900, direction: 'ltr', textAlign: 'center' }
const searchInputStyle: React.CSSProperties = { ...inputStyle, width: '100%' }
const primaryButtonStyle: React.CSSProperties = { minHeight: 44, border: 0, borderRadius: 12, background: 'var(--abd-accent)', color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 16px', cursor: 'pointer' }
const smallButtonStyle: React.CSSProperties = { ...primaryButtonStyle, minHeight: 36, padding: '0 10px' }
const dangerButtonStyle: React.CSSProperties = { ...smallButtonStyle, background: 'var(--status-danger)', color: '#fff' }
const quickActionsStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }
const quickButtonStyle: React.CSSProperties = { minHeight: 46, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #CFE6FA', borderRadius: 13, background: '#F8FBFF', color: 'var(--abd-primary)', fontFamily: 'var(--font-main)', fontWeight: 900, padding: '0 12px', cursor: 'pointer' }
const errorStyle: React.CSSProperties = { color: 'var(--status-danger-text)', background: 'var(--status-danger-bg)', borderRadius: 12, padding: 10, fontWeight: 800 }
const noticeStyle: React.CSSProperties = { background: '#EAF6FF', color: 'var(--abd-primary)', border: '1px solid #CFE6FA', borderRadius: 14, padding: 12, marginBottom: 18, fontWeight: 900 }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #D7EAFB', borderRadius: 14 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 1020 }
const thStyle: React.CSSProperties = { textAlign: 'right', background: 'var(--abd-primary)', color: '#fff', padding: 11, whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: 11, borderBottom: '1px solid #E6EEF7', color: 'var(--abd-primary)', fontWeight: 700, verticalAlign: 'middle' }
const selectedTableRowStyle: React.CSSProperties = { background: '#EFF6FF', boxShadow: 'inset 4px 0 0 var(--abd-accent)' }
const pillBaseStyle: React.CSSProperties = { borderRadius: 999, padding: '5px 9px', fontWeight: 900, whiteSpace: 'nowrap' }
const rowActionsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }
const smallInputStyle: React.CSSProperties = { ...inputStyle, minHeight: 36, width: 138 }
const smallSelectStyle: React.CSSProperties = { ...inputStyle, minHeight: 36, width: 150, padding: '4px 8px', fontWeight: 900 }
const activityListStyle: React.CSSProperties = { display: 'grid', gap: 9 }
const activityRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '12px 1fr auto', alignItems: 'center', gap: 9, padding: 10, borderRadius: 12, background: '#F8FBFF', color: 'var(--abd-primary)' }
const cardsListStyle: React.CSSProperties = { display: 'grid', gap: 10, maxHeight: 360, overflow: 'auto' }
const roleCardStyle: React.CSSProperties = { display: 'grid', gap: 5, border: '1px solid #D7EAFB', borderRadius: 14, padding: 12, color: 'var(--abd-primary)', background: '#FBFDFF', textAlign: 'right', fontFamily: 'var(--font-main)', cursor: 'pointer' }
const activeRoleCardStyle: React.CSSProperties = { ...roleCardStyle, borderColor: 'var(--abd-accent)', background: '#EFF6FF', boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.25)' }
const innerCardStyle: React.CSSProperties = { display: 'grid', gap: 13, border: '1px solid #D7EAFB', borderRadius: 18, background: '#FBFDFF', padding: 16 }
const smallSectionTitleStyle: React.CSSProperties = { color: 'var(--abd-primary)', fontSize: 18, fontWeight: 900 }
const agencyDetailHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderBottom: '1px solid #E6EEF7', paddingBottom: 14 }
const agencyBrandPreviewStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '70px 28px', gap: 10, alignItems: 'center', color: 'var(--abd-primary)' }
const agencyLogoStyle: React.CSSProperties = { width: 70, height: 48, objectFit: 'contain', border: '1px solid #D7EAFB', borderRadius: 12, background: '#fff', padding: 6 }
const colorInputStyle: React.CSSProperties = { width: 72, height: 42, border: '1px solid #CFE6FA', borderRadius: 12, background: '#fff', padding: 4, cursor: 'pointer' }
const notesTextAreaStyle: React.CSSProperties = { ...inputStyle, minHeight: 155, resize: 'vertical' }
const permissionGridStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const permissionPillStyle: React.CSSProperties = { borderRadius: 999, padding: '6px 10px', background: '#EFF6FF', border: '1px solid #CFE6FA', color: 'var(--abd-primary)', fontWeight: 900, fontSize: 12 }
const permissionEditorStyle: React.CSSProperties = { display: 'grid', gap: 10, maxHeight: 560, overflowY: 'auto', paddingInlineEnd: 4 }
const permissionToggleStyle = (active: boolean): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 10,
  alignItems: 'start',
  border: '1px solid',
  borderColor: active ? '#93C5FD' : '#D7EAFB',
  borderRadius: 14,
  background: active ? '#EFF6FF' : '#FFFFFF',
  color: 'var(--abd-primary)',
  padding: 12,
  cursor: 'pointer',
  lineHeight: 1.55,
})
const userOverrideNoteStyle: React.CSSProperties = { marginTop: 14, border: '1px dashed #BFE2FB', borderRadius: 14, background: '#F8FBFF', color: '#5F789C', padding: 12, fontWeight: 800, lineHeight: 1.7 }
const emptyStateStyle: React.CSSProperties = { minHeight: 180, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 8, borderRadius: 18, border: '1px dashed #CFE6FA', background: '#F8FBFF', color: 'var(--abd-primary)', textAlign: 'center', padding: 20 }
const planCardsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }
const planCardStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 16, borderRadius: 18, border: '1px solid #D7EAFB', background: '#FBFDFF', color: 'var(--abd-primary)' }
const planTitleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 900, color: 'var(--abd-primary)' }
const planPriceStyle: React.CSSProperties = { fontSize: 28, fontWeight: 900, color: 'var(--abd-primary)' }
const priceInputStyle: React.CSSProperties = { width: 110, border: '1px solid #CFE6FA', borderRadius: 12, padding: '4px 8px', marginInline: 6, fontFamily: 'var(--font-main)', color: 'var(--abd-primary)', fontSize: 26, fontWeight: 900, direction: 'ltr', textAlign: 'center' }
const limitsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }
const limitStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 12, background: '#EFF6FF', color: 'var(--abd-primary)' }
const featureListStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
function featureItemStyle(enabled: boolean): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 999, padding: '6px 10px', background: enabled ? 'var(--status-active-bg)' : 'var(--status-danger-bg)', color: enabled ? 'var(--status-active-text)' : 'var(--status-danger-text)', fontWeight: 900, fontSize: 12 }
}
const flagsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }
function flagCardStyle(enabled: boolean): React.CSSProperties {
  return { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, border: '1px solid #D7EAFB', background: enabled ? '#F8FBFF' : '#FFFFFF', color: 'var(--abd-primary)', fontWeight: 900 }
}
const settingRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 12, background: '#F8FBFF', color: 'var(--abd-primary)', border: '1px solid #E6EEF7' }
const adminFieldStyle: React.CSSProperties = { display: 'grid', gap: 8, color: 'var(--abd-primary)', fontWeight: 900 }
