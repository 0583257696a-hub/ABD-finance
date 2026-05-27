export type CompoundInputs = {
  initialAmount: string
  monthlyDeposit: string
  annualReturn: string
  years: string
  managementFee: string
  inflation: string
  taxType: string
  indexedMode: boolean
}

export type CalcState = {
  activeTrack: string
  fallbackFactor: number
  factorValue: number
  manualCapital: string
  factorCapital: string
  spouseAge: string
  beneficiaryBasePension: string
  factorAssignments: Record<string, number>
  factorSelectedIds: string[]
  customTrackFactors: Record<string, number>
}
