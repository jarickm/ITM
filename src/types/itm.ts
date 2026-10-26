export type AssetStatus = 
  | 'In Use' 
  | 'Available' 
  | 'Under Maintenance' 
  | 'Defective' 
  | 'Retired' 
  | 'Reserved'
  | (string & {});

export type AssetCategory = 
  | 'Laptop' 
  | 'Desktop PC' 
  | 'Workstation' 
  | 'Monitor' 
  | 'Server' 
  | 'Network & Switch' 
  | 'Printer & Scanner' 
  | 'Mobile Device / Tablet' 
  | 'Peripherals / Accessories' 
  | 'Software / License'
  | (string & {});

export interface DropdownOptionsConfig {
  departments: string[];
  branches: string[];
  positions: string[];
  assetCategories: string[];
  assetStatuses: string[];
  requestTypes: string[];
  requestPriorities: string[];
  requestStatuses: string[];
  onboardingStatuses: string[];
  offboardingStatuses: string[];
  borrowStatuses: string[];
  pmStatuses: string[];
  liabilityStatuses: string[];
  unitsOfMeasure: string[];
  companies: string[];
  locations: string[];
}

export interface Asset {
  id: string;
  employeeOrDeviceName: string; // Employee / Device Name
  category: AssetCategory;      // Category
  specificationOrSN: string;    // Specification/SN
  assetCode: string;            // Asset Code (e.g. IT-NB-2024-001)
  status: AssetStatus;          // Status
  department: string;           // Department
  purchaseDate: string;         // Purchase Date (YYYY-MM-DD)
  cost?: number;
  warrantyExpiry?: string;
  location?: string;
  isDefective?: boolean;
  defectiveDetails?: string;
  repairVendor?: string;
  rmaNumber?: string;
  qrCodeData?: string;
  imageUrl?: string;
  // Planned Maintenance (PMS) alignment
  pmsCompleted?: boolean;
  pmsDate?: string;
  pmsHalf?: '1st Half' | '2nd Half' | 'Both';
  pmsTechnician?: string;
  pmsRemarks?: string;
  // Custody Transfer History / Ownership Trail
  custodyHistory?: AssetCustodyTransfer[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCustodyTransfer {
  id: string;
  transferDate: string;
  fromEmployee: string;
  fromDepartment: string;
  fromBranch?: string;
  toEmployee: string;
  toDepartment: string;
  toBranch?: string;
  reason: 'Employee Resigned' | 'Department Transfer' | 'Position Reassignment' | 'Temporary Reallocation' | 'Return to IT Stock' | string;
  conditionOnTransfer: string;
  accessoriesIncluded: string[]; // e.g. ['Charger / Adapter', 'Mouse', 'Laptop Bag', 'Cable Lock', 'USB Dongle / Hub']
  transferNotes?: string;
  authorizedBy: string;
  turnoverReceiptNumber: string;
  receivedAcknowledged?: boolean;
}

export type OnboardingStatus = 'Pending' | 'Equipment Assigned' | 'Completed' | 'Delayed' | (string & {});

export interface OnboardingRecord {
  id: string;
  employeeName: string;       // Employee Name
  department: string;         // Department
  position: string;           // Position
  startDate: string;          // Start Date
  company: string;            // Company
  controlNumber: string;      // Control Number
  status: OnboardingStatus;   // Status
  dateOfOnboarding: string;   // Date of onboarding
  assignedAssets?: string[];  // Asset codes assigned
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OffboardingStatus = 'Pending Surrender' | 'Partially Returned' | 'Cleared' | 'Disputed' | (string & {});

export interface OffboardingRecord {
  id: string;
  employeeName: string;       // Employee Name
  department: string;         // Department
  position: string;           // Position
  separationDate: string;     // Separation Date
  company: string;            // Company
  controlNumber: string;      // Control Number
  status: OffboardingStatus;  // Status
  clearedAssets?: string[];
  pendingAssets?: string[];
  itClearanceSignOff?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestType = 'PR' | 'IER' | (string & {}); // Purchase Request or Incident/Equipment Request
export type RequestPriority = 'Major' | 'Minor' | 'Critical' | (string & {});
export type RequestStatus = 'Open' | 'In Progress' | 'Pending Approval' | 'Resolved' | 'Closed' | 'Cancelled' | (string & {});

export interface RequestRecord {
  id: string;
  dateReported: string;               // DATE REPORTED
  requestType: RequestType;           // Request Type
  referenceNo: string;                // Reference No. (PR/IER)
  employeeOrRequesterName: string;    // Employee/Requester Name
  departmentOrBranches: string;       // Department/Branches
  actionsTakenOrRemarks: string;      // Actions Taken/Remarks
  dateCreated: string;                // DATE CREATED IER/PR
  dateResolved?: string;              // DATE RESOLVED
  days: number;                       // DAYS (Turnaround Time SLA)
  majorOrMinor: RequestPriority;      // Major/Minor
  status: RequestStatus;
  estimatedAmount?: number;
  assignedTechnician?: string;
  createdAt: string;
  updatedAt: string;
}

export type BorrowStatus = 'Active / Borrowed' | 'Returned' | 'Overdue' | 'Damaged on Return' | (string & {});

export interface BorrowingRecord {
  id: string;
  borrowerName: string;       // Borrower Name
  department: string;         // Department
  itemCategory: string;       // Item Category
  assetCode?: string;
  borrowDate: string;         // Borrow Date
  returnDate: string;         // Return Date
  actualReturnDate?: string;
  status: BorrowStatus;       // Status
  remarks: string;            // Remarks
  createdAt: string;
  updatedAt: string;
}

export type PMStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Requires Replacement' | (string & {});

export interface PreventiveMaintenanceRecord {
  id: string;
  description: string;        // Description
  date: string;               // Date
  datePurchase: string;       // Date Purchase
  assetCode: string;          // Asset Code
  activityWorkDone: string;   // Activity / Work Done
  performedBy: string;        // Performed by
  status: PMStatus;           // Status
  recommendation: string;     // Recommendation
  department: string;         // Department
  nextMaintenanceDate?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

export type LiabilityStatus = 'Active Accountability' | 'Surrendered' | 'Transferred' | 'Lost/Damaged' | (string & {});

export interface LiabilityRecord {
  id: string;
  qty: number;                // Qty
  uom: string;                // UOM (Unit, Set, Pcs, Box, etc.)
  itemDescription: string;    // Item Description
  dateIssued: string;         // Date Issued
  employeeName: string;       // Employee Name
  department: string;         // Department
  assetCode: string;          // Asset Code
  company: string;            // Company
  status: LiabilityStatus;
  signedAcknowledged?: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
}

export type UserRole = 'Super Admin' | 'IT Admin' | 'Viewer / Staff' | 'Admin' | 'IT Manager' | 'IT Technician' | 'Auditor';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  adId?: string; // Active Directory Single Sign-On ID
}

export type LanguageCode = 'en' | 'es' | 'fil' | 'ja';

export interface SystemSettings {
  companyName: string;
  lowStockThresholds: Record<string, number>;
  emailAlertsEnabled: boolean;
  alertEmail: string;
  adDomain: string;
  lastBackupDate?: string;
  masterAdminPassword?: string; // IT Admin Password for Clear All Data & Critical Actions
  dropdownOptions?: DropdownOptionsConfig;
}

// ==========================================
// OFFICIAL MEASUREMENT OF TARGET - IT 2026
// ==========================================

export type MonthName = 
  | 'January' 
  | 'February' 
  | 'March' 
  | 'April' 
  | 'May' 
  | 'June' 
  | 'July' 
  | 'August' 
  | 'September' 
  | 'October' 
  | 'November' 
  | 'December';

export const MONTHS_LIST: MonthName[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface MTTRMonthRecord {
  daysSpent: number;
  totalRepairs: number;
}

export interface BranchUptimeMonthRecord {
  workingHours: number;
  connectedHours: number;
  noConnectionHours: number;
  remarks?: string;
}

export interface OrientationMonthRecord {
  conductedNetsuite: number;
  scheduledNetsuite: number;
  conductedBasic: number;
  scheduledBasic: number;
}

export interface OrientationSessionLog {
  id: string;
  date: string;
  category: 'NetSuite System Training' | 'Basic Troubleshooting';
  topic: string;
  branchOrDept: string;
  attendeesCount: number;
  conductedBy: string;
  status: 'Conducted' | 'Scheduled';
  notes?: string;
  createdAt: string;
}

export interface NetsuiteSlaMonthRecord {
  minorResolvedDays: number;
  minorReported: number;
  majorResolvedDays: number;
  majorReported: number;
}

export interface NetsuiteConcernLog {
  id: string;
  ticketNumber: string;
  dateReported: string;
  dateResolved?: string;
  requester: string;
  departmentOrBranch: string;
  moduleOrFunction: string;
  priority: 'Minor (<1 Day)' | 'Major (<=7 Days)';
  description: string;
  resolutionNotes?: string;
  daysToResolve: number;
  resolvedOnTime: boolean;
  screenshotUrl?: string; // base64 image or URL
  screenshotFileName?: string;
  createdAt: string;
}

export interface KPITargets2026Data {
  year: number;
  // KPI 1: Mean Time to Repair (MTTR)
  mttr: {
    minor: Record<MonthName, MTTRMonthRecord>;    // Target: Minor (<1 Day)
    majorA: Record<MonthName, MTTRMonthRecord>;   // Target: Major A (<14 Days, <= 7 days)
    majorB: Record<MonthName, MTTRMonthRecord>;   // Target: Major B (<30 Days, 14 days above)
  };
  // KPI 2: Percentage Uptime of Connectivity (Target: 100%)
  connectivity: {
    basa: Record<MonthName, BranchUptimeMonthRecord>;
    smp: Record<MonthName, BranchUptimeMonthRecord>;
    sjdm: Record<MonthName, BranchUptimeMonthRecord>;
    cebu: Record<MonthName, BranchUptimeMonthRecord>;
    cdo: Record<MonthName, BranchUptimeMonthRecord>;
    tarlac: Record<MonthName, BranchUptimeMonthRecord>;
    bicol: Record<MonthName, BranchUptimeMonthRecord>;
  };
  // KPI 3: Planned Maintenance Percentage (Target: 100% semi annual)
  pms: {
    firstHalf: { planned: number; actualDone: number };
    secondHalf: { planned: number; actualDone: number };
    locationTargets?: Record<string, { planned: number; actualDoneFirstHalf: number; actualDoneSecondHalf: number }>;
  };
  // KPI 4: 10 for Orientation and Basic Troubleshooting
  orientations: Record<MonthName, OrientationMonthRecord>;
  orientationSessions?: OrientationSessionLog[];
  // KPI 5: Percentage of NetSuite concerns resolved on time with IT (Target: 100%)
  netsuite: Record<MonthName, NetsuiteSlaMonthRecord>;
  netsuiteConcerns?: NetsuiteConcernLog[];
  updatedAt: string;
}

