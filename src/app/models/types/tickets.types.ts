export type TicketStatus = 'NEW' | 'OPEN' | 'WAITING' | 'RESOLVED';

export interface TicketAttachmentRef {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  relativePath: string;
  savedAt: string;
}

export interface TicketMessage {
  id: string;
  direction: 'customer' | 'agent' | 'system';
  subject: string;
  text: string;
  createdAt: string;
  source: 'email' | 'whatsapp' | 'internal';
  sender?: {
    id: string;
    name: string;
  };
  attachments?: TicketAttachmentRef[];
}

export interface TicketAttachmentIndexEntry extends TicketAttachmentRef {
  messageId: string;
}

export interface Ticket {
  _id: string;
  ticketNumber: string;
  canaleIngresso: 'email' | 'whatsapp';
  richiedente: {
    nome: string;
    email: string;
  };
  titolo: string;
  stato: TicketStatus;
  escalation: boolean;
  escalationReason?: string;
  dataCreazione: string;
  dataAggiornamento: string;
  messages: TicketMessage[];
  attachmentIndex?: TicketAttachmentIndexEntry[];
}

export interface CreateTicketPayload {
  richiedente: {
    nome: string;
    email: string;
  };
  titolo: string;
  testoIniziale: string;
  stato?: TicketStatus;
  escalation?: boolean;
}

export interface UpdateTicketPayload {
  titolo?: string;
  stato?: TicketStatus;
  escalation?: boolean;
  escalationReason?: string;
}

export interface ReplyTicketPayload {
  text: string;
  subject?: string;
}
