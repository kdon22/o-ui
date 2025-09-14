export interface UTR {
  metadata: NormalizationMetadata
  utrHeader: UTRHeader
  associatedRecords: AssociatedRecord[]
  office: Office
  agent: Agent
  passengers: Passenger[]
  segments: TravelSegment[]
  serviceRequests: ServiceRequest[]
  remarks: Remark[]
  accountingData: AccountingEntry[]
  formsOfPayment: PaymentMethod[]
  invoices: Invoice[]
  communications: Communication[]
  processingHistory: ProcessingEvent[]
  contacts: ContactDirectoryEntry[]
  contactDirectory?: ContactInfo[]
  corporateData?: CorporateInfo
  technicalData?: TechnicalData
  pricingCart?: PricingItem[]
  combinationStrategy?: CombinationStrategy
}

// ============================================================================
// HEADER & METADATA
// ============================================================================

export interface NormalizationMetadata {
  normalizationVersion: string
  generatedAt: string
  sourceCount: number
  dataQuality: {
    completenessScore: number
    sourceContributions: Record<string, number>
    missingElements: string[]
    dataAgeHours: number
  }
}

export interface UTRHeader {
  recordLocator: string
  companyId: string
  creationDate: string
  creationTime: string
  lastModified: string
  pnrSequence?: number
  source: SourceAttribution
}

export interface AssociatedRecord {
  recordLocator: string
  vendor: string
  type: string
  isPrimary: boolean
  contribution?: string
}

// ============================================================================
// OFFICE & AGENT
// ============================================================================

export interface Office {
  responsibilityOffice: string
  creationOffice: string
  queueingOffice: string
  posCity: string
  posCountry: string
  pseudoCityCode?: string
  primeHostId?: string
  iataCode?: string
  source: SourceAttribution
}

export interface Agent {
  currentAgent: string
  creatorAgent: string
  creatorIataCode?: string
  agentType?: string
  creationDateTime: string
  lastUpdateAgent?: string
  lastUpdateDateTime?: string
  source: SourceAttribution
}

// ============================================================================
// PASSENGER & CONTACTS
// ============================================================================

export interface Passenger {
  passengerNumber: number
  passengerType: string // ADT, CHD, INF
  name: {
    first: string
    last: string
    displayName: string
  }
  contactInfo: ContactInfo[]
  documents: Document[]
  seats?: Seat[]
  corporateInfo?: CorporateInfo
}

export interface ContactDirectoryEntry {
  type: 'phone' | 'email'
  category?: string
  cityCode?: string
  number?: string
  address?: string
  comment?: string
  company?: string
  passengerNumberList: number[]
  elementId?: string
  source: SourceAttribution
}

// ============================================================================
// SEGMENTS (Expanded from Mock Data)
// ============================================================================

export interface TravelSegment {
  segmentNumber: number
  type: 'air' | 'hotel' | 'car' | 'rail' | 'bus' | 'tour' | 'cruise' | 'misc'

  // Air segment fields (from Amadeus + Sabre)
  carrier?: string
  flightNumber?: string
  classOfService?: string
  status: string
  departureDate?: string
  departureTime?: string
  arrivalDate?: string
  arrivalTime?: string
  departureAirport?: string
  arrivalAirport?: string
  dayChangeIndicator?: number

  // Enhanced operational info
  operationalInfo?: {
    equipment?: string
    stops?: number
    duration?: number
    mileage?: number
    operatingCarrier?: string
    operatingCarrierName?: string
    operatingFlightNumber?: string
    marketingCarrier?: string
    marketingFlightNumber?: string
    carbonEmissions?: {
      amount: number
      unit: string
      source: string
    }
    flightLegMileage?: number
    unitQualifier?: string
  }

  terminals?: {
    departure?: string
    departureName?: string
    arrival?: string
    arrivalName?: string
  }

  cabin?: {
    code: string
    name: string
    shortName: string
  }

  // Hotel segment fields (from Sabre)
  chainCode?: string
  hotelCode?: string
  hotelName?: string
  checkInDate?: string
  checkOutDate?: string
  nights?: number
  cityCode?: string
  confirmation?: string

  roomInfo?: {
    type: string
    description: string
    quantity: number
    occupancy: number
    guestName: string
  }

  // Car segment fields (from Sabre)
  vendor?: string
  pickupDate?: string
  pickupTime?: string
  returnDate?: string
  returnTime?: string
  pickupLocation?: string
  returnLocation?: string
  vehicleInfo?: {
    type: string
    category: string
    quantity: number
  }

  // Common fields
  nativeRecordLocator?: string
  isEticket?: boolean
  connectedFlight?: {
    carrier: string
    flightNumber: string
  }

  rateInfo?: {
    dailyRate?: {
      amount: number
      currency: string
    }
    totalEstimate?: {
      amount: number
      currency: string
    }
    totalTax?: {
      amount: number
      currency: string
    }
    rateCode?: string
    corporateId?: string
    rateChanges?: Array<{
      effectiveDates: string
      rate: {
        amount: number
        currency: string
      }
    }>
    approximateTotalChargeAmount?: string
    vehicleCharges?: {
      vehicleChargeAmount: string
      approximateTotalChargeAmount: string
    }
  }

  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }

  contactInfo?: {
    phone?: string
    fax?: string
  }

  guarantee?: {
    type: string
    maskedNumber?: string
    expiry?: string
    cardHolder?: string
    paymentCardNumber?: string
  }

  additionalInformation?: {
    confirmationNumber?: string
    directConnect?: boolean
    address?: {
      addressLine: string[]
      countryCode: string
      city: string
      state: string
      zipCode: string
    }
    contactNumbers?: Array<{
      phoneNumber: string
      faxNumber?: string
    }>
    corporateIDNumber?: string
  }

  reservation?: {
    dayOfWeekInd?: string
    numberInParty?: string
    lineNumber?: string
    lineType?: string
    lineStatus?: string
    posRequestorID?: string
    clientID?: string
    passengerName?: string
    timeSpanStart?: string
    timeSpanDuration?: number
    timeSpanEnd?: string
  }

  vehSegmentInfo?: {
    corporateID?: string
    clientID?: string
    passengerName?: string
  }

  airVendorCode?: string

  source: SourceAttribution
}

// ============================================================================
// SERVICE REQUESTS (Enhanced with Passenger Association)
// ============================================================================

export interface ServiceRequest {
  elementId?: string
  lineNumber?: number
  type: string // NSST, CTCM, CTCE, DOCS, TKNE, etc.
  status: string
  carrier?: string
  segmentNumbers?: number[]
  passengerNumbers: number[] // Associated passengers
  details: {
    seatNumber?: string
    seatType?: string
    boardPoint?: string
    offPoint?: string
    contactMethod?: string
    value?: string
    documentType?: string
    longText?: string
    ticketNumber?: string
    segmentInfo?: string
  }
  source: SourceAttribution
}

// ============================================================================
// INVOICES (Completely Restructured)
// ============================================================================

export interface Invoice {
  number: number
  invoiceDate: string
  issueTime: string
  name: string
  segments: number[]
  currencySymbol: string
  totals: {
    airfare: number
    fees: number
    misc: number
    tax: number
  }
  totalCharged: {
    currencyCode: string
    amount: number
  }

  items: InvoiceItem[]
  source: SourceAttribution
}

export interface InvoiceItem {
  docNumber: string
  vendor: string
  status: 'active' | 'refund' | 'void'
  payment: string
  baseFare: number
  taxes: number
  othTax: number
  taxList: TaxDetail[]
  totals: number
  passenger: Passenger

  // Item-specific details moved from Invoice level
  documentNumber?: string
  validatingCarrier?: string
  issueOffice?: string
  passengerNumbers?: number[]
  itemStatus?: string
  tstReference?: string
  fareDetail?: {
    amount: number
    currency: string
  }
  totalFare?: {
    amount: number
    currency: string
  }
  fareCalculation?: string
  fareComponents?: FareComponent[]
  itemTaxes?: Tax[]
  ticketing?: {
    status: string
    isElectronic: boolean
    officeId?: string
    issueDate?: string
  }

  exchange?: ExchangeDetail[]
}

export interface TaxDetail {
  taxCode: string
  taxAmount: number
}

export interface ExchangeDetail {
  origTicket: string
  origAmount: number
  newAmount: number
  fareDifference: number
  origIssueDate: string
  origLocator: string
}

// ============================================================================
// REMAINING INTERFACES (Keep Similar Structure)
// ============================================================================

export interface Remark {
  lineNumber?: number
  type: string
  category?: string
  content: string
  isStructured?: boolean
  source: SourceAttribution
}

export interface AccountingEntry {
  lineNumber?: number
  accountNumber: string
  passengerNumbers: number[]
  source: SourceAttribution
}

export interface PaymentMethod {
  type: string
  cardType?: string
  maskedNumber?: string
  expiry?: string
  approvalCode?: string
  shortText?: string
  isPrimary?: boolean
  source: SourceAttribution
}

export interface Communication {
  type: string
  subject?: string
  to?: string
  cc?: string
  timestamp: string
  status: string
  source: SourceAttribution
}

export interface ProcessingEvent {
  timestamp: string
  action: string
  details: string
  agent?: string
  agentSine?: string
  dutyCode?: string
  officeId?: string
  iataCode?: string
  passengerNumbers?: number[]
  segmentNumbers?: number[]
  source: SourceAttribution
}

export interface ContactInfo {
  type: string
  value: string
  countryCode?: string
  isPrimary?: boolean
  category?: string
  company?: string
  source: SourceAttribution
}

export interface Document {
  type: string
  longText: string
  birthDate?: string
  gender?: string
  nationality?: string
  documentNumber?: string
  expiryDate?: string
  associatedSegments: string
  source: SourceAttribution
}

export interface Seat {
  segmentNumber: number
  seatNumber: string
  characteristics: string[]
  status: string
  source: SourceAttribution
}

export interface CorporateInfo {
  company: string
  employeeId?: string
  department?: string
  businessUnit?: string
  officeLocation?: string
  approverEmail?: string
  corporateId?: string
  corporateName?: string
  primeHost?: string
  prefix?: string
  address?: {
    company: string
    street: string
    city: string
    postalCode: string
  }
  source: SourceAttribution
}

export interface FareComponent {
  componentId: number
  from: string
  to: string
  amount: number
  currency: string
  fareBasis?: string
  ticketDesignator?: string
  fareFamily?: string
}

export interface Tax {
  code: string
  country: string
  nature: string
  amount: number
  currency: string
}

export interface SourceAttribution {
  system: string
  type: string
  associatedRecord: string
  lineNumber?: number
  elementId?: string
  elementType?: string
  ssrType?: string
  tstReference?: string
  ticketElement?: boolean
  note?: string
  extractedFromRemarks?: boolean
  msgType?: string
  crossRef?: string
  actionCode?: string
  numberInParty?: number
  airlineCode?: string
  vendorCode?: string
  fullText?: string
}

export interface CombinationStrategy {
  primarySource: string
  fallbackHierarchy: string[]
  conflictResolution: {
    passengerName: string
    pricing: string
    segments: string
    contactInfo: string
  }
  dataEnrichment: Record<string, string>
}

// ============================================================================
// TECHNICAL DATA & PRICING
// ============================================================================

export interface TechnicalData {
  estimatedPurgeDate?: string
  updateToken?: string
  flightRange?: {
    start: string
    end: string
  }
  source: SourceAttribution
}

export interface PricingItem {
  tstReference?: string
  documentNumber: string
  validatingCarrier: string
  issueDate: string
  issueTime?: string
  issueOffice?: string
  passengerNumbers: number[]
  segmentNumbers: number[]
  status: string
  baseFare?: {
    amount: number
    currency: string
  }
  totalFare?: {
    amount: number
    currency: string
  }
  fareCalculation?: string
  fareComponents?: FareComponent[]
  taxes?: Tax[]
  ticketing?: {
    status: string
    isElectronic: boolean
    officeId?: string
    issueDate?: string
  }
  source: SourceAttribution
}
