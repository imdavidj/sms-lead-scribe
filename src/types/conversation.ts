export interface Contact {
  id: string
  phone_e164: string
  first_name?: string
  last_name?: string
}

export interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string
  ai_summary?: {
    address?: string
    timeline?: string
    reason?: string
    condition?: string
    price?: string
  }
  twilio_sid?: string
  created_at: string
}

export interface Conversation {
  id: string
  contact_id: string
  status: string
  last_msg_at: string
  created_at: string
  contact: Contact
  messages: Message[]
}