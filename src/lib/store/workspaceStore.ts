'use client'

import { create } from 'zustand'
import type { Client } from '@/types/client'
import type { Fund } from '@/types/fund'
import type { InsurancePolicy } from '@/types/insurance'
import type { TrackingDeal, TrackingRisk } from '@/types/recommendations'
import type { AbdRow, ReturnsData } from '@/types/returns'
import type { CalcState, CompoundInputs } from '@/types/simulation'
import type { MeetingSummaryData, NeedsAssessmentData } from '@/types/summary'
import type { TableLayout } from '@/types/table'

export const WORKSPACE_SNAPSHOT_KEY = 'abd-workspace-v2'
export const LEGACY_FUNDS_KEY = 'abd_next_funds'
export const LEGACY_INSURANCE_KEY = 'abd_next_insurance'
export const LEGACY_CLIENT_KEY = 'abd_next_client'
export const LEGACY_NEEDS_KEY = 'abd_next_needs'
export const LEGACY_RECOMMENDATIONS_KEY = 'abd_next_recommendations'
export const LEGACY_INFRASTRUCTURE_IDS_KEY = 'abd_next_infrastructure_ids'

type SmartAnalysisState = {
  status: 'idle' | 'loading' | 'done' | 'error'
  statusNote: string
  returnsSourceStatus: string
  returnsByFundId: Record<string, ReturnsData>
  lastSnapshotKey: string
  matchWarnings: string[]
}

type WorkspaceUiState = {
  activeTab: string
  activeFundId: string | null
  fundModalOpen: boolean
  fundActivityModalOpen: boolean
  fundActivityView: 'deposits' | 'employers' | 'beneficiaries'
  tableLayouts: Record<string, TableLayout>
  activeSimTab: string
  settingsOpen: boolean
  adminOpen: boolean
}

type WorkspaceFilters = {
  search: string
  manufacturer: string
  productType: string
  status: string
  sort: string
}

type WorkspaceSimulations = {
  compound: CompoundInputs
  abdReturns: {
    uploadedRows: AbdRow[]
    uploadStatus: string[]
  }
}

type WorkspaceSnapshot = Omit<WorkspaceStore, 'hydrate' | 'saveSnapshot' | 'resetWorkspace' | 'applyImportedDataset' | 'setFunds' | 'setInsurancePolicies' | 'setTrackingDeals' | 'setTrackingRisks' | 'setSelectedInsurancePolicyIds' | 'setInfrastructureIds' | 'setActiveTab' | 'setActiveFund' | 'toggleSelectedId' | 'toggleInfrastructureId' | 'updateFund' | 'setNeedsAssessment' | 'setMeetingSummary'>

export type WorkspaceStore = {
  workbookName: string
  client: Client | null
  funds: Fund[]
  insurancePolicies: InsurancePolicy[]
  selectedIds: string[]
  infrastructureSelectedIds: string[]
  selectedInsurancePolicyIds: string[]
  filters: WorkspaceFilters
  calc: CalcState
  ui: WorkspaceUiState
  simulations: WorkspaceSimulations
  smartAnalysis: SmartAnalysisState
  needsAssessment: NeedsAssessmentData
  meetingSummary: MeetingSummaryData
  trackingDeals: TrackingDeal[]
  trackingRisks: TrackingRisk[]
  hydrated: boolean
  hydrate: () => void
  saveSnapshot: () => void
  resetWorkspace: () => void
  applyImportedDataset: (dataset: { workbookName?: string; client?: Client; funds?: Fund[]; insurancePolicies?: InsurancePolicy[] }) => void
  setFunds: (funds: Fund[]) => void
  setInsurancePolicies: (insurancePolicies: InsurancePolicy[]) => void
  setTrackingDeals: (trackingDeals: TrackingDeal[]) => void
  setTrackingRisks: (trackingRisks: TrackingRisk[]) => void
  setSelectedInsurancePolicyIds: (selectedInsurancePolicyIds: string[]) => void
  setInfrastructureIds: (infrastructureSelectedIds: string[]) => void
  setActiveTab: (activeTab: string) => void
  setActiveFund: (fundId: string | null) => void
  toggleSelectedId: (fundId: string, checked?: boolean) => void
  toggleInfrastructureId: (fundId: string) => void
  updateFund: (fund: Fund) => void
  setNeedsAssessment: (needsAssessment: NeedsAssessmentData) => void
  setMeetingSummary: (meetingSummary: MeetingSummaryData) => void
}

const defaultCalc: CalcState = {
  activeTrack: 'none',
  fallbackFactor: 140,
  factorValue: 140,
  manualCapital: '',
  factorCapital: '',
  spouseAge: '',
  beneficiaryBasePension: '',
  factorAssignments: {},
  factorSelectedIds: [],
  customTrackFactors: {},
}

const defaultCompound: CompoundInputs = {
  initialAmount: '',
  monthlyDeposit: '',
  annualReturn: '4',
  years: '10',
  managementFee: '',
  inflation: '',
  taxType: 'none',
  indexedMode: false,
}

const initialState = {
  workbookName: '',
  client: null,
  funds: [],
  insurancePolicies: [],
  selectedIds: [],
  infrastructureSelectedIds: [],
  selectedInsurancePolicyIds: [],
  filters: { search: '', manufacturer: 'all', productType: 'all', status: 'all', sort: 'manufacturer-asc' },
  calc: defaultCalc,
  ui: {
    activeTab: 'funds',
    activeFundId: null,
    fundModalOpen: false,
    fundActivityModalOpen: false,
    fundActivityView: 'deposits',
    tableLayouts: {},
    activeSimTab: 'compound',
    settingsOpen: false,
    adminOpen: false,
  } as WorkspaceUiState,
  simulations: {
    compound: defaultCompound,
    abdReturns: { uploadedRows: [], uploadStatus: [] },
  },
  smartAnalysis: {
    status: 'idle',
    statusNote: '',
    returnsSourceStatus: '',
    returnsByFundId: {},
    lastSnapshotKey: '',
    matchWarnings: [],
  } as SmartAnalysisState,
  needsAssessment: {},
  meetingSummary: {},
  trackingDeals: [],
  trackingRisks: [],
  hydrated: false,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const map = new Map<string, T>()
  current.forEach(item => map.set(item.id, item))
  incoming.forEach(item => map.set(item.id, { ...(map.get(item.id) || {}), ...item }))
  return Array.from(map.values())
}

function legacySnapshot(): Partial<WorkspaceSnapshot> {
  return {
    client: readJson<Client | null>(LEGACY_CLIENT_KEY, null),
    funds: readJson<Fund[]>(LEGACY_FUNDS_KEY, []),
    insurancePolicies: readJson<InsurancePolicy[]>(LEGACY_INSURANCE_KEY, []),
    infrastructureSelectedIds: readJson<string[]>(LEGACY_INFRASTRUCTURE_IDS_KEY, []),
    needsAssessment: readJson<NeedsAssessmentData>(LEGACY_NEEDS_KEY, {}),
    trackingDeals: readJson<TrackingDeal[]>(LEGACY_RECOMMENDATIONS_KEY, []),
  }
}

function serializableSnapshot(state: WorkspaceStore): WorkspaceSnapshot {
  const { screenshots: _screenshots, ...meetingSummaryWithoutImages } = state.meetingSummary || {}
  return {
    workbookName: state.workbookName,
    client: state.client,
    funds: state.funds,
    insurancePolicies: state.insurancePolicies,
    selectedIds: state.selectedIds,
    infrastructureSelectedIds: state.infrastructureSelectedIds,
    selectedInsurancePolicyIds: state.selectedInsurancePolicyIds,
    filters: state.filters,
    calc: state.calc,
    ui: state.ui,
    simulations: {
      ...state.simulations,
      abdReturns: { uploadedRows: [], uploadStatus: state.simulations.abdReturns.uploadStatus },
    },
    smartAnalysis: state.smartAnalysis,
    needsAssessment: state.needsAssessment,
    meetingSummary: meetingSummaryWithoutImages,
    trackingDeals: state.trackingDeals,
    trackingRisks: state.trackingRisks,
    hydrated: state.hydrated,
  }
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  ...initialState,
  hydrate: () => {
    const snapshot = readJson<Partial<WorkspaceSnapshot>>(WORKSPACE_SNAPSHOT_KEY, {})
    const fallback = legacySnapshot()
    set({
      ...initialState,
      ...fallback,
      ...snapshot,
      hydrated: true,
      ui: { ...initialState.ui, ...(fallback.ui || {}), ...(snapshot.ui || {}) },
      calc: { ...initialState.calc, ...(fallback.calc || {}), ...(snapshot.calc || {}) },
      filters: { ...initialState.filters, ...(fallback.filters || {}), ...(snapshot.filters || {}) },
      simulations: { ...initialState.simulations, ...(fallback.simulations || {}), ...(snapshot.simulations || {}) },
      smartAnalysis: { ...initialState.smartAnalysis, ...(fallback.smartAnalysis || {}), ...(snapshot.smartAnalysis || {}) },
    })
  },
  saveSnapshot: () => {
    const state = get()
    const snapshot = serializableSnapshot(state)
    writeJson(WORKSPACE_SNAPSHOT_KEY, snapshot)
    writeJson(LEGACY_FUNDS_KEY, state.funds)
    writeJson(LEGACY_INSURANCE_KEY, state.insurancePolicies)
    writeJson(LEGACY_CLIENT_KEY, state.client)
    writeJson(LEGACY_NEEDS_KEY, state.needsAssessment)
    writeJson(LEGACY_RECOMMENDATIONS_KEY, state.trackingDeals)
    writeJson(LEGACY_INFRASTRUCTURE_IDS_KEY, state.infrastructureSelectedIds)
  },
  resetWorkspace: () => {
    if (typeof window !== 'undefined') {
      [
        WORKSPACE_SNAPSHOT_KEY,
        LEGACY_FUNDS_KEY,
        LEGACY_INSURANCE_KEY,
        LEGACY_CLIENT_KEY,
        LEGACY_NEEDS_KEY,
        LEGACY_RECOMMENDATIONS_KEY,
        LEGACY_INFRASTRUCTURE_IDS_KEY,
      ].forEach(key => localStorage.removeItem(key))
    }
    set({ ...initialState, hydrated: true })
  },
  applyImportedDataset: dataset => {
    set(state => ({
      workbookName: dataset.workbookName || state.workbookName,
      client: dataset.client || state.client,
      funds: mergeById(state.funds, dataset.funds || []),
      insurancePolicies: mergeById(state.insurancePolicies, dataset.insurancePolicies || []),
    }))
    get().saveSnapshot()
  },
  setFunds: funds => {
    set({ funds })
    get().saveSnapshot()
  },
  setInsurancePolicies: insurancePolicies => {
    set({ insurancePolicies })
    get().saveSnapshot()
  },
  setTrackingDeals: trackingDeals => {
    set({ trackingDeals })
    get().saveSnapshot()
  },
  setTrackingRisks: trackingRisks => {
    set({ trackingRisks })
    get().saveSnapshot()
  },
  setSelectedInsurancePolicyIds: selectedInsurancePolicyIds => {
    set({ selectedInsurancePolicyIds })
    get().saveSnapshot()
  },
  setInfrastructureIds: infrastructureSelectedIds => {
    set({ infrastructureSelectedIds })
    get().saveSnapshot()
  },
  setActiveTab: activeTab => {
    set(state => ({ ui: { ...state.ui, activeTab } }))
    get().saveSnapshot()
  },
  setActiveFund: fundId => {
    set(state => ({ ui: { ...state.ui, activeFundId: fundId, fundModalOpen: Boolean(fundId) } }))
    get().saveSnapshot()
  },
  toggleSelectedId: (fundId, checked) => {
    set(state => {
      const exists = state.selectedIds.includes(fundId)
      const shouldSelect = checked ?? !exists
      return { selectedIds: shouldSelect ? Array.from(new Set([...state.selectedIds, fundId])) : state.selectedIds.filter(id => id !== fundId) }
    })
    get().saveSnapshot()
  },
  toggleInfrastructureId: fundId => {
    set(state => ({
      infrastructureSelectedIds: state.infrastructureSelectedIds.includes(fundId)
        ? state.infrastructureSelectedIds.filter(id => id !== fundId)
        : Array.from(new Set([...state.infrastructureSelectedIds, fundId])),
    }))
    get().saveSnapshot()
  },
  updateFund: fund => {
    set(state => ({ funds: state.funds.map(item => item.id === fund.id ? fund : item) }))
    get().saveSnapshot()
  },
  setNeedsAssessment: needsAssessment => {
    set({ needsAssessment })
    get().saveSnapshot()
  },
  setMeetingSummary: meetingSummary => {
    set({ meetingSummary })
    get().saveSnapshot()
  },
}))
