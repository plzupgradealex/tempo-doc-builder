/**
 * i18n type definitions.
 */

export type Locale = 'en' | 'es' | 'de' | 'fr';

export interface Translations {
  // App chrome
  appTitle: string;
  theme: string;
  mode: string;
  std: string;
  trek: string;
  help: string;
  ready: string;
  noAgenda: string;
  welcome: string;

  // Navigation
  newAgenda: string;
  agenda: string;
  library: string;
  domains: string;
  preview: string;
  previewExport: string;
  about: string;

  // Header form
  projectInformation: string;
  vendor: string;
  customerNumber: string;
  projectNumber: string;
  customerAddress: string;
  customerProjectContact: string;
  vendorProjectContact: string;
  project: string;

  // Pre-work
  preWorkRequirements: string;
  projectorQuestion: string;
  networkQuestion: string;
  projectorRequirement: string;
  networkRequirement: string;

  // Travel
  travelArrival: string;
  travelDeparture: string;
  date: string;
  time: string;
  travelMode: string;
  flight: string;
  train: string;
  vehicle: string;
  reference: string;
  location: string;
  travelTimeToSite: string;

  // Day panel
  day: string;
  addTopic: string;
  addPause: string;
  addPlantTour: string;
  addCustom: string;
  topic: string;
  pause: string;
  plantTour: string;
  custom: string;

  // Events
  orientation: string;
  orientationDescription: string;
  adjourn: string;
  recap: string;
  recapTitle: string;
  recapDescription: string;
  lunchBreak: string;
  customTopic: string;

  // Day management
  newDay: string;
  removeLastDay: string;
  save: string;
  agendaSaved: string;

  // Library
  savedAgendas: string;
  importJson: string;
  noSavedAgendas: string;
  load: string;
  exportJson: string;
  delete: string;
  deleteConfirm: string;
  updated: string;

  // Domains
  knowledgeDomains: string;
  addDomain: string;
  resetToDefaults: string;
  saveDomains: string;
  domainsSaved: string;
  resetConfirm: string;
  name: string;
  icon: string;
  description: string;
  subTopicBullets: string;
  recommendedAttendees: string;
  remove: string;

  // Preview
  exportPdf: string;
  exportDocx: string;
  noAgendaPreview: string;
  attendees: string;

  // About
  aboutTitle: string;
  aboutDescription: string;
  privacyTitle: string;
  privacyDescription: string;
  trekModeTitle: string;
  trekModeDescription: string;

  // Help modal
  helpGettingStarted: string;
  helpProjectHeader: string;
  helpPreWorkQuestions: string;
  helpTravelDetails: string;
  helpAddTopics: string;
  helpDragReorder: string;
  helpPreviewExport: string;
  helpKeyboardShortcuts: string;
  helpSaveAgenda: string;
  helpPreviewPdf: string;
  helpExportPdf: string;
  helpTrekMode: string;
  helpTrekDescription: string;

  // Language selector
  selectLanguage: string;

  // Auth
  login: string;
  logout: string;
  username: string;
  password: string;
  signIn: string;
  authRequired: string;

  // Status
  dayCount: string;
  eventCount: string;

  // Domain names (for default domains)
  domainProcurement: string;
  domainInventory: string;
  domainProduction: string;
  domainCutting: string;
  domainFinance: string;
  domainSales: string;
  domainLivestock: string;
  domainDebrief: string;
  domainQA: string;
  domainMaintenance: string;
  domainTravel: string;
  domainKickoff: string;
  domainPlantTour: string;

  // Domain descriptions
  domainProcurementDesc: string;
  domainInventoryDesc: string;
  domainProductionDesc: string;
  domainCuttingDesc: string;
  domainFinanceDesc: string;
  domainSalesDesc: string;
  domainLivestockDesc: string;
  domainDebriefDesc: string;
  domainQADesc: string;
  domainMaintenanceDesc: string;
  domainTravelDesc: string;
  domainKickoffDesc: string;
  domainPlantTourDesc: string;

  // Domain bullet points
  bulletProcurement1: string;
  bulletProcurement2: string;
  bulletProcurement3: string;
  bulletProcurement4: string;
  bulletInventory1: string;
  bulletInventory2: string;
  bulletInventory3: string;
  bulletInventory4: string;
  bulletProduction1: string;
  bulletProduction2: string;
  bulletProduction3: string;
  bulletProduction4: string;
  bulletCutting1: string;
  bulletCutting2: string;
  bulletCutting3: string;
  bulletCutting4: string;
  bulletFinance1: string;
  bulletFinance2: string;
  bulletFinance3: string;
  bulletFinance4: string;
  bulletSales1: string;
  bulletSales2: string;
  bulletSales3: string;
  bulletSales4: string;
  bulletLivestock1: string;
  bulletLivestock2: string;
  bulletLivestock3: string;
  bulletLivestock4: string;
  bulletDebrief1: string;
  bulletDebrief2: string;
  bulletDebrief3: string;
  bulletDebrief4: string;
  bulletQA1: string;
  bulletQA2: string;
  bulletQA3: string;
  bulletQA4: string;
  bulletMaintenance1: string;
  bulletMaintenance2: string;
  bulletMaintenance3: string;
  bulletMaintenance4: string;
  bulletPlantTour1: string;

  // Travel-topic fields
  travelFromLabel: string;
  travelToLabel: string;
  travelFlightLabel: string;
  travelDepartureTimeLabel: string;
  travelArrivalTimeLabel: string;
  bulletPlantTour2: string;
  bulletPlantTour3: string;
  bulletPlantTour4: string;
  bulletPlantTour5: string;

  // Domain recommended attendees
  attendeeProcurementManager: string;
  attendeePurchasingAgent: string;
  attendeeAPSpecialist: string;
  attendeeWarehouseManager: string;
  attendeeInventoryController: string;
  attendeeLogisticsCoordinator: string;
  attendeeProductionManager: string;
  attendeeProductionPlanner: string;
  attendeeShopFloorSupervisor: string;
  attendeeQualityManager: string;
  attendeeProcessEngineer: string;
  attendeeFinanceManager: string;
  attendeeController: string;
  attendeeAPARSpecialist: string;
  attendeeSalesManager: string;
  attendeeCustomerServiceRep: string;
  attendeeLivestockManager: string;
  attendeeGradingSpecialist: string;
  attendeeProducerRelationsManager: string;
  attendeeDebriefProjectLead: string;
  attendeeDebriefTeamLead: string;
  attendeePlantManager: string;
  attendeeProductionSupervisor: string;

  // Orientation bullets
  bulletOrientation1: string;
  bulletOrientation2: string;
  bulletOrientation3: string;
  bulletOrientation4: string;

  // Recap bullets
  bulletRecap1: string;
  bulletRecap2: string;
  bulletRecap3: string;
  bulletRecap4: string;

  // Event card edit form labels
  editTitle: string;
  editStartTime: string;
  editEndTime: string;
  editDescription: string;
  editSubTopics: string;
  editAddPoint: string;
  editAttendees: string;
  editAddAttendee: string;
  editCancel: string;
  editSave: string;
  editSubTopicPlaceholder: string;
  editNamePlaceholder: string;
  editRolePlaceholder: string;
  editDragReorder: string;
  editButton: string;
  editRemove: string;
  editDurMinus: string;
  editDurPlus: string;

  // Preview / PDF labels
  previewCustomerNumber: string;
  previewCustomerAddress: string;
  previewCustomerContact: string;
  previewVendorContact: string;
  previewProjectNumber: string;
  previewProject: string;
  previewPreWorkTitle: string;
  previewTravelArrival: string;
  previewTravelDeparture: string;
  previewEstToSite: string;
  previewEstFromSite: string;
  travelAtTime: string;
  previewDay: string;
  previewPageOf: string;
  previewAttendees: string;

  // Travel placeholders
  travelRefPlaceholder: string;
  travelRefVehiclePlaceholder: string;
  travelLocationPlaceholder: string;

  // Misc
  newTopic: string;
  untitledAgenda: string;
  errorTitle: string;
  errorLoadAgendas: string;
  preWorkOutput: string;
  aboutVersion: string;
  aboutLcarsReuse: string;
  aboutLcarsFile: string;
  overlapWarning: string;
  fixOverlaps: string;

  // Draft
  saveDraft: string;
  draftSaved: string;
  draftFound: string;
  draftRestore: string;
  draftDiscard: string;
  draftCleared: string;

  // Sync
  syncTitle: string;
  syncEnable: string;
  syncDisable: string;
  syncNow: string;
  syncPhrase: string;
  syncPhraseHint: string;
  syncEnterPhrase: string;
  syncCopied: string;
  syncPushed: string;
  syncPulled: string;
  syncError: string;
  syncSyncing: string;
  syncDone: string;
  syncMerged: string;
  syncDisconnected: string;

  // Collab
  shareAgenda: string;
  shareLink: string;
  shareCopied: string;
  sharePeers: string;
  shareLeave: string;
  shareJoining: string;
  shareConnected: string;

  // Topic picker sub-menus
  sundries: string;
  topics: string;

  // Day header
  dayStartTime: string;
  dayAdjournTime: string;

  // Compressed mode
  compressedMode: string;

  // Arrange times
  arrangeTimes: string;
  timesArranged: string;

  // Pause warning
  pauseWarning: string;

  // About — tools
  aboutToolsTitle: string;
  aboutToolsDescription: string;

  // Library sections
  documents: string;
  templates: string;
  saveAsTemplate: string;
  noTemplates: string;
}
