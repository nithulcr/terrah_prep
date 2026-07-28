# Mock Test System - Architecture Refactoring Summary

## Problem
The mock test system was failing with "Failed to start test" error and returning empty error objects `{}`. The root cause was that service files were importing the browser Supabase client (`@/lib/supabase/client`) but being called from Next.js API routes which require the server-side Supabase client.

## Solution
Complete refactoring to use dependency injection for Supabase client throughout the application.

## Changes Made

### 1. Service Files Refactored
All service files now accept `SupabaseClient` as the first parameter:

- ✅ `src/lib/services/mock-tests.service.ts` - Core mock test operations
- ✅ `src/lib/services/settings.service.ts` - App settings management
- ✅ `src/lib/services/usage.service.ts` - User usage tracking
- ✅ `src/lib/services/test-sets.service.ts` - Test set management
- ✅ `src/lib/services/profile.service.ts` - User profile operations
- ✅ `src/lib/services/subscription.service.ts` - Subscription management
- ✅ `src/lib/services/payment.service.ts` - Payment processing
- ✅ `src/lib/services/question.service.ts` - Question CRUD operations

### 2. API Routes Updated
All API routes now create server-side Supabase client and pass it to services:

- ✅ `src/app/api/mock-tests/route.ts` - GET available tests
- ✅ `src/app/api/mock-tests/[testNumber]/start/route.ts` - POST start test
- ✅ `src/app/api/test/start/route.ts` - POST start legacy test
- ✅ `src/app/api/test/submit/route.ts` - POST submit test
- ✅ `src/app/api/test-sets/route.ts` - GET test sets
- ✅ `src/app/api/test-sets/stats/route.ts` - GET test set stats
- ✅ `src/app/api/test-sets/[id]/start/route.ts` - POST start test set
- ✅ `src/app/api/admin/test-sets/generate/route.ts` - POST generate test sets
- ✅ `src/app/api/analytics/route.ts` - GET analytics
- ✅ `src/app/api/bookmarks/route.ts` - GET/POST/DELETE bookmarks
- ✅ `src/app/api/pdf/export/route.ts` - POST export PDF

### 3. Client-Side Code Updated
Client-side components and hooks now pass browser Supabase client:

- ✅ `src/lib/auth/auth-provider.tsx` - Auth context provider
- ✅ `src/lib/hooks/use-subscription.ts` - Subscription hooks
- ✅ `src/lib/contexts/settings-context.tsx` - Settings context (uses backward-compatible method)

### 4. Enhanced Error Logging
Every database operation now includes comprehensive logging:

```typescript
// Before each query
console.log('=== operationName ===');
console.log('Parameters:', params);

// After each query
console.log('Query Result - Data:', data);
console.log('Query Error - Operation:', error);

// On error
console.error('Error in operation:', error);
```

### 5. Improved Error Handling
All catch blocks now:
- Log the actual error with `console.error()`
- Return the real Supabase error message instead of generic messages
- Never swallow errors silently

```typescript
// Before
return { success: false, error: 'Failed to start test' };

// After
return { success: false, error: testResultError.message };
```

### 6. Detailed Debugging Logs

#### startTest() - Test Results Insertion
Logs:
- userId
- batchId
- testNumber
- Insert data
- Query result
- Query error with full details (message, details, hint, code)

#### getTestQuestions() - Question Selection
Logs:
- batchId
- testNumber
- shuffleQuestions
- Settings loaded
- Questions by category (count and name)
- Category question settings
- Per category:
  - Available questions
  - Questions per category
  - Category offset and limit
  - Selected questions count
  - Warnings if no questions selected
- Total selected vs expected questions

#### canAccessTest() - Access Control
Logs:
- userId
- batchId
- testNumber
- Usage data (subscription and plan)
- User plan
- Existing test result check
- Decision and reason

## Architecture Changes

### Before (Broken)
```typescript
// Service imports browser client
import { supabase } from '@/lib/supabase/client';

export const mockTestsService = {
  async startTest(userId, batchId, testNumber) {
    // Uses browser client in API route - FAILS!
    const { data, error } = await supabase.from('test_results').insert(...)
  }
}

// API route calls without passing client
await mockTestsService.startTest(user.id, batchId, testNumber);
```

### After (Fixed)
```typescript
// Service accepts client as parameter
export const mockTestsService = {
  async startTest(supabase: SupabaseClient, userId, batchId, testNumber) {
    // Uses passed client - WORKS!
    const { data, error } = await supabase.from('test_results').insert(...)
  }
}

// API route creates server client and passes it
const supabase = createClient(...);
await mockTestsService.startTest(supabase, user.id, batchId, testNumber);
```

## Benefits

1. **Proper Server-Side Architecture**: Services use the correct Supabase client for the context
2. **Better Error Messages**: Actual database errors are returned instead of generic messages
3. **Comprehensive Debugging**: Detailed logs help identify issues quickly
4. **Type Safety**: TypeScript ensures correct client is passed
5. **Testability**: Services can be easily tested with mock Supabase clients
6. **No More Silent Failures**: Every error is logged and reported

## Testing

To verify the fix:

1. Check console logs when starting a test - you should see detailed logs for:
   - `startTest` - test_results insertion
   - `canAccessTest` - access control check
   - `getTestQuestions` - question selection

2. If any query fails, you'll see:
   - The exact SQL being executed
   - Parameters being passed
   - Returned data
   - Returned error with full details

3. The API will now return actual Supabase error messages instead of "Failed to start test"

## Migration Guide for Future Development

When creating new service methods:

```typescript
// ✅ CORRECT - Accept supabase client as first parameter
async myMethod(supabase: SupabaseClient, param1: string, param2: number) {
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('id', param1);
  
  console.log('Query Result:', data);
  console.log('Query Error:', error);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

// ❌ WRONG - Don't import browser client
import { supabase } from '@/lib/supabase/client';

async myMethod(param1: string, param2: number) {
  // This will fail in API routes!
}
```

When calling service methods from API routes:

```typescript
// ✅ CORRECT - Create server client and pass it
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const result = await myService.myMethod(supabase, param1, param2);

// ❌ WRONG - Don't call without passing client
const result = await myService.myMethod(param1, param2);
```

## Status
✅ All services refactored
✅ All API routes updated
✅ TypeScript compilation passing
✅ Comprehensive error logging implemented
✅ No silent catch blocks
✅ Ready for testing