import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Memoize filteredNotifications
content = content.replace(
  `  const filteredNotifications = notifications?.filter(n => {`,
  `  const filteredNotifications = React.useMemo(() => {
    return notifications?.filter(n => {`
);

content = content.replace(
  `    if (activeNotificationCategory === 'Payments') return n.type === 'payment';
    return true;
  });`,
  `    if (activeNotificationCategory === 'Payments') return n.type === 'payment';
    return true;
  });
  }, [notifications, notificationSettings, activeNotificationCategory]);`
);

// 2. useCallback for handleClearAll
content = content.replace(
  `  const handleClearAll = () => {`,
  `  const handleClearAll = React.useCallback(() => {`
);
content = content.replace(
  `    showToast("Notifications cleared", 'info');
    setIsNotificationOpen(false);
    triggerSound('click');
  };`,
  `    showToast("Notifications cleared", 'info');
    setIsNotificationOpen(false);
    triggerSound('click');
  }, [notifications, clearAllNotifications, showToast, triggerSound]);`
);

// 3. useCallback for handleOpenNotifications
content = content.replace(
  `  const handleOpenNotifications = () => {`,
  `  const handleOpenNotifications = React.useCallback(() => {`
);
content = content.replace(
  `    triggerSound('click');
    setIsNotificationOpen(true);
  };`,
  `    triggerSound('click');
    setIsNotificationOpen(true);
  }, [triggerSound]);`
);

// 4. useCallback for handleNotificationClick
content = content.replace(
  `  const handleNotificationClick = (n: any) => {`,
  `  const handleNotificationClick = React.useCallback((n: any) => {`
);

content = content.replace(
  `      } else if (title.includes('system') || title.includes('admin')) {
        setTab('admin');
      }
    }
  };`,
  `      } else if (title.includes('system') || title.includes('admin')) {
        setTab('admin');
      }
    }
  }, [markAsRead, triggerSound, setTab]);`
);

// 5. Fix wallet status polling interval
content = content.replace(
  `  // Periodic service-worker simulated polling effect to print active escrow telemetry logs
  React.useEffect(() => {
    const interval = setInterval(() => {
      const pendingOrHeld = (serviceRequests || []).filter(
        req => ['requested', 'accepted', 'deposit_paid'].includes(req.status)
      );
      console.log(
        \`%c[Escrow Sync Worker] Syncing transaction logs with Firestore... (\${pendingOrHeld.length} tracked escrow contracts in progress)\`,
        'color: #6366f1; font-family: monospace; font-size: 10px; font-weight: 600;'
      );
    }, 12000);
    return () => clearInterval(interval);
  }, [serviceRequests]);`,
  `  // Periodic service-worker simulated polling effect to print active escrow telemetry logs
  const serviceRequestsRef = React.useRef(serviceRequests);
  React.useEffect(() => {
    serviceRequestsRef.current = serviceRequests;
  }, [serviceRequests]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const pendingOrHeld = (serviceRequestsRef.current || []).filter(
        req => ['requested', 'accepted', 'deposit_paid'].includes(req.status)
      );
      console.log(
        \`%c[Escrow Sync Worker] Syncing transaction logs with Firestore... (\${pendingOrHeld.length} tracked escrow contracts in progress)\`,
        'color: #6366f1; font-family: monospace; font-size: 10px; font-weight: 600;'
      );
    }, 12000);
    return () => clearInterval(interval);
  }, []);`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx patched');
