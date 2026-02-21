/**
 * Core data types for Tempo
 */

// ─── Vendor / Company Configuration ───

export interface VendorConfig {
  name: string;
  logo?: string;
}

// ─── Agenda Header ───

export interface AgendaHeader {
  vendorName: string;
  customerNumber: string;
  customerAddress: string;
  customerProjectContact: string;
  vendorProjectContact: string;
  projectNumber: string;
  projectName: string;
}

// ─── Travel ───

export type TravelMode = 'flight' | 'train' | 'vehicle';

export interface TravelLeg {
  date: string;            // ISO date string
  time: string;            // HH:mm
  mode: TravelMode;
  reference: string;       // flight/train number or vehicle description
  location: string;        // airport / station / hotel
  travelTimeToSite: number; // minutes from arrival point to customer site
}

export interface TravelInfo {
  arrival: TravelLeg;
  departure: TravelLeg;
}

// ─── Pre-Work Requirements ───

export interface PreWorkNeeds {
  needsProjector: boolean;
  needsNetworkAccess: boolean;
}

// ─── Attendees ───

export interface Attendee {
  name: string;
  role: string;
}

// ─── Agenda Events ───

export type EventType =
  | 'orientation'
  | 'topic'
  | 'pause'
  | 'plant-tour'
  | 'adjourn'
  | 'recap'
  | 'custom';

export interface AgendaEvent {
  id: string;
  type: EventType;
  topicDomainId?: string;     // link to KnowledgeDomain.id
  title: string;
  description: string;
  bulletPoints: string[];
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
  duration: number;           // minutes
  attendees: Attendee[];
  // Travel-topic fields (optional, only used when topicDomainId === 'travel')
  travelFrom?: string;
  travelTo?: string;
  travelFlight?: string;
  travelDepartureTime?: string; // HH:mm
  travelArrivalTime?: string;   // HH:mm
}

// ─── Days ───

export interface AgendaDay {
  id: string;
  date: string;              // ISO date string
  dayStartTime: string;      // HH:mm, default "09:00"
  adjournTime: string;       // HH:mm, default "17:00"
  events: AgendaEvent[];
}

// ─── Knowledge Domains ───

export interface KnowledgeDomain {
  id: string;
  name: string;
  icon: string;              // FontAwesome class e.g. "fa-cart-shopping"
  description: string;
  defaultBulletPoints: string[];
  recommendedAttendees: string[];
  isDefault: boolean;
  defaultDuration?: number;  // minutes, default 120 for topics, 30 for sundries
  category?: 'topic' | 'sundry';  // used for topic picker sub-menus
}

// ─── Agenda (Full Document) ───

export interface Agenda {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
  header: AgendaHeader;
  travel: TravelInfo;
  preWork: PreWorkNeeds;
  days: AgendaDay[];
}

// ─── Application State ───

export type ViewName =
  | 'agenda'
  | 'library'
  | 'domains'
  | 'preview'
  | 'about';

export interface AppState {
  currentView: ViewName;
  currentAgenda: Agenda | null;
  trekMode: boolean;
  theme: 'tng' | 'movie';
  domains: KnowledgeDomain[];
}

// ─── Drag & Drop ───

export interface DragPayload {
  type: 'domain' | 'event';
  domainId?: string;
  eventId?: string;
  sourceDayId?: string;
}
