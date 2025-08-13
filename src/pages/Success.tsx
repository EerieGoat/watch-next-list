import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Success = () => {
  const { user, subscription, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isPremium = subscription?.subscription_status === 'active';

  useEffect(() => {
    // Refresh subscription status when the page loads
    if (user) {
      refreshSubscription();
    }

    // Show success toast
    toast({
      title: "Payment Successful!",
      description: "Welcome to Premium! Your subscription is now active.",
    });

    // Redirect to dashboard after 10 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [user, refreshSubscription, toast, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Success Animation */}
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <div className="relative bg-green-500/10 rounded-full w-24 h-24 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Welcome to Premium! Your subscription is now active.
            </p>
          </div>
        </div>

        {/* Premium Status Card */}
        <Card className="glass-card border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-3">
              <Badge variant="default" className="text-sm px-3 py-1">
                <Crown className="h-4 w-4 mr-1" />
                Premium Member
              </Badge>
              
              <div className="space-y-2">
                <h3 className="font-semibold">You now have access to:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Unlimited watchlist items
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Advanced filtering and search
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Export your watchlist data
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Priority customer support
                  </li>
                </ul>
              </div>
            </div>

            {isPremium && subscription?.subscription_end && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  <strong>Active until:</strong> {new Date(subscription.subscription_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link to="/" className="block">
            <Button className="w-full btn-glow">
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Link to="/settings" className="block">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-xs text-muted-foreground text-center">
          You'll be automatically redirected to your dashboard in 10 seconds.
        </p>
      </div>
    </div>
  );
};

export default Success;