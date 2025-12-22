export interface DistributionParam {
  type: 'float' | 'int' | 'array' | 'any'
  default: any
  required: boolean
  constraint?: string
}

export interface Distribution {
  params: Record<string, DistributionParam>
  support: 'continuous' | 'discrete' | 'deterministic'
  description: string
}

export type DistributionMap = Record<string, Distribution>
