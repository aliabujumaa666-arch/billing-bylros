# Performance Optimization Guide

Quick reference for maintaining optimal performance in the BYLROS platform.

## Component Creation

### Use Lazy Loading for Routes
```tsx
// ✅ Good
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));

// ❌ Bad
import { Dashboard } from './components/Dashboard';
```

### Memoize Expensive Components
```tsx
// ✅ Good
const StatCard = memo(({ label, value, icon }: Props) => {
  return <div>...</div>;
});

// ❌ Bad
const StatCard = ({ label, value, icon }: Props) => {
  return <div>...</div>;
};
```

### Use Memoization Hooks
```tsx
// ✅ Good - Memoize computed values
const statCards = useMemo(() => [
  { label: 'Total', value: stats.total },
  // ...
], [stats]);

// ✅ Good - Memoize callbacks
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);

// ❌ Bad - Recalculated on every render
const statCards = [
  { label: 'Total', value: stats.total },
];
```

## Database Queries

### Optimize Supabase Queries
```tsx
// ✅ Good - Count only
const { count } = await supabase
  .from('customers')
  .select('id', { count: 'exact', head: true });

// ✅ Good - Select specific fields
const { data } = await supabase
  .from('customers')
  .select('id, name, email');

// ❌ Bad - Fetches all data for count
const { data } = await supabase
  .from('customers')
  .select('*');
const count = data?.length;

// ❌ Bad - Fetches all fields
const { data } = await supabase
  .from('customers')
  .select('*');
```

### Batch Parallel Queries
```tsx
// ✅ Good - Parallel queries
const [customers, quotes, orders] = await Promise.all([
  supabase.from('customers').select('id', { count: 'exact', head: true }),
  supabase.from('quotes').select('id', { count: 'exact', head: true }),
  supabase.from('orders').select('id', { count: 'exact', head: true }),
]);

// ❌ Bad - Sequential queries
const customers = await supabase.from('customers').select('id', { count: 'exact', head: true });
const quotes = await supabase.from('quotes').select('id', { count: 'exact', head: true });
const orders = await supabase.from('orders').select('id', { count: 'exact', head: true });
```

## Loading States

### Always Show Loading States
```tsx
// ✅ Good
if (loading) {
  return <LoadingSpinner size="lg" fullScreen />;
}

return <div>{data}</div>;

// ❌ Bad - No loading feedback
return <div>{data || 'Loading...'}</div>;
```

### Use Suspense with Lazy Components
```tsx
// ✅ Good
<Suspense fallback={<LoadingSpinner fullScreen />}>
  <LazyComponent />
</Suspense>

// ❌ Bad - No fallback
<LazyComponent />
```

## List Rendering

### Use Keys Properly
```tsx
// ✅ Good - Stable unique ID
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// ❌ Bad - Array index as key
{items.map((item, index) => (
  <Item key={index} {...item} />
))}
```

### Avoid Inline Functions in Lists
```tsx
// ✅ Good
const handleClick = useCallback((id) => {
  doSomething(id);
}, []);

{items.map(item => (
  <Item key={item.id} onClick={() => handleClick(item.id)} />
))}

// ❌ Bad - New function on every render
{items.map(item => (
  <Item key={item.id} onClick={() => doSomething(item.id)} />
))}
```

## State Management

### Avoid Unnecessary State Updates
```tsx
// ✅ Good - Update only when needed
useEffect(() => {
  if (data && data !== prevData) {
    setProcessedData(process(data));
  }
}, [data]);

// ❌ Bad - Updates on every render
useEffect(() => {
  setProcessedData(process(data));
});
```

### Batch State Updates
```tsx
// ✅ Good - Single state object
const [stats, setStats] = useState({
  customers: 0,
  quotes: 0,
  orders: 0
});

setStats({
  customers: 10,
  quotes: 5,
  orders: 3
});

// ❌ Bad - Multiple state variables
const [customers, setCustomers] = useState(0);
const [quotes, setQuotes] = useState(0);
const [orders, setOrders] = useState(0);

setCustomers(10);
setQuotes(5);
setOrders(3);
```

## Component Structure

### Split Large Components
```tsx
// ✅ Good - Separate concerns
const Dashboard = () => {
  return (
    <>
      <DashboardHeader />
      <DashboardStats />
      <DashboardActions />
    </>
  );
};

// ❌ Bad - Everything in one component
const Dashboard = () => {
  return (
    <div>
      {/* 500 lines of code */}
    </div>
  );
};
```

## Import Optimization

### Use Specific Imports
```tsx
// ✅ Good - Import specific icons
import { User, Settings, LogOut } from 'lucide-react';

// ❌ Bad - Import entire library
import * as Icons from 'lucide-react';
```

### Dynamic Imports
```tsx
// ✅ Good - Load when needed
const PDFExport = lazy(() => import('./utils/pdfExport'));

// Only loads when button is clicked
<button onClick={async () => {
  const { exportPDF } = await import('./utils/pdfExport');
  exportPDF(data);
}}>
  Export PDF
</button>
```

## Common Pitfalls

### ❌ Avoid
1. Creating components inside components
2. Using inline styles excessively
3. Not cleaning up useEffect subscriptions
4. Fetching data on every render
5. Not using production builds
6. Ignoring React DevTools warnings

### ✅ Do
1. Use memo for expensive components
2. Use useMemo for computed values
3. Use useCallback for event handlers
4. Clean up subscriptions and timers
5. Test with production builds
6. Monitor performance with React DevTools

## Performance Checklist

Before deploying:
- [ ] All routes use lazy loading
- [ ] Components are memoized where appropriate
- [ ] Database queries are optimized
- [ ] Loading states are implemented
- [ ] No console warnings in production
- [ ] Bundle size is reasonable (<200KB initial)
- [ ] All images are optimized
- [ ] Build passes without errors
- [ ] Code is minified
- [ ] Gzip compression is enabled

## Tools

### Development
- React DevTools Profiler
- Chrome DevTools Performance tab
- Lighthouse CI
- Bundle Analyzer

### Monitoring
```bash
# Analyze bundle size
npm run build -- --report

# Check for unused dependencies
npx depcheck

# Audit packages
npm audit
```

## Quick Wins

1. **Enable production mode**: Always use production builds
2. **Add lazy loading**: Wrap routes in React.lazy()
3. **Use memo**: Wrap expensive components in memo()
4. **Optimize images**: Use WebP, compress, lazy load
5. **Code split**: Separate vendor and app code
6. **Cache assets**: Set proper cache headers
7. **Minify**: Use terser for JS, cssnano for CSS
8. **Tree shake**: Remove unused code
9. **Prefetch**: Prefetch critical resources
10. **Monitor**: Track Core Web Vitals

## Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Web Vitals](https://web.dev/vitals/)
- [Supabase Best Practices](https://supabase.com/docs/guides/performance)

---

**Remember**: Premature optimization is the root of all evil, but knowing these patterns helps you write performant code from the start!
