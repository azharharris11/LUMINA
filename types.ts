

export type Role = 'OWNER' | 'ADMIN' | 'PHOTOGRAPHER' | 'EDITOR' | 'FINANCE';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string; 
  phone: string; 
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'; 
  specialization?: string; 
  commissionRate?: number; 
  joinedDate: string; 
  unavailableDates?: string[]; 
  ownerId?: string;
  studioId?: string; // NEW: Links staff to the Studio Owner's data
}

// ... (Keep all existing interfaces exactly as they are until SidebarProps) ...

export type AccountType = 'CASH' | 'BANK' | 'PETTY_CASH';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  ownerId?: string;
}

export type ProjectStatus = 'INQUIRY' | 'BOOKED' | 'SHOOTING' | 'CULLING' | 'EDITING' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';

export interface BookingFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export interface BookingItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  cost?: number; 
  total: number;
}

export interface BookingTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string; 
}

export interface ActivityLog {
  id: string;
  action: string;
  userName: string;
  userId: string;
  timestamp: string;
  details?: string;
}

export interface BookingComment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface TimeLog {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number; 
  notes?: string;
}

export interface Discount {
  type: 'PERCENT' | 'FIXED';
  value: number;
}

export type CostCategory = 'LABOR' | 'MATERIAL' | 'OTHER';

export interface PackageCostItem {
  id: string;
  description: string;
  amount: number;
  category: CostCategory;
}

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string; 
  timeStart: string;
  duration: number; 
  package: string;
  price: number;
  paidAmount: number;
  status: ProjectStatus;
  photographerId: string;
  editorId?: string;
  studio: string; 
  clientId?: string; 
  
  moodboard?: string[]; 
  contractStatus: 'PENDING' | 'SIGNED' | 'VOID';
  contractSignedDate?: string;
  files?: BookingFile[];
  deliveryUrl?: string;

  items?: BookingItem[]; 
  tasks?: BookingTask[]; 
  logs?: ActivityLog[];  
  assetIds?: string[];   
  comments?: BookingComment[]; 
  discount?: Discount;
  
  timeLogs?: TimeLog[];
  
  costSnapshot?: PackageCostItem[];
  taxSnapshot?: number; 
  ownerId?: string;
}

export interface Transaction {
  id: string;
  date: string; 
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  accountId: string; 
  relatedAccountId?: string; 
  category: string; 
  status: 'COMPLETED' | 'PENDING';
  bookingId?: string; 
  ownerId?: string;
}

export interface MonthlyMetric {
  name: string;
  income: number;
  expense: number;
}

export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN';
export type AssetCategory = 'CAMERA' | 'LENS' | 'LIGHTING' | 'PROP' | 'BACKGROUND';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  serialNumber?: string;
  assignedToUserId?: string; 
  imageUrl?: string;
  returnDate?: string;
  notes?: string; 
  lastUpdated?: string;
  ownerId?: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: number; 
  features: string[];
  active: boolean;
  costBreakdown: PackageCostItem[]; 
  turnaroundDays?: number; 
  archived?: boolean; 
  ownerId?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  category: 'VIP' | 'REGULAR' | 'NEW' | 'PROBLEMATIC';
  notes: string; 
  joinedDate: string;
  ownerId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
}

export interface StudioRoom {
  id: string;
  name: string;
  type: 'INDOOR' | 'OUTDOOR';
  color: string; 
}

export interface WhatsAppTemplates {
  booking: string;
  reminder: string;
  thanks: string;
}

export type SiteTheme = 'NOIR' | 'ETHEREAL' | 'VOGUE' | 'MINIMAL' | 'CINEMA' | 'RETRO' | 'ATELIER' | 'HORIZON' | 'BOLD' | 'IMPACT' | 'CLEANSLATE' | 'AUTHORITY';

export interface SiteGalleryItem {
  id: string;
  url: string;
  caption?: string;
}

export interface SiteSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface SitePixels {
  facebookPixelId?: string; 
  googleTagId?: string; 
  tiktokPixelId?: string; 
  googleTagManagerId?: string; 
}

export interface SiteAnnouncement {
  enabled: boolean;
  text: string;
  link?: string;
  color: string; 
  textColor: string;
}

export interface SiteTestimonial {
  id: string;
  clientName: string;
  text: string;
  rating: number; 
}

export interface SiteFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface SiteBeforeAfter {
  enabled: boolean;
  beforeImage: string;
  afterImage: string;
  label: string;
}

export interface SiteBranding {
  faviconUrl?: string;
  socialShareImage?: string; 
}

export type SectionType = 'HERO' | 'TEXT_IMAGE' | 'FEATURES' | 'GALLERY' | 'PRICING' | 'TESTIMONIALS' | 'FAQ' | 'CTA_BANNER';

export interface SiteSection {
  id: string;
  type: SectionType;
  content: {
    headline?: string;
    subheadline?: string;
    description?: string; 
    image?: string;
    layout?: 'LEFT' | 'RIGHT' | 'CENTER'; 
    buttonText?: string;
    items?: { title: string; text: string; icon?: string }[]; 
  };
}

export interface SitePage {
  id: string;
  slug: string;
  title: string; 
  headline: string; 
  description: string; 
  heroImage: string; 
  showPortfolio: boolean; 
  showPricing: boolean; 
  showBookingWidget: boolean;
  gallery: SiteGalleryItem[]; 
  sections?: SiteSection[];
}

export interface SiteConfig {
  subdomain: string;
  title: string;
  headline: string;
  description: string;
  theme: SiteTheme;
  heroImage: string;
  showPricing: boolean;
  showTeam: boolean;
  showPortfolio: boolean;
  showBookingWidget: boolean;
  instagramUrl?: string;
  isPublished: boolean;
  gallery: SiteGalleryItem[];
  seo: SiteSEO;
  pixels: SitePixels; 
  announcement: SiteAnnouncement;
  testimonials: SiteTestimonial[];
  faq: SiteFAQ[];
  beforeAfter: SiteBeforeAfter;
  branding: SiteBranding;
  pages: SitePage[];
}

export interface StudioConfig {
  name: string;
  address: string;
  phone: string;
  website: string;
  
  // Financial Policy
  taxRate: number; 
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  requiredDownPaymentPercentage?: number; // NEW: e.g., 50%
  paymentDueDays?: number; // NEW: Days relative to session (0 = day of, -1 = day before)

  // Scheduling Policy
  operatingHoursStart: string; // NEW: "09:00"
  operatingHoursEnd: string; // NEW: "18:00"
  bufferMinutes: number; 
  
  // Production Policy
  defaultTurnaroundDays?: number; // NEW: e.g., 7 days

  logoUrl?: string;
  npwp?: string;
  invoiceFooter?: string;
  rooms: StudioRoom[];
  templates: WhatsAppTemplates;
  site: SiteConfig;
  ownerId?: string;
}

export interface PublicBookingSubmission {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  packageId: string;
}

export interface InventoryViewProps {
  assets: Asset[];
  users: User[];
  onAddAsset?: (asset: Asset) => void;
  onUpdateAsset?: (asset: Asset) => void;
  onDeleteAsset?: (id: string) => void;
}

export interface SettingsViewProps {
  packages: Package[];
  config: StudioConfig;
  onAddPackage?: (pkg: Package) => void;
  onUpdatePackage?: (pkg: Package) => void;
  onDeletePackage?: (id: string) => void;
  onUpdateConfig?: (config: StudioConfig) => void;
  bookings?: Booking[]; 
  currentUser?: User; 
  onUpdateUserProfile?: (user: User) => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
}

export interface FinanceViewProps {
  accounts: Account[];
  metrics: MonthlyMetric[];
  bookings: Booking[];
  users: User[];
  transactions?: Transaction[];
  config: StudioConfig;
  onTransfer?: (fromId: string, toId: string, amount: number) => void;
  onRecordExpense?: (expenseData: { description: string; amount: number; category: string; accountId: string }) => void;
  onSettleBooking?: (bookingId: string, amount: number, accountId: string) => void;
  onDeleteTransaction?: (id: string) => void; 
}

export interface TeamViewProps {
  users: User[];
  bookings: Booking[];
  onAddUser?: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (id: string) => void;
}

export interface CalendarViewProps {
  bookings: Booking[];
  currentDate: string;
  users: User[]; 
  rooms: StudioRoom[]; 
  onDateChange: (date: string) => void;
  onNewBooking: (prefill?: { date: string, time: string, studio: string }) => void;
  onSelectBooking: (id: string) => void;
}

export interface ClientsViewProps {
  clients: Client[];
  bookings: Booking[];
  config: StudioConfig; 
  onAddClient?: (client: Client) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
  onSelectBooking: (id: string) => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  clients: Client[];
  bookings: Booking[];
  assets: Asset[];
  onSelectBooking: (id: string) => void;
  currentUser: User;
}

export interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  photographers: User[];
  accounts: Account[];
  bookings?: Booking[]; 
  clients?: Client[]; 
  config: StudioConfig; 
  onAddBooking?: (booking: Booking, paymentDetails?: { amount: number, accountId: string }) => void;
  onAddClient?: (client: Client) => void;
  initialData?: { date: string, time: string, studio: string };
}

export interface SiteBuilderViewProps {
  config: StudioConfig;
  packages: Package[];
  users: User[];
  bookings: Booking[]; // Added bookings here
  onUpdateConfig: (config: StudioConfig) => void;
  onPublicBooking?: (data: PublicBookingSubmission) => void; 
}

export interface SidebarProps {
  currentUser: User;
  onNavigate: (view: string) => void;
  currentView: string;
  onLogout: () => void;
  onSwitchApp: () => void;
  isDarkMode: boolean; 
  onToggleTheme: () => void;
}