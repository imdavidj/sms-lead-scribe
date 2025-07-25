# SMS Lead Qualifier Dashboard

A comprehensive SMS lead qualification system built with React, Supabase, and integrated with your existing n8n automation workflow.

## Architecture Overview

```
SMS → Twilio → n8n → Lovable Dashboard
                ↓           ↑
            OpenAI API   Reply API
```

## Features

- **Real-time SMS Conversations**: View all inbound and outbound SMS threads
- **Lead Information Management**: Edit and track parsed lead fields (address, timeline, reason, condition, price)  
- **Status Tracking**: Manage conversation status (Open, Qualified, Closed)
- **Agent Replies**: Send replies directly from the dashboard that route through your n8n workflow
- **Search & Filtering**: Find conversations by phone, contact name, address, or status
- **Role-based Access**: Admin, Agent, and Viewer roles with appropriate permissions
- **Real-time Updates**: Live updates when new messages arrive

## Database Schema

### Tables
- **contacts**: Store contact information with unique phone numbers
- **conversations**: Group messages by contact with status tracking
- **messages**: Individual SMS messages with AI summary data
- **profiles**: User roles and information

## API Endpoints

### 1. POST `/functions/v1/hooks` (Called by n8n)
Receives SMS messages from your n8n workflow:

```bash
curl -X POST https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/hooks \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19045551234",
    "direction": "inbound",
    "body": "Hi, I want to sell my house at 123 Main St",
    "ai_summary": {
      "address": "123 Main St",
      "timeline": "ASAP",
      "reason": "Moving",
      "condition": "Good",
      "price": "300000"
    },
    "twilio_sid": "SMxxxxxxxx"
  }'
```

### 2. POST `/functions/v1/reply` (Called by Dashboard)
Sends agent replies and forwards to n8n:

```bash
curl -X POST https://fllsnsidgqlacdyatvbm.supabase.co/functions/v1/reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "conversation_id": "uuid-here",
    "phone": "+19045551234", 
    "message": "Thanks for reaching out! What's the address?",
    "user_id": "agent-uuid"
  }'
```

## Environment Variables

Set these in your Supabase Edge Functions secrets:

```bash
# Required for n8n integration
N8N_REPLY_WEBHOOK_URL=https://your-n8n.domain.com/webhook/reply

# Supabase (already configured)
SUPABASE_URL=https://fllsnsidgqlacdyatvbm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Integration with n8n

### Webhook Configuration

1. **Incoming SMS Webhook** (existing): 
   - Add a final HTTP Request node to POST to `/functions/v1/hooks`
   - Send the message data and AI summary after processing

2. **Reply Webhook** (new):
   - Create a new webhook endpoint in n8n at `/webhook/reply`
   - Configure to receive agent replies and send via Twilio
   - After Twilio sends, POST back to `/functions/v1/hooks` to confirm delivery

### Example n8n Flow for Agent Replies

```
Webhook (receives reply) → Twilio Send SMS → HTTP Request (confirm delivery)
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sms-lead-qualifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - The database schema is already created
   - Edge functions are deployed automatically
   - Configure your n8n webhook URL in Supabase secrets

4. **Run locally**
   ```bash
   npm run dev
   ```

5. **Configure n8n Integration**
   - Update your existing n8n flow to POST to the hooks endpoint
   - Create a new webhook for handling agent replies
   - Test the full flow end-to-end

## User Roles

- **Admin**: Full access - can delete conversations and manage users
- **Agent**: Can reply to messages and edit lead information  
- **Viewer**: Read-only access to conversations

## Security Features

- Row Level Security (RLS) policies enforce role-based access
- Edge functions are public for n8n integration but validate data
- All user actions are authenticated and authorized
- Real-time subscriptions respect user permissions

## Deployment

The app is deployed automatically through Lovable. Edge functions deploy with your code changes.

## Support

For issues or questions about the SMS workflow integration:
1. Check the Supabase Edge Function logs
2. Verify n8n webhook configurations  
3. Test API endpoints with the provided cURL examples
4. Review the conversation flow in the dashboard

The existing Twilio/n8n SMS automation remains unchanged - this dashboard provides the frontend and data management layer.
