import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Fix checkInterval for upcoming job completions
content = content.replace(
  `  // Check for upcoming job completions
  useEffect(() => {
    if (!currentUser) return;
    
    const checkInterval = setInterval(() => {
      const now = new Date();
      const inProgressRequests = serviceRequests.filter(r => 
        r.status === 'in_progress' && 
        r.scheduledCompletionTime &&
        (r.bookingOwnerId === currentUser.id || r.doerId === currentUser.id)
      );`,
  `  // Check for upcoming job completions
  const currentUserRef = useRef(currentUser);
  const serviceRequestsRef = useRef(serviceRequests);

  useEffect(() => {
    currentUserRef.current = currentUser;
    serviceRequestsRef.current = serviceRequests;
  }, [currentUser, serviceRequests]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const currentUsr = currentUserRef.current;
      if (!currentUsr) return;
      
      const now = new Date();
      const inProgressRequests = (serviceRequestsRef.current || []).filter(r => 
        r.status === 'in_progress' && 
        r.scheduledCompletionTime &&
        (r.bookingOwnerId === currentUsr.id || r.doerId === currentUsr.id)
      );`
);

content = content.replace(
  `    return () => clearInterval(checkInterval);
  }, [serviceRequests, currentUser]);`,
  `    return () => clearInterval(checkInterval);
  }, []);`
);

fs.writeFileSync('src/context/AppContext.tsx', content, 'utf8');
console.log('AppContext.tsx checkInterval patched');
