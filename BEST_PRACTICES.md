# 🛠️ Development Best Practices

## Code Style Guide

### TypeScript/JavaScript

#### Variable Naming
```typescript
// ✅ Good
const userProfile = await fetchUserProfile();
const isLoading = false;
const MAX_RETRIES = 3;

// ❌ Avoid
const up = await fetchUserProfile();
const loading = false;
const max_retries = 3;
```

#### Component Structure
```typescript
// Import order
import { useState, useEffect } from 'react';
import { useRouter } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import supabase from '@/utils/supabase';

// Interface definitions
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// Component
const MyComponent = ({ title, onAction }: ComponentProps) => {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
  
  // Functions
  const handleAction = () => {};
  
  // Render
  return <div>{title}</div>;
};

export default MyComponent;
```

### React Patterns

#### useState Usage
```typescript
// ✅ Good
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<string[]>([]);

// ❌ Avoid
const [data, setData] = useState();  // No type
const [x, setX] = useState(false);   // Poor naming
```

#### useEffect Cleanup
```typescript
// ✅ Good - with cleanup
useEffect(() => {
  const subscription = someService.subscribe();
  return () => subscription.unsubscribe();
}, [dependency]);

// ❌ Avoid - memory leak
useEffect(() => {
  const subscription = someService.subscribe();
  // No cleanup
}, [dependency]);
```

#### Error Handling
```typescript
// ✅ Good
try {
  const result = await fetchData();
  setData(result);
} catch (error) {
  console.error('Error fetching data:', error);
  toast.error('Failed to load data');
  setError(error instanceof Error ? error.message : 'Unknown error');
} finally {
  setLoading(false);
}

// ❌ Avoid
const result = await fetchData();  // No error handling
setData(result);
```

## Supabase Integration

### Query Best Practices
```typescript
// ✅ Good
const { data, error } = await supabase
  .from('users')
  .select('id, username, profile:profiles(*)')
  .eq('id', userId)
  .single();

if (error) throw error;
if (!data) return null;

// ❌ Avoid
const result = await supabase.from('users').select('*');
// No error checking, fetches all columns
```

### Real-time Subscriptions
```typescript
// ✅ Good
useEffect(() => {
  const subscription = supabase
    .from('messages')
    .on('INSERT', (payload) => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => {
    supabase.removeSubscription(subscription);
  };
}, []);

// ❌ Avoid
// Subscription without cleanup - memory leak
```

## Component Design

### Props Definition
```typescript
// ✅ Good
interface UserCardProps {
  user: User;
  onSelect?: (userId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const UserCard = ({ user, onSelect, isLoading, className }: UserCardProps) => {
  // Component code
};

// ❌ Avoid
const UserCard = (props: any) => {  // No interface, any type
  // Component code
};
```

### Reusable Components
```typescript
// ✅ Good - reusable
const LoadingSpinner = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg', className?: string }) => (
  <div className={`spinner spinner-${size} ${className}`} />
);

// ❌ Avoid - hardcoded
const UserList = () => {
  return (
    <div>
      <div className="spinner spinner-md" />
      {/* Component specific code */}
    </div>
  );
};
```

## Performance Optimization

### useCallback
```typescript
// ✅ Good - memoized callback
const handleUserSelect = useCallback((userId: string) => {
  setSelectedUserId(userId);
}, []);

// ❌ Avoid - recreated on every render
const handleUserSelect = (userId: string) => {
  setSelectedUserId(userId);
};
```

### useMemo
```typescript
// ✅ Good - memoized expensive computation
const filteredUsers = useMemo(() => {
  return users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [users, searchTerm]);

// ❌ Avoid - recomputed every render
const filteredUsers = users.filter(user => 
  user.name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### React.memo
```typescript
// ✅ Good - prevent unnecessary re-renders
const UserCard = React.memo(({ user, onClick }: UserCardProps) => {
  return <div onClick={() => onClick(user.id)}>{user.name}</div>;
});

export default UserCard;
```

## Styling

### Tailwind Classes
```typescript
// ✅ Good - organized and readable
<div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
  <h3 className="text-lg font-semibold">Title</h3>
  <Button variant="outline" size="sm">Action</Button>
</div>

// ❌ Avoid - inconsistent formatting
<div className="flex items-center justify-between p-4 rounded-lg border bg-card border-border">
  {/* Hard to read */}
</div>
```

### CSS-in-JS (if needed)
```typescript
// ✅ Good
const containerStyles = "flex items-center justify-between p-4";
const textStyles = "text-lg font-semibold text-foreground";

<div className={containerStyles}>
  <h3 className={textStyles}>Title</h3>
</div>

// ❌ Avoid
<div style={{ display: 'flex', padding: '16px' }}>
  {/* Inline styles break Tailwind benefits */}
</div>
```

## Testing Mindset

### Code for Testability
```typescript
// ✅ Good - testable
export const calculateTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Use in component
const total = calculateTotal(cartItems);

// ❌ Avoid - coupled to component
const Component = () => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
};
```

## Documentation

### Component Documentation
```typescript
/**
 * UserCard displays user information with action buttons
 * 
 * @param {UserCardProps} props - Component props
 * @param {User} props.user - User object to display
 * @param {Function} [props.onSelect] - Callback when user is selected
 * @param {boolean} [props.isLoading] - Loading state
 * 
 * @example
 * <UserCard 
 *   user={currentUser}
 *   onSelect={(id) => console.log(id)}
 *   isLoading={false}
 * />
 */
interface UserCardProps {
  user: User;
  onSelect?: (userId: string) => void;
  isLoading?: boolean;
}

const UserCard = ({ user, onSelect, isLoading }: UserCardProps) => {
  // Implementation
};
```

## Git Workflow

### Commit Messages
```bash
# ✅ Good
git commit -m "feat: add user profile editor component"
git commit -m "fix: resolve notification panel z-index issue"
git commit -m "docs: update installation guide"
git commit -m "refactor: simplify Layout component state management"

# ❌ Avoid
git commit -m "update"
git commit -m "fix stuff"
git commit -m "WIP"
```

### Branch Naming
```bash
# ✅ Good
feature/user-profile-editor
fix/notification-panel-zindex
docs/installation-guide

# ❌ Avoid
dev
fix1
feature-whatever
```

## Common Mistakes to Avoid

### 1. Missing Dependencies in useEffect
```typescript
// ❌ Bad
useEffect(() => {
  handleLoad(userId);  // userId not in dependencies
}, []);

// ✅ Good
useEffect(() => {
  handleLoad(userId);
}, [userId]);
```

### 2. State as Direct Assignment
```typescript
// ❌ Bad
const user = state;
user.name = 'New Name';
setState(user);  // Won't trigger re-render

// ✅ Good
setState({ ...state, name: 'New Name' });
```

### 3. Array/Object Inline Creation
```typescript
// ❌ Bad
<Component items={items.filter(i => i.active)} />  // New array every render

// ✅ Good
const activeItems = useMemo(() => 
  items.filter(i => i.active), 
  [items]
);
<Component items={activeItems} />
```

### 4. Missing Error Boundaries
```typescript
// ✅ Good
<ErrorBoundary fallback={<ErrorPage />}>
  <YourComponent />
</ErrorBoundary>

// ❌ Bad
<YourComponent />  // Crashes break entire page
```

## Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Error handling is present
- [ ] No console.log statements (except logging service)
- [ ] Props are properly typed
- [ ] useEffect dependencies are correct
- [ ] No infinite loops
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Component is reusable
- [ ] Accessibility is considered
- [ ] Comments explain "why", not "what"

---

**Follow these practices to maintain code quality and consistency!**
