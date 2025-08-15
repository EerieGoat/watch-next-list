import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Users, MessageCircle, Clock, Copy, Check, Play, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';

interface WatchPartyRoom {
  id: string;
  name: string;
  creator: string;
  creatorEmail: string;
  movie?: MediaItem;
  participants: string[];
  messages: { user: string; message: string; timestamp: number }[];
  currentTime: number;
  isPlaying: boolean;
  createdAt: number;
}

interface SharedWatchlist {
  id: string;
  name: string;
  creator: string;
  creatorEmail: string;
  items: MediaItem[];
  isPublic: boolean;
  createdAt: number;
}

const FriendsWatchTogether = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [watchlist] = useLocalStorage<MediaItem[]>('watchlist', []);
  
  // Watch Party State
  const [watchParties, setWatchParties] = useLocalStorage<WatchPartyRoom[]>('watchParties', []);
  const [currentParty, setCurrentParty] = useState<WatchPartyRoom | null>(null);
  const [partyName, setPartyName] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<MediaItem | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  
  // Shared Watchlist State
  const [sharedWatchlists, setSharedWatchlists] = useLocalStorage<SharedWatchlist[]>('sharedWatchlists', []);
  const [shareListName, setShareListName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const createWatchParty = () => {
    if (!user || !partyName.trim() || !selectedMovie) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a movie/show",
        variant: "destructive",
      });
      return;
    }

    const newParty: WatchPartyRoom = {
      id: Math.random().toString(36).substr(2, 9),
      name: partyName,
      creator: user.email || 'Anonymous',
      creatorEmail: user.email || '',
      movie: selectedMovie,
      participants: [user.email || ''],
      messages: [],
      currentTime: 0,
      isPlaying: false,
      createdAt: Date.now(),
    };

    setWatchParties(prev => [...prev, newParty]);
    setCurrentParty(newParty);
    setPartyName('');
    setSelectedMovie(null);

    toast({
      title: "Watch Party Created!",
      description: `Room "${newParty.name}" is ready. Share the room ID: ${newParty.id}`,
    });
  };

  const joinWatchParty = () => {
    if (!user || !joinRoomId.trim()) return;

    const party = watchParties.find(p => p.id === joinRoomId);
    if (!party) {
      toast({
        title: "Room Not Found",
        description: "Please check the room ID and try again",
        variant: "destructive",
      });
      return;
    }

    if (!party.participants.includes(user.email || '')) {
      const updatedParty = {
        ...party,
        participants: [...party.participants, user.email || '']
      };
      
      setWatchParties(prev => prev.map(p => p.id === party.id ? updatedParty : p));
      setCurrentParty(updatedParty);
    } else {
      setCurrentParty(party);
    }

    setJoinRoomId('');
    toast({
      title: "Joined Watch Party!",
      description: `Welcome to "${party.name}"`,
    });
  };

  const sendMessage = () => {
    if (!currentParty || !chatMessage.trim() || !user) return;

    const newMessage = {
      user: user.email || 'Anonymous',
      message: chatMessage,
      timestamp: Date.now()
    };

    const updatedParty = {
      ...currentParty,
      messages: [...currentParty.messages, newMessage]
    };

    setWatchParties(prev => prev.map(p => p.id === currentParty.id ? updatedParty : p));
    setCurrentParty(updatedParty);
    setChatMessage('');
  };

  const shareWatchlist = () => {
    if (!user || !shareListName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your shared watchlist",
        variant: "destructive",
      });
      return;
    }

    const newSharedList: SharedWatchlist = {
      id: Math.random().toString(36).substr(2, 9),
      name: shareListName,
      creator: user.email || 'Anonymous',
      creatorEmail: user.email || '',
      items: watchlist,
      isPublic,
      createdAt: Date.now(),
    };

    setSharedWatchlists(prev => [...prev, newSharedList]);
    setShareListName('');

    toast({
      title: "Watchlist Shared!",
      description: `Your watchlist "${newSharedList.name}" is now shareable`,
    });
  };

  const copyShareLink = (listId: string) => {
    const link = `${window.location.origin}/?shared-list=${listId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(listId);
    
    setTimeout(() => setCopiedLink(null), 2000);
    
    toast({
      title: "Link Copied!",
      description: "Share this link with your friends",
    });
  };

  const copyRoomId = (roomId: string) => {
    navigator.clipboard.writeText(roomId);
    setCopiedLink(roomId);
    
    setTimeout(() => setCopiedLink(null), 2000);
    
    toast({
      title: "Room ID Copied!",
      description: "Share this with friends to join your watch party",
    });
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Friends & Watch Together
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Sign in to create watch parties and share your watchlist with friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Friends & Watch Together
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create watch parties and share your watchlist with friends
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="watch-party" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="watch-party">Watch Parties</TabsTrigger>
            <TabsTrigger value="shared-lists">Shared Lists</TabsTrigger>
          </TabsList>

          <TabsContent value="watch-party" className="space-y-6">
            {!currentParty ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Create Party */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Create Watch Party</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Party name"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                      />
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            {selectedMovie ? selectedMovie.title : "Select Movie/Show"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Choose from Your Watchlist</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {watchlist.map((item) => (
                              <div
                                key={item.id}
                                className={`cursor-pointer p-2 rounded-lg border transition-colors ${
                                  selectedMovie?.id === item.id 
                                    ? 'border-primary bg-primary/10' 
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedMovie(item)}
                              >
                                <div className="aspect-[2/3] mb-2 rounded overflow-hidden bg-muted">
                                  {item.poster && (
                                    <img
                                      src={item.poster}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {item.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button onClick={createWatchParty} className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Create Party
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Join Party */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Join Watch Party</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Enter room ID"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                      />
                      <Button onClick={joinWatchParty} variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Join Party
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Active Parties */}
                {watchParties.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Watch Parties</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {watchParties.map((party) => (
                        <Card key={party.id} className="cursor-pointer hover:border-primary/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{party.name}</h4>
                              <Badge variant="secondary">{party.participants.length} members</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Watching: {party.movie?.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => setCurrentParty(party)} 
                                size="sm"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Join
                              </Button>
                              <Button 
                                onClick={() => copyRoomId(party.id)} 
                                variant="outline" 
                                size="sm"
                              >
                                {copiedLink === party.id ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <Copy className="h-3 w-3 mr-1" />
                                )}
                                Share ID
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Active Watch Party View
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{currentParty.name}</h3>
                  <Button onClick={() => setCurrentParty(null)} variant="outline">
                    Leave Party
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    {currentParty.movie && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-24 h-36 bg-muted rounded overflow-hidden flex-shrink-0">
                              {currentParty.movie.poster && (
                                <img
                                  src={currentParty.movie.poster}
                                  alt={currentParty.movie.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">{currentParty.movie.title}</h4>
                              <Badge className="mb-2">{currentParty.movie.type}</Badge>
                              <p className="text-sm text-muted-foreground mb-4">
                                {currentParty.movie.genres?.join(', ')} • Released in {currentParty.movie.year}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button size="sm">
                                  <Play className="h-4 w-4 mr-2" />
                                  Sync Play
                                </Button>
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {Math.floor(currentParty.currentTime / 60)}:{(currentParty.currentTime % 60).toString().padStart(2, '0')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Chat ({currentParty.participants.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-48 overflow-y-auto space-y-2 border rounded p-2">
                          {currentParty.messages.map((msg, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{msg.user.split('@')[0]}:</span>
                              <span className="ml-2">{msg.message}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          />
                          <Button onClick={sendMessage} size="sm">
                            Send
                          </Button>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-2">Participants:</p>
                          <div className="space-y-1">
                            {currentParty.participants.map((email, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{email.split('@')[0]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared-lists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Your Watchlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Give your shared list a name"
                  value={shareListName}
                  onChange={(e) => setShareListName(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label htmlFor="public" className="text-sm">Make public</label>
                </div>
                <Button onClick={shareWatchlist}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Watchlist ({watchlist.length} items)
                </Button>
              </CardContent>
            </Card>

            {sharedWatchlists.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Shared Lists</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {sharedWatchlists.map((list) => (
                    <Card key={list.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{list.name}</h4>
                          <Badge variant={list.isPublic ? "default" : "secondary"}>
                            {list.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {list.items.length} items • Created {new Date(list.createdAt).toLocaleDateString()}
                        </p>
                        <Button 
                          onClick={() => copyShareLink(list.id)} 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
                          {copiedLink === list.id ? (
                            <Check className="h-3 w-3 mr-2" />
                          ) : (
                            <Copy className="h-3 w-3 mr-2" />
                          )}
                          Copy Share Link
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FriendsWatchTogether;