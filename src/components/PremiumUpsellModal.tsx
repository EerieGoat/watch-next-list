import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Shield, Download } from 'lucide-react';

interface PremiumUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({
  open,
  onOpenChange,
  onUpgrade,
}) => {
  const features = [
    { icon: <Zap className="h-4 w-4" />, text: "Unlimited watchlist size" },
    { icon: <Crown className="h-4 w-4" />, text: "Multiple custom lists" },
    { icon: <Shield className="h-4 w-4" />, text: "No ads experience" },
    { icon: <Download className="h-4 w-4" />, text: "Export to CSV/PDF" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Unlock Unlimited Watchlists
          </DialogTitle>
          <DialogDescription className="text-base">
            You've reached the 10-item limit for free users.
            <br />
            Upgrade for only <span className="font-semibold text-primary">£2.50/month</span> to get unlimited access!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
                <Check className="h-4 w-4 text-primary ml-auto" />
              </div>
            ))}
          </div>
          
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <Badge variant="secondary" className="mb-2">
              Limited Time Offer
            </Badge>
            <p className="text-sm text-muted-foreground">
              Join thousands of users who've upgraded to Premium
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button onClick={onUpgrade} size="lg" className="w-full">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpsellModal;