import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Memoize removeToast
content = content.replace(
  `  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };`,
  `  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);`
);

// Memoize showToast
content = content.replace(
  `  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
    const id = \`toast-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };`,
  `  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
    const id = \`toast-\${Date.now()}-\${Math.random().toString(36).substring(2, 6)}\`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);`
);

// Memoize triggerSound
content = content.replace(
  `  const triggerSound = (type: 'click' | 'success' | 'notification' | 'cash') => {
    playSynthSound(type);
  };`,
  `  const triggerSound = useCallback((type: 'click' | 'success' | 'notification' | 'cash') => {
    playSynthSound(type);
  }, []);`
);

fs.writeFileSync('src/context/AppContext.tsx', content, 'utf8');
console.log('AppContext.tsx patched');
