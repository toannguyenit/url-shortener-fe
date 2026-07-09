export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

export interface UrlItem {
  id: string;
  longUrl: string;
  shortCode: string;
  shortUrl: string;
  aliasType: "AUTO" | "CUSTOM";
  active: boolean;
  expiresAt?: string | null;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UrlPage {
  content: UrlItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ClickByDay {
  date: string;
  count: number;
}

export interface GeoCount {
  countryCode?: string;
  city?: string;
  count: number;
}

export interface RecentClick {
  ipAddress?: string;
  countryCode?: string;
  city?: string;
  userAgent?: string;
  clickedAt: string;
}

export interface UrlAnalytics {
  totalClicks: number;
  clicksByDay: ClickByDay[];
  topCountries: GeoCount[];
  recentClicks: RecentClick[];
}

export interface TopLink {
  id: string;
  shortCode: string;
  clickCount: number;
}

export interface DashboardData {
  totalLinks: number;
  totalClicks: number;
  topLinks: TopLink[];
  clicksLast7Days: ClickByDay[];
}
