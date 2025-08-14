import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Heart,
  User,
  Calendar,
  Link,
  Send,
  Star,
  Film,
  Tv,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface SharedItem {
  id: string;
  mediaItem: MediaItem;
  sharedBy: string;
  sharedAt: string;
  shareUrl: string;
  comments: Comment[];
  likes: number;
}

interface Comment {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

interface WatchPartyData {
  id: string;
  title: string;
  description: string;
  mediaItems: MediaItem[];
  createdBy: string;
  createdAt: string;
  shareUrl: string;
  participants: string[];
  comments: Comment[];
}

export const WatchParty = () => {
  const [mediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const [sharedItems, setSharedItems] = useLocalStorage<SharedItem[]>('shared-items', []);
  const [watchParties, setWatchParties] = useLocalStorage<WatchPartyData[]>('watch-parties', []);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);
  const [newPartyTitle, setNewPartyTitle] = useState('');
  const [newPartyDescription, setNewPartyDescription] = useState('');
  const [selectedPartyItems, setSelectedPartyItems] = useState<MediaItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activePartyId, setActivePartyId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateShareUrl = (id: string, type: 'item' | 'party') => {
    const domain = window.location.origin;
    return `${domain}/share/${type}/${id}`;
  };

  const shareItem = (item: MediaItem) => {
    const shareId = Date.now().toString();
    const shareUrl = generateShareUrl(shareId, 'item');
    
    const sharedItem: SharedItem = {
      id: shareId,
      mediaItem: item,
      sharedBy: user?.email || 'Anonymous',
      sharedAt: new Date().toISOString(),
      shareUrl,
      comments: [],
      likes: 0
    };

    setSharedItems(prev => [sharedItem, ...prev]);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Item shared!",
      description: "Share link copied to clipboard. Others can now see your recommendation!",
    });
    
    setShareDialogOpen(false);
    setSelectedItem(null);
  };

  const createWatchParty = () => {
    if (!newPartyTitle.trim() || selectedPartyItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add a title and select at least one item for your watch party.",
        variant: "destructive",
      });
      return;
    }

    const partyId = Date.now().toString();
    const shareUrl = generateShareUrl(partyId, 'party');
    
    const watchParty: WatchPartyData = {
      id: partyId,
      title: newPartyTitle,
      description: newPartyDescription,
      mediaItems: selectedPartyItems,
      createdBy: user?.email || 'Anonymous',
      createdAt: new Date().toISOString(),
      shareUrl,
      participants: [user?.email || 'Anonymous'],
      comments: []
    };

    setWatchParties(prev => [watchParty, ...prev]);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Watch party created!",
      description: "Share link copied to clipboard. Invite friends to join your watch party!",
    });
    
    // Reset form
    setNewPartyTitle('');
    setNewPartyDescription('');
    setSelectedPartyItems([]);
    setPartyDialogOpen(false);
  };

  const addComment = (targetId: string, isParty: boolean = false) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: user?.email?.split('@')[0] || 'Anonymous',
      message: newComment,
      timestamp: new Date().toISOString()
    };

    if (isParty) {
      setWatchParties(prev => prev.map(party => 
        party.id === targetId 
          ? { ...party, comments: [...party.comments, comment] }
          : party
      ));
    } else {
      setSharedItems(prev => prev.map(item => 
        item.id === targetId 
          ? { ...item, comments: [...item.comments, comment] }
          : item
      ));
    }

    setNewComment('');
    toast({
      title: "Comment added!",
      description: "Your comment has been shared with others.",
    });
  };

  const likeItem = (itemId: string) => {
    setSharedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, likes: item.likes + 1 }
        : item
    ));
  };

  const copyShareUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard.",
    });
  };

  const togglePartyItem = (item: MediaItem) => {
    setSelectedPartyItems(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        return prev.filter(p => p.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share a Movie or TV Show</DialogTitle>
              <DialogDescription>
                Choose an item from your watchlist to share with friends
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {mediaItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      selectedItem?.id === item.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {item.type === 'movie' ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
                        <div>
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.year}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => selectedItem && shareItem(selectedItem)}
                  disabled={!selectedItem}
                  className="flex-1"
                >
                  Share Selected Item
                </Button>
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={partyDialogOpen} onOpenChange={setPartyDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Watch Party
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create a Watch Party</DialogTitle>
              <DialogDescription>
                Create a curated list of movies and TV shows for group viewing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Watch party title..."
                value={newPartyTitle}
                onChange={(e) => setNewPartyTitle(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newPartyDescription}
                onChange={(e) => setNewPartyDescription(e.target.value)}
                rows={3}
              />
              
              <div>
                <h4 className="font-medium mb-2">Select Items ({selectedPartyItems.length})</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {mediaItems.map((item) => {
                    const selected = selectedPartyItems.find(p => p.id === item.id);
                    return (
                      <Card 
                        key={item.id} 
                        className={`cursor-pointer transition-all hover:border-primary/50 ${
                          selected ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => togglePartyItem(item)}
                      >
                        <CardContent className="p-2">
                          <div className="flex items-center gap-2">
                            {item.type === 'movie' ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs truncate">{item.title}</h4>
                              <p className="text-xs text-muted-foreground">{item.year}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createWatchParty} className="flex-1">
                  Create Watch Party
                </Button>
                <Button variant="outline" onClick={() => setPartyDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for different content */}
      <Tabs defaultValue="shared" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shared">Shared Items</TabsTrigger>
          <TabsTrigger value="parties">Watch Parties</TabsTrigger>
        </TabsList>

        <TabsContent value="shared" className="space-y-4">
          {sharedItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No shared items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Share your favorite movies and TV shows with friends!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sharedItems.map((shared) => (
                <Card key={shared.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {shared.mediaItem.poster && (
                          <img 
                            src={shared.mediaItem.poster} 
                            alt={shared.mediaItem.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                        )}
                        <div>
                          <CardTitle className="text-base">{shared.mediaItem.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <User className="h-3 w-3" />
                            {shared.sharedBy}
                            <Calendar className="h-3 w-3 ml-2" />
                            {new Date(shared.sharedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {shared.mediaItem.type === 'movie' ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
                            <Badge variant="secondary">{shared.mediaItem.type}</Badge>
                            {shared.mediaItem.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current text-yellow-500" />
                                <span className="text-sm">{shared.mediaItem.rating}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => likeItem(shared.id)}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {shared.likes}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyShareUrl(shared.shareUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {shared.mediaItem.notes && (
                      <p className="text-sm text-muted-foreground mb-4">{shared.mediaItem.notes}</p>
                    )}
                    
                    {/* Comments */}
                    <div className="space-y-3">
                      {shared.comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm font-medium">{comment.user}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addComment(shared.id)}
                        />
                        <Button 
                          size="sm"
                          onClick={() => addComment(shared.id)}
                          disabled={!newComment.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          {watchParties.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No watch parties yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create curated lists for group viewing experiences!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {watchParties.map((party) => (
                <Card key={party.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{party.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          {party.createdBy}
                          <Calendar className="h-3 w-3 ml-2" />
                          {new Date(party.createdAt).toLocaleDateString()}
                          <Users className="h-3 w-3 ml-2" />
                          {party.participants.length} participants
                        </div>
                        {party.description && (
                          <p className="text-sm text-muted-foreground mt-2">{party.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyShareUrl(party.shareUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Party Items */}
                      <div>
                        <h4 className="font-medium mb-2">Items ({party.mediaItems.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {party.mediaItems.map((item) => (
                            <div key={item.id} className="bg-muted/50 rounded-lg p-2">
                              <div className="flex items-center gap-2">
                                {item.type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-xs font-medium truncate">{item.title}</h5>
                                  <p className="text-xs text-muted-foreground">{item.year}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="space-y-3">
                        {party.comments.map((comment) => (
                          <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-3 w-3" />
                              <span className="text-sm font-medium">{comment.user}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.message}</p>
                          </div>
                        ))}
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={activePartyId === party.id ? newComment : ''}
                            onChange={(e) => {
                              setActivePartyId(party.id);
                              setNewComment(e.target.value);
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && addComment(party.id, true)}
                          />
                          <Button 
                            size="sm"
                            onClick={() => addComment(party.id, true)}
                            disabled={activePartyId !== party.id || !newComment.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};