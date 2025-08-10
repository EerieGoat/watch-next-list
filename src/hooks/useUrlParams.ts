import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useUrlParams = () => {
  const { toast } = useToast();
  const { refreshSubscription } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle email verification
    if (urlParams.get('verified') === 'true') {
      toast({
        title: "Email verified!",
        description: "Your account has been successfully verified. You can now use all features.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Handle payment success
    if (urlParams.get('payment') === 'success') {
      toast({
        title: "Payment successful!",
        description: "Welcome to Premium! Your subscription is now active.",
      });
      // Refresh subscription status
      refreshSubscription();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Handle payment cancellation
    if (urlParams.get('payment') === 'cancelled') {
      toast({
        title: "Payment cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, refreshSubscription]);
};