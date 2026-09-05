/**
 * Contact message item for CMS inbox table listing.
 */
export interface ContactListItem {
  messageID: number;
  senderName: string;
  email: string;
  subject: string;
  isRead: boolean;
  createdDate: string;
}

/**
 * Detailed contact message including full body and audit IP address.
 */
export interface ContactDetail extends ContactListItem {
  message: string;
  ipAddress?: string;
}

/**
 * Payload sent by visitors from the public contact form.
 */
export interface SendContactPayload {
  senderName: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Query parameters for filtering and paginating CMS contact messages.
 */
export interface ContactListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isRead?: boolean | string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Standard paginated response envelope for contact messages list.
 */
export interface ContactListResponse {
  data: ContactListItem[];
  page: number;
  limit: number;
  total: number;
}
