import { useState, useMemo } from 'react';
import { MediaItem, WatchStatus, UserStats } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaCard } from '@/components/MediaCard';
import { AddMediaDialog } from '@/components/AddMediaDialog';
import { StatsCard } from '@/components/StatsCard';
import PremiumUpsellModal from '@/components/PremiumUpsellModal';
import UserMenu from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Plus, Search, Film, Tv, Star, Eye, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import RandomRecommendation from '@/components/RandomRecommendation';
import SmartRecommendations from '@/components/SmartRecommendations';
import TrendingInMyCountry from '@/components/TrendingInMyCountry';
import FriendsWatchTogether from '@/components/FriendsWatchTogether';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, session, subscription, refreshSubscription } = useAuth();
  useUrlParams(); // Handle URL parameters for verification and payment callbacks
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | undefined>();
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const { toast } = useToast();

  const isPremium = subscription?.subscription_status === 'active';
  const FREE_LIMIT = 10;

  // Calculate stats
  const stats: UserStats = useMemo(() => {
    const finished = mediaItems.filter(item => item.status === 'finished');
    const ratings = finished.filter(item => item.rating).map(item => item.rating!);
    
    return {
      totalWatched: finished.length,
      totalWatching: mediaItems.filter(item => item.status === 'watching').length,
      totalPlanned: mediaItems.filter(item => item.status === 'plan-to-watch').length,
      averageRating: ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0
    };
  }, [mediaItems]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    return mediaItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [mediaItems, searchQuery, filterType]);

  const itemsByStatus = useMemo(() => {
    return {
      'watching': filteredItems.filter(item => item.status === 'watching'),
      'plan-to-watch': filteredItems.filter(item => item.status === 'plan-to-watch'),
      'finished': filteredItems.filter(item => item.status === 'finished')
    };
  }, [filteredItems]);

  const handleAddItem = (newItem: Omit<MediaItem, 'id' | 'dateAdded'>) => {
    // Check limit for free users
    if (!isPremium && mediaItems.length >= FREE_LIMIT) {
      setShowUpsellModal(true);
      return;
    }

    const item: MediaItem = {
      ...newItem,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString()
    };
    setMediaItems(prev => [item, ...prev]);
    toast({
      title: "Added to collection",
      description: `"${item.title}" has been added to your ${item.status.replace('-', ' ')} list.`,
    });
  };

  const handleUpgrade = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade to premium.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Starting checkout process with token:', session.access_token ? 'Token present' : 'No token');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });
      
      console.log('Checkout response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.url) {
        console.log('Redirecting to checkout URL:', data.url);
        window.location.href = data.url;
        setShowUpsellModal(false);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (updatedItem: Omit<MediaItem, 'id' | 'dateAdded'>) => {
    if (!editingItem) return;
    
    const item: MediaItem = {
      ...updatedItem,
      id: editingItem.id,
      dateAdded: editingItem.dateAdded
    };
    
    setMediaItems(prev => prev.map(i => i.id === item.id ? item : i));
    setEditingItem(undefined);
    toast({
      title: "Updated successfully",
      description: `"${item.title}" has been updated.`,
    });
  };

  const handleDeleteItem = (id: string) => {
    const item = mediaItems.find(i => i.id === id);
    setMediaItems(prev => prev.filter(i => i.id !== id));
    toast({
      title: "Removed from collection",
      description: item ? `"${item.title}" has been removed.` : "Item removed.",
      variant: "destructive",
    });
  };

  const openEditDialog = (item: MediaItem) => {
    setEditingItem(item);
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingItem(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-40 fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/42df6338-8d77-43b2-a715-9d055ebff7b5.png" 
                alt="Binge Site Logo" 
                className="h-16 md:h-20 w-auto transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/trending">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10 transition-all duration-300 hover-lift text-xs sm:text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Trending</span>
                </Button>
              </Link>
              <Link to="/genre-center">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10 transition-all duration-300 hover-lift text-xs sm:text-sm">
                  <Film className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Browse</span>
                </Button>
              </Link>
              <RandomRecommendation />
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-accent-purple transition-all duration-300 hover-lift btn-glow text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Media</span>
                <span className="sm:hidden">Add</span>
                {!isPremium && <span className="hidden md:inline"> ({FREE_LIMIT - mediaItems.length} left)</span>}
              </Button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 slide-up">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="fade-in" style={{animationDelay: '0.1s'}}>
            <StatsCard
              title="Total Watched"
              value={stats.totalWatched}
              icon={<CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />}
            />
          </div>
          <div className="fade-in" style={{animationDelay: '0.2s'}}>
            <StatsCard
              title="Currently Watching"
              value={stats.totalWatching}
              icon={<Eye className="w-5 h-5 md:w-6 md:h-6 text-primary" />}
            />
          </div>
          <div className="fade-in" style={{animationDelay: '0.3s'}}>
            <StatsCard
              title="Plan to Watch"
              value={stats.totalPlanned}
              icon={<Clock className="w-5 h-5 md:w-6 md:h-6 text-primary" />}
            />
          </div>
          <div className="fade-in" style={{animationDelay: '0.4s'}}>
            <StatsCard
              title="Average Rating"
              value={stats.averageRating || '—'}
              subtitle={stats.averageRating ? '/10' : 'No ratings yet'}
              gradient
              icon={<Star className="w-5 h-5 md:w-6 md:h-6 text-white" />}
            />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search titles or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="movie">Movies Only</SelectItem>
              <SelectItem value="tv">TV Shows Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <Tabs defaultValue="watching" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="watching" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Eye className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Watching</span>
              <span className="sm:hidden">Watch</span>
              ({itemsByStatus.watching.length})
            </TabsTrigger>
            <TabsTrigger value="plan-to-watch" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Plan to Watch</span>
              <span className="sm:hidden">Plan</span>
              ({itemsByStatus['plan-to-watch'].length})
            </TabsTrigger>
            <TabsTrigger value="finished" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Finished</span>
              <span className="sm:hidden">Done</span>
              ({itemsByStatus.finished.length})
            </TabsTrigger>
          </TabsList>

          {(['watching', 'plan-to-watch', 'finished'] as WatchStatus[]).map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {itemsByStatus[status].length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    {status === 'watching' && <Eye className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />}
                    {status === 'plan-to-watch' && <Clock className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />}
                    {status === 'finished' && <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No items in {status.replace('-', ' ')}</h3>
                  <p className="text-muted-foreground mb-4 text-sm md:text-base">
                    {status === 'watching' && "Start tracking what you're currently watching"}
                    {status === 'plan-to-watch' && "Add titles you want to watch later"}
                    {status === 'finished' && "Mark items as finished to see them here"}
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {itemsByStatus[status].map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Smart Recommendations for all users */}
        <SmartRecommendations />

        {/* Trending in My Country */}
        <TrendingInMyCountry />

        {/* Premium Features */}
        {subscription?.subscription_status === 'active' && (
          <div className="space-y-6">
            <FriendsWatchTogether />
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddMediaDialog
        open={isAddDialogOpen}
        onOpenChange={closeDialog}
        onSave={editingItem ? handleEditItem : handleAddItem}
        editItem={editingItem}
      />
      
      {/* Premium Upsell Modal */}
      <PremiumUpsellModal
        open={showUpsellModal}
        onOpenChange={setShowUpsellModal}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Index;