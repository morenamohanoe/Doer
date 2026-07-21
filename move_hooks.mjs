import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const hookContent = `  const filteredNotifications = React.useMemo(() => {
    return notifications?.filter(n => {
    // Apply Global User Preferences first
    if (n.type === 'booking' && !notificationSettings.jobUpdates) return false;
    if (n.type === 'message' && !notificationSettings.messages) return false;
    if (n.type === 'payment' && !notificationSettings.payments) return false;
    if (n.type === 'promo' && !notificationSettings.promotions) return false;

    if (activeNotificationCategory === 'All') return true;
    if (activeNotificationCategory === 'High Priority') return n.type === 'alert' || n.type === 'HIGH';
    // Mapping internal types to categories
    if (activeNotificationCategory === 'System') return n.type === 'system' || n.type === 'info';
    if (activeNotificationCategory === 'Jobs') return n.type === 'booking';
    if (activeNotificationCategory === 'Messages') return n.type === 'message';
    if (activeNotificationCategory === 'Payments') return n.type === 'payment';
    return true;
  });
  }, [notifications, notificationSettings, activeNotificationCategory]);

  const handleClearAll = React.useCallback(() => {
    if (!notifications || notifications.length === 0) {
      showToast("No notifications to clear", 'info');
      return;
    }
    
    // Perform clear
    clearAllNotifications();
    showToast("Notifications cleared", 'info');
    setIsNotificationOpen(false);
    triggerSound('click');
  }, [notifications, clearAllNotifications, showToast, triggerSound]);

  const handleOpenNotifications = React.useCallback(() => {
    triggerSound('click');
    setIsNotificationOpen(true);
  }, [triggerSound]);

  const handleNotificationClick = React.useCallback((n: any) => {
    markAsRead(n.id);
    triggerSound('click');
    setIsNotificationOpen(false);

    if (n.actionUrl) {
      // Improved navigation logic
      const url = n.actionUrl.toLowerCase();
      if (url === '/chats' || url.includes('/chat') || url === 'conversations') setTab('conversations');
      else if (url === '/profile' || url === 'profile') setTab('profile');
      else if (url === '/stats' || url === '/dashboard' || url === 'dashboard') setTab('dashboard');
      else if (url === '/home' || url === 'home') setTab('home');
      else if (url === '/wallet' || url === 'wallet') setTab('wallet');
      else if (url === '/admin' || url === 'admin') setTab('admin');
      else setTab('home'); // default
    } else {
      // Intelligent fallback based on content
      const msg = (n.message || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      
      if (title.includes('message') || title.includes('chat') || msg.includes('sent you a message') || msg.includes('new message')) {
        setTab('conversations');
      } else if (title.includes('booking') || title.includes('job') || msg.includes('booking') || msg.includes('appointment') || msg.includes('request')) {
        setTab('dashboard');
      } else if (title.includes('wallet') || title.includes('payment') || title.includes('topped up') || msg.includes('wallet') || msg.includes('payment') || msg.includes('withdrawn')) {
        setTab('wallet');
      } else if (title.includes('portfolio') || title.includes('published') || title.includes('profile')) {
        setTab('profile');
      } else if (title.includes('system') || title.includes('admin')) {
        setTab('admin');
      }
    }
  }, [markAsRead, triggerSound, setTab]);`;

const earlyReturns = `  if (authLoading || loadingProfile) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Welcome />;
  }

  // Only route to onboarding if profile is explicitly not completed
  if (!profile || !profile.profileCompleted) {
    return <Onboarding />;
  }`;

content = content.replace(hookContent, '');
content = content.replace(earlyReturns, `${hookContent}\n\n${earlyReturns}`);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx patched to move hooks');
