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
 * Payload sent by CMS admin to reply to a contact message via official email.
 */
export interface ReplyContactPayload {
  subject: string;
  message: string;
}
