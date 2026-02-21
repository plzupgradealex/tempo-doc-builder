import type { Translations } from './types';

export const en: Translations = {
  // App chrome
  appTitle: 'TEMPO AGENDA BUILDER',
  theme: 'THEME',
  mode: 'MODE',
  std: 'STD',
  trek: 'TREK',
  help: 'HELP',
  ready: 'Ready',
  noAgenda: 'No agenda',
  welcome: 'Welcome',

  // Navigation
  newAgenda: 'New Agenda',
  agenda: 'Agenda',
  library: 'Library',
  domains: 'Topic Directory',
  preview: 'Preview',
  previewExport: 'Preview / Export',
  about: 'About',

  // Header form
  projectInformation: 'Agenda Header Data',
  vendor: 'Vendor',
  customerNumber: 'Customer #',
  projectNumber: 'Project #',
  customerAddress: 'Customer Address',
  customerProjectContact: 'Customer Project Contact',
  vendorProjectContact: 'Vendor Project Contact',
  project: 'Project',

  // Pre-work
  preWorkRequirements: 'Pre-Work Requirements',
  projectorQuestion: 'Will you need a projector and/or TV?',
  networkQuestion: 'Will you need network access at this site to accomplish your goals?',
  projectorRequirement: 'Please make available a TV or Projector for slidedecks',
  networkRequirement: 'Please ensure network access is provisioned and available for attendee use',

  // Travel
  travelArrival: 'Travel — Arrival',
  travelDeparture: 'Travel — Departure',
  date: 'Date',
  time: 'Time',
  travelMode: 'Mode',
  flight: 'Flight',
  train: 'Train',
  vehicle: 'Vehicle',
  reference: 'Reference',
  location: 'Location',
  travelTimeToSite: 'Travel time to site (min)',

  // Day panel
  day: 'Day',
  addTopic: 'Topic',
  addPause: 'Pause',
  addPlantTour: 'Plant Tour',
  addCustom: 'Custom',
  topic: 'Topic',
  pause: 'Pause',
  plantTour: 'Plant Tour',
  custom: 'Custom',

  // Events
  orientation: 'Orientation',
  orientationDescription: 'Setup Laptops/Power/Network Access, Introductions, and Location of Coffee',
  adjourn: 'Adjourn',
  recap: 'Recap',
  recapTitle: 'Re-Cap, Next Steps & What to Expect',
  recapDescription: 'Summary of work completed, agreed next steps, and timeline expectations.',
  lunchBreak: 'Lunch Break',
  customTopic: 'Custom Topic',

  // Day management
  newDay: 'New Day',
  removeLastDay: 'Remove Last Day',
  save: 'Save',
  agendaSaved: 'Agenda saved to library',

  // Library
  savedAgendas: 'Saved Agendas',
  importJson: 'Import JSON',
  noSavedAgendas: 'No saved agendas yet. Create one and save it!',
  load: 'Load',
  exportJson: 'Export JSON',
  delete: 'Delete',
  deleteConfirm: 'Delete this agenda?',
  updated: 'Updated',

  // Domains
  knowledgeDomains: 'Topic Directory',
  addDomain: 'Add Topic',
  resetToDefaults: 'Reset to Defaults',
  saveDomains: 'Save Topics',
  domainsSaved: 'Topics saved',
  resetConfirm: 'Reset all topics to defaults? Custom topics will be lost.',
  name: 'Name',
  icon: 'Icon (FontAwesome class)',
  description: 'Description',
  subTopicBullets: 'Sub-Topic Bullets (one per line)',
  recommendedAttendees: 'Recommended Attendees (one per line)',
  remove: 'Remove',

  // Preview
  exportPdf: 'Export PDF',
  exportDocx: 'Export DOCX',
  noAgendaPreview: 'No agenda to preview. Create one first!',
  attendees: 'Attendees',

  // About
  aboutTitle: 'About',
  aboutDescription: 'Build professional trip agendas for client visits. Add days, schedule topics from your knowledge domains, preview, and export as PDF.',
  privacyTitle: 'Privacy First',
  privacyDescription: 'All data stays in your browser. Agendas are saved locally using IndexedDB. Nothing is sent to any server.',
  trekModeTitle: 'Star Trek Mode',
  trekModeDescription: 'Toggle the MODE button to enter Star Trek mode. UI labels change but your exported agendas stay professional.',

  // Help
  helpGettingStarted: 'Getting Started',
  helpProjectHeader: 'Fill in the project header with client info',
  helpPreWorkQuestions: 'Answer pre-work questions to generate requirements',
  helpTravelDetails: 'Add travel details for arrival and departure',
  helpAddTopics: 'Add topics to each day from the knowledge domain picker',
  helpDragReorder: 'Drag & reorder events within each day',
  helpPreviewExport: 'Preview & export as PDF for emailing or printing',
  helpKeyboardShortcuts: 'Keyboard Shortcuts',
  helpSaveAgenda: 'Save agenda',
  helpPreviewPdf: 'Preview PDF',
  helpExportPdf: 'Export PDF',
  helpTrekMode: 'Star Trek Mode',
  helpTrekDescription: 'Toggle the MODE button in the top bar to switch between Standard and Star Trek mode. Trek mode changes UI labels but never affects your PDF exports.',

  // Auth
  login: 'Login',
  logout: 'Logout',
  username: 'Username',
  password: 'Password',
  signIn: 'Sign In',
  authRequired: 'Authentication Required',

  // Status
  selectLanguage: 'SELECT LANGUAGE',

  dayCount: 'day(s)',
  eventCount: 'events',

  // Domain names
  domainProcurement: 'Procurement',
  domainInventory: 'Inventory Management',
  domainProduction: 'Production (Further, Added Value)',
  domainCutting: 'Cutting & Joint Production',
  domainFinance: 'Financial Accounting',
  domainSales: 'Sales',
  domainLivestock: 'Livestock',
  domainDebrief: 'Daily Debrief',
  domainQA: 'Quality Assurance',
  domainMaintenance: 'Maintenance',
  domainTravel: 'Travel',
  domainKickoff: 'Daily Kickoff & Review',
  domainPlantTour: 'Plant Tour',

  // Domain descriptions
  domainProcurementDesc: 'We will work to understand the purchasing process from inputs triggering order creation, performing goods receipt, and 3-way match into a payable.',
  domainInventoryDesc: 'We will work to understand your inventory management requirements. This includes your required stock locations, how you identify/label your stock, perform stock-taking, and move material through your facility.',
  domainProductionDesc: 'We will work to understand your production processes, where raw material is transformed into work-in-progress and finished goods. By understanding your production steps and processes, we work to model your bill of materials and routing in our system with you.',
  domainCuttingDesc: 'We will work to understand your cut-up/disassembly processes. This is where a single input produces multiple different outputs. By understanding your cutting standards, we work to model the data and resulting planning and data capture with you.',
  domainFinanceDesc: 'We will work to understand your Financial Accounting requirements, such as the accounts receivable and accounts payable processes.',
  domainSalesDesc: 'We will work to understand the sales process from order intake, fulfilment, and final invoicing including supporting processes such as ASNs and EDI requirements.',
  domainLivestockDesc: 'We will work to understand the processes for the management of livestock. This includes the creation of orders, receipt, grading, data capture, and settlement to producers.',
  domainDebriefDesc: 'Check if daily goals were met, determine necessary course corrections, confirm logistics for following day.',
  domainQADesc: 'We will work to understand the QA processes performed by the operation and understand their food quality requirements.',
  domainMaintenanceDesc: 'We will work to understand the processes performed by the maintenance department, such as parts ordering, parts inventory, maintenance plan creation, execution and evaluation of performance results.',
  domainTravelDesc: 'Travel between locations.',
  domainKickoffDesc: 'We will organize ourselves for the day, review the agenda, and align on the goals for the day.',
  domainPlantTourDesc: 'We will tour your plant, ideally starting from procurement/input of material, through processing steps, to the ultimate output. We will observe the performance of processes (e.g. labeling, goods movements), and work to understand how we will support the operations on in the plant.',

  // Domain bullet points
  bulletProcurement1: 'Purchase requisition and order creation process',
  bulletProcurement2: 'Goods receipt procedures',
  bulletProcurement3: 'Invoice verification and 3-way match',
  bulletProcurement4: 'Vendor master data management',
  bulletInventory1: 'Warehouse and stock location structure',
  bulletInventory2: 'Material identification and labeling',
  bulletInventory3: 'Stock-taking and cycle counting',
  bulletInventory4: 'Goods movement and transfer processes',
  bulletProduction1: 'Bill of materials structure',
  bulletProduction2: 'Routing and work center setup',
  bulletProduction3: 'Production order lifecycle',
  bulletProduction4: 'Shop floor data capture',
  bulletCutting1: 'Cutting standards and specifications',
  bulletCutting2: 'Joint/co-product yield management',
  bulletCutting3: 'By-product handling',
  bulletCutting4: 'Quality grading and classification',
  bulletFinance1: 'Chart of accounts structure',
  bulletFinance2: 'Accounts payable process',
  bulletFinance3: 'Accounts receivable process',
  bulletFinance4: 'Period-end close procedures',
  bulletSales1: 'Sales order creation and management',
  bulletSales2: 'Delivery and fulfilment process',
  bulletSales3: 'Billing and invoicing',
  bulletSales4: 'ASN and EDI integration requirements',
  bulletLivestock1: 'Livestock order creation and scheduling',
  bulletLivestock2: 'Receipt and intake procedures',
  bulletLivestock3: 'Grading, classification, and data capture',
  bulletLivestock4: 'Producer settlement and payment',
  bulletDebrief1: 'Review of daily goals and progress',
  bulletDebrief2: 'Identify open items and blockers',
  bulletDebrief3: 'Determine course corrections',
  bulletDebrief4: 'Confirm logistics for following day',
  bulletQA1: 'Quality control procedures and checkpoints',
  bulletQA2: 'Food safety and compliance requirements',
  bulletQA3: 'Inspection and testing processes',
  bulletQA4: 'Non-conformance handling and corrective actions',
  bulletMaintenance1: 'Parts ordering and procurement',
  bulletMaintenance2: 'Parts inventory management',
  bulletMaintenance3: 'Maintenance plan creation and scheduling',
  bulletMaintenance4: 'Execution tracking and performance evaluation',
  bulletPlantTour1: 'Receiving / inbound logistics',
  bulletPlantTour2: 'Warehouse and storage areas',
  bulletPlantTour3: 'Production floor walkthrough',
  bulletPlantTour4: 'Labeling and goods movement observation',
  bulletPlantTour5: 'Shipping / outbound logistics',

  // Travel-topic fields
  travelFromLabel: 'From',
  travelToLabel: 'To',
  travelFlightLabel: 'Flight / Reference',
  travelDepartureTimeLabel: 'Departure',
  travelArrivalTimeLabel: 'Arrival',

  // Domain recommended attendees
  attendeeProcurementManager: 'Procurement Manager',
  attendeePurchasingAgent: 'Purchasing Agent',
  attendeeAPSpecialist: 'AP Specialist',
  attendeeWarehouseManager: 'Warehouse Manager',
  attendeeInventoryController: 'Inventory Controller',
  attendeeLogisticsCoordinator: 'Logistics Coordinator',
  attendeeProductionManager: 'Production Manager',
  attendeeProductionPlanner: 'Production Planner',
  attendeeShopFloorSupervisor: 'Shop Floor Supervisor',
  attendeeQualityManager: 'Quality Manager',
  attendeeProcessEngineer: 'Process Engineer',
  attendeeFinanceManager: 'Finance Manager',
  attendeeController: 'Controller',
  attendeeAPARSpecialist: 'AP/AR Specialist',
  attendeeSalesManager: 'Sales Manager',
  attendeeCustomerServiceRep: 'Customer Service Representative',
  attendeeLivestockManager: 'Livestock Manager',
  attendeeGradingSpecialist: 'Grading Specialist',
  attendeeProducerRelationsManager: 'Producer Relations Manager',
  attendeeDebriefProjectLead: 'Project Lead',
  attendeeDebriefTeamLead: 'Team Lead',
  attendeePlantManager: 'Plant Manager',
  attendeeProductionSupervisor: 'Production Supervisor',

  // Orientation bullets
  bulletOrientation1: 'Setup laptops and power connections',
  bulletOrientation2: 'Establish network access',
  bulletOrientation3: 'Team introductions',
  bulletOrientation4: 'Location of facilities and coffee',

  // Recap bullets
  bulletRecap1: 'Review of completed topics',
  bulletRecap2: 'Open items and action owners',
  bulletRecap3: 'Next steps and timeline',
  bulletRecap4: 'What to expect going forward',

  // Event card edit form
  editTitle: 'Title',
  editStartTime: 'Start Time',
  editEndTime: 'End Time',
  editDescription: 'Description',
  editSubTopics: 'Sub-Topics',
  editAddPoint: 'Add Point',
  editAttendees: 'Attendees',
  editAddAttendee: 'Add Attendee',
  editCancel: 'Cancel',
  editSave: 'Save',
  editSubTopicPlaceholder: 'Sub-topic point',
  editNamePlaceholder: 'Name',
  editRolePlaceholder: 'Role',
  editDragReorder: 'Drag to reorder',
  editButton: 'Edit',
  editRemove: 'Remove',
  editDurMinus: '-30 min',
  editDurPlus: '+30 min',

  // Preview / PDF labels
  previewCustomerNumber: 'Customer #:',
  previewCustomerAddress: 'Customer Address:',
  previewCustomerContact: 'Customer Project Contact:',
  previewVendorContact: 'Vendor Project Contact:',
  previewProjectNumber: 'Project #:',
  previewProject: 'Project:',
  previewPreWorkTitle: 'Pre-Work Requirements',
  previewTravelArrival: 'Travel — Arrival:',
  previewTravelDeparture: 'Travel — Departure:',
  previewEstToSite: 'Est. {0} min to site',
  previewEstFromSite: 'Est. {0} min from site',
  travelAtTime: 'at',
  previewDay: 'Day {0}:',
  previewPageOf: 'Page {0} of {1}',
  previewAttendees: 'Attendees:',

  // Travel placeholders
  travelRefPlaceholder: 'e.g. LH456',
  travelRefVehiclePlaceholder: 'e.g. Rental car',
  travelLocationPlaceholder: 'Airport / Station / Hotel',

  // Misc
  newTopic: 'New Topic',
  untitledAgenda: 'Untitled Agenda',
  errorTitle: 'Error',
  errorLoadAgendas: 'Could not load saved agendas.',
  preWorkOutput: 'Pre-Work',
  aboutVersion: 'Tempo v1.0.0',
  aboutLcarsReuse: 'LCARS design system reusable for any project.',
  aboutLcarsFile: 'The LCARS design is available in {0} for reuse.',
  overlapWarning: 'Schedule conflict — events overlap',
  fixOverlaps: 'Fix It',

  // Draft
  saveDraft: 'Save Draft',
  draftSaved: 'Draft saved to browser',
  draftFound: 'A saved draft was found. Restore it?',
  draftRestore: 'Restore',
  draftDiscard: 'Discard',
  draftCleared: 'Draft discarded',

  // Sync
  syncTitle: 'Cloud Sync',
  syncEnable: 'Enable Sync',
  syncDisable: 'Disable Sync',
  syncNow: 'Sync Now',
  syncPhrase: 'Your Sync Phrase',
  syncPhraseHint: 'Save this phrase — enter it on any device to access your library.',
  syncEnterPhrase: 'Enter sync phrase',
  syncCopied: 'Phrase copied to clipboard',
  syncPushed: 'Library uploaded',
  syncPulled: 'Library downloaded',
  syncError: 'Sync failed',
  syncSyncing: 'Syncing…',
  syncDone: 'Sync complete',
  syncMerged: 'agendas merged',
  syncDisconnected: 'Sync disabled',

  // Collab
  shareAgenda: 'Share',
  shareLink: 'Share link',
  shareCopied: 'Link copied to clipboard',
  sharePeers: 'peers connected',
  shareLeave: 'Leave Room',
  shareJoining: 'Joining room…',
  shareConnected: 'Connected to room',

  // Topic picker sub-menus
  sundries: 'Sundries',
  topics: 'Topics',

  // Day header
  dayStartTime: 'Start',
  dayAdjournTime: 'Adjourn',

  // Compressed mode
  compressedMode: 'Compact',

  // Arrange times
  arrangeTimes: 'Arrange Times',
  timesArranged: 'Times arranged',

  // Pause warning
  pauseWarning: 'More than 2.5 hours without a scheduled break',

  // About — tools
  aboutToolsTitle: 'Built With',
  aboutToolsDescription: 'Tempo is built with Vite, TypeScript, jsPDF, docx, and FileSaver.js. Cloud sync and real-time collaboration use Cloudflare Workers, KV, and Durable Objects. The UI follows an LCARS-inspired design system.',

  // Library sections
  documents: 'Documents',
  templates: 'Templates',
  saveAsTemplate: 'Save as Template',
  noTemplates: 'No templates yet. Save an agenda as a template to reuse it!',

  // Sync status bar
  syncBarOffline: 'OFFLINE',
  syncBarOnline: 'LINKED',
  syncBarSyncing: 'SYNCING',
  syncBarError: 'SYNC ERR',

  // Sync modal
  syncSettings: 'Sync Settings',
  syncModalDesc: 'Sync your library across devices using a passphrase. Use a passkey for quick access on this device.',
  syncPassphrase: 'Sync Passphrase',
  syncPassphraseNew: 'Generate New',
  syncPassphraseExisting: 'Use Existing',
  syncRegisterPasskey: 'Register Passkey',
  syncUsePasskey: 'Unlock with Passkey',
  syncPasskeyRegistered: 'Passkey registered for this device',
  syncPasskeyRemove: 'Remove Passkey',
  syncPasskeyUnsupported: 'Passkeys not supported in this browser',
  syncClose: 'Close',
};
