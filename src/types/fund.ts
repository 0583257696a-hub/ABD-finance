export type Beneficiary = {
  id: string
  name?: string
  relationship?: string
  share?: number
  type?: string
}

export type Employer = {
  idNumber?: string
  name?: string
  isCurrent?: boolean
}

export type DepositRow = {
  employerName?: string
  employerId?: string
  month?: string
  contributionCodes?: string[]
  depositorCodes?: string[]
  employeeContribution?: number
  employerContribution?: number
  compensation?: number
  total?: number
}

export type PeriodRow = {
  id?: string
  productType?: string
  manufacturer?: string
  periodCode?: string
  periodLabel?: string
  componentCode?: string
  componentLabel?: string
  balanceTypeCode?: string
  balanceTypeLabel?: string
  amount?: number
  benefitCap?: string
}

export type FundInsuranceCoverage = {
  dataValueDate?: string
  insuredInPensionFund?: string
  insuranceTrack?: string
  salaryForDisabilityAndSurvivors?: number
  salaryValidityDate?: string
  disabilityCoverageCost?: number
  survivorsCoverageCost?: number
  disabledSurvivorsPensionCoverageCost?: number
  disabilityCoverageRate?: number
  widowerCoverageRate?: number
  orphanCoverageRate?: number
  supportedParentCoverageRate?: number
  fullDisabilityPension?: number
  widowerSurvivorsPension?: number
  orphanSurvivorsPension?: number
  supportedParentSurvivorsPension?: number
  disabilityCoverageWaiverOver60?: string
}

export type Fund = {
  id: string
  accountNumber?: string
  manufacturer?: string
  productType?: string
  productName?: string
  planName?: string
  startDate?: string
  joinDate?: string
  liquidityDate?: string
  investmentTrack?: string
  retirementTrackName?: string
  guaranteedYieldFlag?: string
  genderScore?: string
  memberNumber?: string
  employer?: string
  standing?: string
  status?: string
  currentBalance?: number
  retirementCapital?: number
  guaranteedCoefficient?: number
  importedPension?: number
  retirementAge?: number
  pensionBalance?: number
  compensationBalance?: number
  monthlyDeposit?: number
  depositFee?: string | number
  balanceFee?: string | number
  managementFeeDepositText?: string
  managementFeeBalanceText?: string
  managementFeeText?: string
  recommendation?: string
  recommendationTemplateId?: string
  migrationPlan?: {
    sourcePartIds?: string[]
    sourceParts?: Array<{ key: string; label: string; amount: number }>
    sourceSelectionLabel?: string
    sourceAmount?: number
    targetProduct?: string
    targetCompany?: string
    managementFeeBalance?: string
    managementFeeDeposit?: string
    investmentTrackId?: string
    investmentTrack?: string
    targetTrack?: string
    targetTrackNumber?: string
    targetTrackReturns?: unknown
    reason?: string
    professionalNotes?: string
  }
  notes?: string
  trend?: string
  beneficiaries?: Beneficiary[]
  employers?: Employer[]
  depositRows?: DepositRow[]
  periodRows?: PeriodRow[]
  insuranceCoverage?: FundInsuranceCoverage
  smartScore?: number
}
