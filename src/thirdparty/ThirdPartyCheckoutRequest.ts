import type { CreateCheckoutRequest } from '../models/checkout.js'

export interface Customer {
  name: string
  phone?: string
  email?: string
}

export function validateCustomer(customer: Customer): void {
  if (!customer.name?.trim()) {
    throw new Error('customer name is required')
  }
  if (!customer.phone?.trim() && !customer.email?.trim()) {
    throw new Error('customer phone and/or email is required')
  }
}

export interface ThirdPartyCheckoutRequestInput {
  productId: string
  amountMinor: number
  currency: string
  customer: Customer
  providerId: string
  payerId: string
  description?: string
}

export class ThirdPartyCheckoutRequest {
  readonly productId: string
  readonly amountMinor: number
  readonly currency: string
  readonly customer: Customer
  readonly providerId: string
  readonly payerId: string
  readonly description?: string

  private constructor(input: ThirdPartyCheckoutRequestInput) {
    validateCustomer(input.customer)
    this.productId = input.productId
    this.amountMinor = input.amountMinor
    this.currency = input.currency
    this.customer = input.customer
    this.providerId = input.providerId
    this.payerId = input.payerId
    this.description = input.description
  }

  toCreateCheckoutRequest(): CreateCheckoutRequest {
    const metadata: Record<string, unknown> = {
      customerName: this.customer.name,
    }
    if (this.customer.phone?.trim()) {
      metadata.customerPhone = this.customer.phone.trim()
    }
    if (this.customer.email?.trim()) {
      metadata.customerEmail = this.customer.email.trim()
    }

    return {
      productId: this.productId,
      amountMinor: this.amountMinor,
      currency: this.currency,
      providerId: this.providerId,
      payerId: this.payerId,
      description: this.description,
      metadata,
    }
  }

  static builder(): ThirdPartyCheckoutRequestBuilder {
    return new ThirdPartyCheckoutRequestBuilder()
  }

  /** @internal */
  static create(input: ThirdPartyCheckoutRequestInput): ThirdPartyCheckoutRequest {
    return new ThirdPartyCheckoutRequest(input)
  }
}

export class ThirdPartyCheckoutRequestBuilder {
  private _productId?: string
  private _amountMinor?: number
  private _currency?: string
  private _customer?: Customer
  private _providerId?: string
  private _payerId?: string
  private _description?: string

  productId(value: string): this {
    this._productId = value
    return this
  }

  amountMinor(value: number): this {
    this._amountMinor = value
    return this
  }

  currency(value: string): this {
    this._currency = value
    return this
  }

  customer(value: Customer): this {
    this._customer = value
    return this
  }

  providerId(value: string): this {
    this._providerId = value
    return this
  }

  payerId(value: string): this {
    this._payerId = value
    return this
  }

  description(value: string | undefined): this {
    this._description = value
    return this
  }

  build(): ThirdPartyCheckoutRequest {
    if (!this._productId?.trim()) {
      throw new Error('productId is required')
    }
    if (this._amountMinor == null) {
      throw new Error('amountMinor is required')
    }
    if (!this._currency?.trim()) {
      throw new Error('currency is required')
    }
    if (!this._customer) {
      throw new Error('customer is required')
    }
    if (!this._providerId) {
      throw new Error('providerId is required')
    }
    if (!this._payerId) {
      throw new Error('payerId is required')
    }

    return ThirdPartyCheckoutRequest.create({
      productId: this._productId,
      amountMinor: this._amountMinor,
      currency: this._currency,
      customer: this._customer,
      providerId: this._providerId,
      payerId: this._payerId,
      description: this._description,
    })
  }
}
