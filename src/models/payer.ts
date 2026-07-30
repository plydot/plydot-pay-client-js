export interface PayerResponse {
  id: string
  code: string
  displayName: string
  active: boolean
}

export interface CreatePayerRequest {
  code: string
  displayName: string
}

export interface UpdatePayerRequest {
  displayName?: string
  active?: boolean
}

export interface AssignProviderPayersRequest {
  payerIds: string[]
}

export interface ProviderPayerAssignmentResponse {
  providerId: string
  payerIds: string[]
}
