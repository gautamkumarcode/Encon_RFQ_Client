export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  department?: string;
  role: string;
  roleDescription?: string;
  status: 'ACTIVE' | 'DISABLED';
  applications?: Application[];
  permissions?: string[];
  lastLoginAt?: string;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

export interface Application {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'CORE' | 'EXTERNAL' | 'FUTURE';
  baseUrl: string;
  ssoEndpoint?: string;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE' | 'IN_DEVELOPMENT';
  activeUsersCount?: number;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userEmail: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    name: string;
    role: { name: string };
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'ANNOUNCEMENT' | 'ALERT';
  targetRoleId?: string;
  targetUserId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  summaryCards: {
    totalRFQs: number;
    totalOffersGenerated: number;
    pendingRFQs: number;
    pendingOffers: number;
    approvedRFQs: number;
    approvedOffers: number;
    totalValueINR: number;
    overallConversionRate: number;
    activeUsersCount: number;
    totalAppsCount: number;
  };
  recentRFQs: Array<{
    id: string;
    rfqNumber: string;
    clientName: string;
    projectType: string;
    status: string;
    createdBy: string;
    createdAt: string;
  }>;
  recentOffers: Array<{
    id: string;
    offerNumber: string;
    rfqNumber: string;
    clientName: string;
    amountINR: number;
    status: string;
    preparedBy: string;
    createdAt: string;
  }>;
  topEmployees: EmployeeKPI[];
  monthlyTrends: Array<{
    month: string;
    rfqs: number;
    offers: number;
    approved: number;
    revenue: number;
  }>;
}

export interface EmployeeKPI {
  email: string;
  name: string;
  role: string;
  rfqsCreated: number;
  offersGenerated: number;
  approvedOffers: number;
  conversionRate: number;
  totalRevenueINR: number;
  lastActivity: string;
}
