import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SubscriptionChecker = () => {
  const { user, session, refreshSubscription } = useAuth();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !session) return;

      try {
        const { error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (!error) {
          await refreshSubscription();
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    // Check subscription on mount and when user changes
    if (user && session) {
      checkSubscription();
    }

    // Also check subscription every 30 seconds when user is active
    const interval = setInterval(() => {
      if (user && session && document.visibilityState === 'visible') {
        checkSubscription();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, session, refreshSubscription]);

  return null;
};

export default SubscriptionChecker;