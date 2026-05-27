export type TrackingDeal = {
  id: string
  fromFundId?: string
  sourceFundIds?: string[]
  actionType?: string
  productType?: string
  manufacturer?: string
  track?: string
  trackId?: string
  standing?: string
  salary?: string
  employeeRate?: string
  employerRate?: string
  compensationRate?: string
  employerName?: string
  employerId?: string
  reason?: string
  notes?: string
  amount?: number
}

export type TrackingRisk = {
  id: string
  policyId?: string
  policyNumber?: string
  manufacturer?: string
  productType?: string
  actionType?: string
  title?: string
  severity?: string
  notes?: string
  status?: string
  premium?: number
  coverageAmount?: number
}
