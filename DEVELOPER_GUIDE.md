# Developer Guide - Enhanced BYLROS Platform

## Quick Start

### Using the Caching System

```typescript
import { cache, getCacheKey } from '../utils/cacheUtils';

// Set cache
const key = getCacheKey('customers', 'list', status);
cache.set(key, data, 5 * 60 * 1000); // 5 minutes

// Get from cache
const cachedData = cache.get(key);

// Invalidate cache
cache.invalidate(key);

// Invalidate by pattern
cache.invalidatePattern('customers:.*');
```

### Error Handling

```typescript
import { getErrorMessage, retryOperation } from '../utils/errorHandling';

try {
  const result = await retryOperation(
    () => supabase.from('customers').select(),
    3, // max retries
    1000 // delay in ms
  );
} catch (error) {
  const message = getErrorMessage(error);
  console.error(message);
}
```

### Form Validation

```typescript
import { validateForm, required, email, minLength } from '../utils/validation';

const rules = {
  name: [required(), minLength(3)],
  email: [required(), email()],
};

const { isValid, errors } = validateForm(formData, rules);

if (!isValid) {
  console.log(errors); // { name: 'Error message', ... }
}
```

### Pagination

```typescript
import { calculatePagination, applyFilters } from '../utils/paginationUtils';

const { from, to } = calculatePagination(total, page, pageSize);

let query = supabase
  .from('customers')
  .select('*', { count: 'exact' });

// Apply filters
const filters = [
  { field: 'status', operator: 'eq', value: 'active' },
  { field: 'created_at', operator: 'gte', value: '2024-01-01' }
];

query = applyFilters(query, filters);

// Apply pagination
query = query.range(from, to);

const { data, error, count } = await query;
```

### Formatting

```typescript
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatStatus
} from '../utils/formatters';

formatCurrency(1234.56); // "AED 1,234.56"
formatDate(new Date(), 'long'); // "December 26, 2024"
formatRelativeTime(date); // "2h ago"
formatStatus('in_progress'); // "In Progress"
```

---

## Database Access

### Using Materialized Views

```typescript
// Get dashboard stats
const { data: stats } = await supabase
  .from('dashboard_stats')
  .select('*')
  .maybeSingle();

// Get recent activity
const { data: activity } = await supabase
  .from('recent_activity')
  .select('*')
  .limit(10);

// Refresh views (admin only)
await supabase.rpc('refresh_dashboard_stats');
await supabase.rpc('refresh_recent_activity');
```

### Analytics Events

```typescript
// Track an event
await supabase
  .from('analytics_events')
  .insert({
    event_type: 'user_action',
    event_name: 'quote_created',
    user_id: userId,
    entity_type: 'quote',
    entity_id: quoteId,
    metadata: { amount: 1000, customer_name: 'John' }
  });
```

### Activity Logging

```typescript
// Log an activity
await supabase
  .from('activity_log')
  .insert({
    user_id: userId,
    action: 'created_quote',
    entity_type: 'quote',
    entity_id: quoteId,
    metadata: { quote_number: 'Q-2024-001' },
    ip_address: ipAddress,
    user_agent: userAgent
  });
```

---

## Workflow Automation

### Creating a Workflow Rule

```typescript
await supabase
  .from('workflow_rules')
  .insert({
    name: 'Auto-approve small quotes',
    description: 'Automatically approve quotes under AED 5000',
    trigger_type: 'quote_created',
    trigger_conditions: {
      amount: { lte: 5000 }
    },
    actions: [
      {
        type: 'update_status',
        params: { status: 'approved' }
      },
      {
        type: 'send_notification',
        params: { template: 'quote_approved' }
      }
    ],
    is_active: true,
    priority: 10
  });
```

### Executing Workflows

```typescript
// Log workflow execution
await supabase
  .from('workflow_executions')
  .insert({
    rule_id: ruleId,
    entity_type: 'quote',
    entity_id: quoteId,
    status: 'completed',
    result: { status_updated: true, notification_sent: true }
  });
```

---

## Payment Plans

### Creating a Payment Plan

```typescript
const totalAmount = 10000;
const installments = 4;
const installmentAmount = totalAmount / installments;

// Create plan
const { data: plan } = await supabase
  .from('payment_plans')
  .insert({
    invoice_id: invoiceId,
    customer_id: customerId,
    total_amount: totalAmount,
    number_of_installments: installments,
    installment_amount: installmentAmount,
    frequency: 'monthly',
    start_date: '2024-01-01',
    status: 'active'
  })
  .select()
  .single();

// Create installments
const installmentRecords = [];
for (let i = 0; i < installments; i++) {
  const dueDate = new Date('2024-01-01');
  dueDate.setMonth(dueDate.getMonth() + i);

  installmentRecords.push({
    payment_plan_id: plan.id,
    installment_number: i + 1,
    due_date: dueDate.toISOString().split('T')[0],
    amount: installmentAmount,
    status: 'pending'
  });
}

await supabase
  .from('payment_installments')
  .insert(installmentRecords);
```

### Recording Installment Payment

```typescript
await supabase
  .from('payment_installments')
  .update({
    status: 'paid',
    paid_date: new Date().toISOString(),
    payment_method: 'credit_card',
    transaction_id: 'txn_123456'
  })
  .eq('id', installmentId);
```

---

## API Keys & Webhooks

### Creating an API Key

```typescript
import { createHash } from 'crypto';

const apiKey = generateSecureToken(); // Your implementation
const keyHash = createHash('sha256').update(apiKey).digest('hex');
const keyPrefix = apiKey.substring(0, 8);

await supabase
  .from('api_keys')
  .insert({
    name: 'Integration API Key',
    key_hash: keyHash,
    key_prefix: keyPrefix,
    permissions: ['read:customers', 'write:quotes'],
    is_active: true,
    expires_at: '2025-12-31',
    created_by: userId
  });

// Return the key to user ONCE (never show again)
return { apiKey, keyPrefix };
```

### Creating a Webhook

```typescript
await supabase
  .from('webhooks')
  .insert({
    name: 'Order Created Webhook',
    url: 'https://example.com/webhooks/order-created',
    events: ['order.created', 'order.updated'],
    secret: 'whsec_...',
    is_active: true,
    retry_count: 3,
    timeout_seconds: 30,
    created_by: userId
  });
```

### Logging Webhook Delivery

```typescript
await supabase
  .from('webhook_deliveries')
  .insert({
    webhook_id: webhookId,
    event_type: 'order.created',
    payload: orderData,
    status: 'delivered',
    response_code: 200,
    response_body: 'OK',
    attempts: 1,
    delivered_at: new Date().toISOString()
  });
```

---

## Tags & Categories

### Adding Tags to Entities

```typescript
// Create tag
const { data: tag } = await supabase
  .from('tags')
  .insert({
    name: 'VIP Customer',
    color: '#dc2626'
  })
  .select()
  .single();

// Tag an entity
await supabase
  .from('entity_tags')
  .insert({
    entity_type: 'customer',
    entity_id: customerId,
    tag_id: tag.id
  });

// Get all tags for an entity
const { data: tags } = await supabase
  .from('entity_tags')
  .select('tag_id, tags(*)')
  .eq('entity_type', 'customer')
  .eq('entity_id', customerId);
```

---

## Customer Segmentation

### Creating a Dynamic Segment

```typescript
await supabase
  .from('customer_segments')
  .insert({
    name: 'High Value Customers',
    description: 'Customers with >AED 50,000 lifetime value',
    criteria: {
      lifetime_value: { gte: 50000 },
      status: { eq: 'active' },
      last_purchase_days: { lte: 90 }
    },
    is_dynamic: true,
    created_by: userId
  });
```

### Adding Customers to Segment

```typescript
await supabase
  .from('customer_segment_members')
  .insert({
    segment_id: segmentId,
    customer_id: customerId
  });
```

---

## Document Versioning

### Creating a Version

```typescript
await supabase
  .from('document_versions')
  .insert({
    entity_type: 'quote',
    entity_id: quoteId,
    version_number: 2,
    data: quoteData,
    changed_by: userId,
    change_summary: 'Updated pricing and added discount'
  });
```

### Getting Version History

```typescript
const { data: versions } = await supabase
  .from('document_versions')
  .select('*')
  .eq('entity_type', 'quote')
  .eq('entity_id', quoteId)
  .order('version_number', { ascending: false });
```

---

## Reminders

### Creating a Reminder

```typescript
await supabase
  .from('reminders')
  .insert({
    title: 'Follow up with customer',
    description: 'Check if they received the quote',
    entity_type: 'quote',
    entity_id: quoteId,
    remind_at: '2024-12-27 10:00:00',
    assigned_to: userId,
    created_by: userId
  });
```

### Getting Due Reminders

```typescript
const { data: reminders } = await supabase
  .from('reminders')
  .select('*')
  .eq('assigned_to', userId)
  .eq('is_completed', false)
  .lte('remind_at', new Date().toISOString())
  .order('remind_at', { ascending: true });
```

---

## Custom Reports

### Creating a Report

```typescript
await supabase
  .from('custom_reports')
  .insert({
    name: 'Monthly Sales Report',
    description: 'Sales breakdown by product category',
    report_type: 'sales',
    config: {
      groupBy: 'category',
      aggregate: 'sum',
      field: 'amount'
    },
    filters: {
      date_range: 'last_30_days',
      status: ['completed', 'paid']
    },
    columns: ['category', 'total_amount', 'order_count'],
    created_by: userId,
    is_public: false
  });
```

---

## Best Practices

### 1. Always Use Caching for Expensive Queries

```typescript
const key = getCacheKey('dashboard', 'stats');
let stats = cache.get(key);

if (!stats) {
  const { data } = await supabase
    .from('dashboard_stats')
    .select('*')
    .maybeSingle();

  stats = data;
  cache.set(key, stats, 2 * 60 * 1000);
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  // Your operation
} catch (error) {
  const message = getErrorMessage(error);
  // Show user-friendly error
  toast.error(message);
  // Log for debugging
  console.error('Operation failed:', error);
}
```

### 3. Use Pagination for Large Datasets

```typescript
// Always paginate lists
const pageSize = 50;
const { from, to } = calculatePagination(count, page, pageSize);

const { data } = await supabase
  .from('customers')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### 4. Validate Before Submitting

```typescript
const rules = {
  email: [required(), email()],
  amount: [required(), positiveNumber()],
};

const { isValid, errors } = validateForm(formData, rules);

if (!isValid) {
  setFormErrors(errors);
  return;
}

// Proceed with submission
```

### 5. Log Important Actions

```typescript
// Track analytics
await supabase.from('analytics_events').insert({
  event_type: 'business_action',
  event_name: 'quote_sent',
  user_id: userId,
  entity_type: 'quote',
  entity_id: quoteId
});

// Log activity
await supabase.from('activity_log').insert({
  user_id: userId,
  action: 'sent_quote',
  entity_type: 'quote',
  entity_id: quoteId
});
```

### 6. Use Indexes Effectively

```typescript
// Good - Uses index
.eq('status', 'pending')
.eq('customer_id', customerId)

// Bad - Doesn't use index efficiently
.or('status.eq.pending,status.eq.approved')
```

### 7. Refresh Materialized Views Periodically

```typescript
// Set up a cron job or run manually when needed
await supabase.rpc('refresh_dashboard_stats');
await supabase.rpc('refresh_recent_activity');
```

---

## Performance Tips

1. **Use `.maybeSingle()` for single row queries** - Avoids throwing errors
2. **Limit SELECT columns** - Only fetch what you need
3. **Use composite indexes** - For common multi-column queries
4. **Cache aggressively** - Especially for dashboard and stats
5. **Paginate everything** - Never load all rows at once
6. **Use materialized views** - For expensive aggregations
7. **Monitor slow queries** - Check `query_performance_log` table

---

## Security Checklist

- ✅ All tables have RLS enabled
- ✅ Policies check `auth.uid()` for user data
- ✅ API keys are hashed, never stored in plain text
- ✅ All mutations are logged in activity_log
- ✅ Sensitive operations require authentication
- ✅ Input validation on all forms
- ✅ SQL injection prevention via parameterized queries

---

## Deployment Checklist

- [ ] Run database migrations
- [ ] Refresh materialized views
- [ ] Test RLS policies
- [ ] Verify API key generation
- [ ] Test webhook deliveries
- [ ] Check cache performance
- [ ] Review error logs
- [ ] Monitor query performance
- [ ] Set up periodic view refresh
- [ ] Configure backup schedule

---

## Support

For questions or issues:
1. Check this guide first
2. Review `IMPLEMENTATION_SUMMARY.md`
3. Check database migration files
4. Review utility function documentation
5. Contact the development team
