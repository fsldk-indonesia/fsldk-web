// Model & tipe data bersama untuk seluruh aplikasi.

/** Amplop response standar dari FSLDK API. */
export interface ApiResponse<T> {
  path: string;
  timestamp: string;
  status: 'ok' | 'fail';
  code: string;
  message: string;
  result: T;
  errors: FieldError[] | null;
}

export interface FieldError {
  attribute: string;
  field?: string;
  code: string;
  message: string;
}

export interface Pagination<T> {
  page: number;
  limit: number;
  count: number;
  data: T[];
  prev: string;
  next: string;
}

export interface UserProfile {
  userID: number;
  fullName: string;
  email: string;
  emailVerified: boolean;
  role: string;
  permissions: string[];
  photoURL?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface MenuItem {
  menuLabel: string;
  menuIcon: string;
  menuRoute: string;
  sortOrder: number;
}

export interface UserRow {
  userID: number;
  fullName: string;
  email: string;
  roleID: number;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  hasGoogle: boolean;
  hasPassword: boolean;
}

export interface Role {
  roleID: number;
  roleName: string;
  roleDescription: string;
  isSystemRole: boolean;
  isActive: boolean;
  userCount: number;
  permissions: string[];
  permissionIDs: number[];
}

export interface Permission {
  permissionID: number;
  permissionCode: string;
  permissionName: string;
  moduleName: string;
}

export interface Category {
  categoryID: number;
  categoryName: string;
  categorySlug: string;
}

export interface News {
  newsID: number;
  newsTitle: string;
  newsSlug: string;
  newsExcerpt: string | null;
  newsContent: string;
  newsImage: string | null;
  categoryID: number;
  categoryName: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedDate: string | null;
  viewCount: number;
  authorName: string;
  createdDate: string;
}

export interface DashboardSummary {
  totalNews: number;
  publishedNews: number;
  draftNews: number;
  totalUsers: number;
}
