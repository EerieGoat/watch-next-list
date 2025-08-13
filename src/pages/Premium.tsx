import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, ArrowLeft, Sparkles, Zap, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Premium = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = subscription?.subscription_status === 'active';

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade to premium.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Unable to start the upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Unlimited Watchlist Items",
      description: "Add as many movies and TV shows as you want without limits"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Advanced Filtering",
      description: "Sort and filter your content by genre, rating, year, and more"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Export Your Data",
      description: "Download and backup your watchlist data anytime"
    },
    {
      icon: <Crown className="h-5 w-5" />,
      title: "Priority Support",
      description: "Get priority customer support and feature requests"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-border/50" />
            <h1 className="text-2xl font-bold">Premium</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {isPremium ? (
          // Already Premium User
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                <Crown className="h-5 w-5 mr-2" />
                Premium Member
              </Badge>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                You're Already Premium!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Thank you for being a Premium member. Enjoy unlimited access to all features.
              </p>
            </div>

            <Card className="glass-card max-w-md mx-auto">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="font-semibold">Your Subscription</h3>
                <p className="text-muted-foreground">
                  Active until {subscription?.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : 'N/A'}
                </p>
                <Link to="/settings">
                  <Button variant="outline" className="w-full">
                    Manage Subscription
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Upgrade Flow
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Limited Time Offer
              </Badge>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Upgrade to Premium
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Unlock unlimited watchlist items and advanced features to take your movie tracking to the next level.
              </p>
            </div>

            {/* Pricing Card */}
            <div className="flex justify-center">
              <Card className="glass-card border-primary/20 max-w-md w-full">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <div className="text-4xl font-bold mt-2">
                    $7.99
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="bg-primary/10 p-1 rounded-full flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{feature.title}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={handleUpgrade} 
                    disabled={isLoading}
                    className="w-full btn-glow text-lg py-6"
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Crown className="h-5 w-5 mr-2" />
                        Upgrade to Premium
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Cancel anytime. No questions asked.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card hover:border-primary/20 transition-colors">
                  <CardContent className="p-6 space-y-3">
                    <div className="bg-primary/10 p-2 rounded-lg w-fit">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Premium;