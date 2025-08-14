# Client Onboarding System

## Complete Flow Documentation

### 1. User Registration & Payment
1. User visits landing page → clicks "Start subscription" 
2. Stripe checkout for $1,000/month subscription
3. User returns to `/auth?afterCheckout=1` 
4. User creates account with same email used for payment
5. `handle_new_user()` database trigger automatically:
   - Creates client record with unique ID
   - Creates client_config with default settings
   - Creates user profile with admin role
   - Sets up initial setup tracking

### 2. Authentication & Setup Detection
1. User logs in → redirected to `/dashboard`
2. `Index.tsx` loads and checks:
   - Subscription status via `SubscriptionContext`
   - Setup completion via `useClientSetup` hook
3. If setup incomplete → shows `OnboardingManager`
4. If subscription invalid → shows subscription required screen

### 3. Onboarding Wizard Flow
1. **Company Information Step**:
   - Company name, industry, domain
   - Updates client record via `markCompanySetupComplete()`
   - Marks "company" step as complete in tracking

2. **Twilio Configuration Step**:
   - Account SID, Auth Token, Phone Number
   - Stores credentials securely in Supabase secrets
   - Updates client_config via `markTwilioSetupComplete()`
   - Marks "twilio" step as complete in tracking

3. **Completion**:
   - All required steps marked complete
   - `is_setup_complete` flag set to true
   - User redirected to main dashboard

### 4. Database Schema

#### Setup Tracking Fields
- `clients.setup_steps`: JSONB tracking completion status
- `clients.onboarding_completed_at`: Timestamp of completion
- `clients.twilio_verified`: Boolean for credential validation
- `client_config.setup_completed`: Overall completion flag
- `client_config.setup_steps`: Detailed step tracking

#### Key Functions
- `update_setup_progress()`: Updates step completion status
- `get_setup_status()`: Retrieves current setup state
- `handle_new_user()`: Trigger for new user setup

### 5. Security & Validation

#### Access Control
- All setup functions require authentication
- RLS policies enforce client isolation
- Admin-only access for sensitive operations

#### Credential Security
- Twilio credentials stored in Supabase secrets
- No sensitive data in client-side code
- Validation via `validate-twilio` edge function

### 6. Components & Hooks

#### Core Components
- `OnboardingManager`: Controls setup flow
- `ClientSetupWizard`: Multi-step wizard UI
- `SetupProgress`: Progress tracking display

#### Key Hooks
- `useClientSetup`: Setup state management
- `useSubscription`: Subscription validation

### 7. Edge Functions
- `validate-twilio`: Validates Twilio credentials
- `check-subscription`: Verifies subscription status
- `create-checkout`: Stripe payment processing

### 8. Error Handling & Recovery

#### Setup Recovery
- Idempotent operations allow restarting setup
- Progress tracking enables partial completion
- Failed steps can be retried without losing progress

#### Common Issues
- Missing subscription → clear error message + checkout link
- Invalid Twilio credentials → validation with specific error
- Network issues → retry mechanism with loading states

### 9. Testing & Verification

#### Manual Testing Flow
1. Create new account via signup
2. Verify onboarding wizard appears
3. Complete company information step
4. Add valid Twilio credentials
5. Confirm redirect to dashboard
6. Verify all setup flags are correct

#### Database Verification
```sql
-- Check setup status for user
SELECT 
  c.setup_steps,
  c.is_setup_complete,
  cc.setup_completed,
  cc.twilio_configured
FROM clients c
JOIN profiles p ON c.created_by_user_id = p.user_id
JOIN client_config cc ON cc.client_id = p.client_id
WHERE p.user_id = 'USER_ID';
```

## System Benefits

✅ **Consistent State**: Single source of truth for setup progress
✅ **Security**: Proper credential storage and access control  
✅ **User Experience**: Clear progress indication and error handling
✅ **Maintainability**: Modular components and centralized state
✅ **Scalability**: Database-driven configuration supports multiple clients
✅ **Recovery**: Robust error handling and retry mechanisms

## Migration from Old System

The new system consolidates:
- Removed duplicate bootstrap function
- Unified client creation in trigger
- Added comprehensive setup tracking
- Enhanced security and validation
- Improved user experience flow