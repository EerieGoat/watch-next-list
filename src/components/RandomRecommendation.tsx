import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Calendar, Shuffle, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';

interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
}

const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const genreMap: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

const RandomRecommendation = () => {
  const [recommendation, setRecommendation] = useState<TMDBItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const { toast } = useToast();

  const fetchRandomRecommendation = async () => {
    setIsLoading(true);
    try {
      // Get a random page (1-20) and random type (movie or tv)
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const isMovie = Math.random() > 0.5;
      const endpoint = isMovie ? 'discover/movie' : 'discover/tv';
      
      // Use various sorting methods for variety
      const sortOptions = ['popularity.desc', 'vote_average.desc', 'release_date.desc', 'revenue.desc'];
      const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
      
      const response = await fetch(
        `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&sort_by=${randomSort}&page=${randomPage}&vote_count.gte=100`
      );
      
      if (!response.ok) throw new Error('Failed to fetch recommendation');
      
      const data = await response.json();
      const results = data.results || [];
      
      if (results.length > 0) {
        // Pick a random item from the results
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomItem = results[randomIndex];
        setRecommendation(randomItem);
        setIsOpen(true);
      } else {
        throw new Error('No recommendations found');
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to get recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = () => {
    if (!recommendation) return;

    const title = recommendation.title || recommendation.name || '';
    const type = recommendation.title ? 'movie' : 'tv';
    const year = recommendation.release_date || recommendation.first_air_date ? 
      new Date(recommendation.release_date || recommendation.first_air_date || '').getFullYear() : undefined;
    const genres = recommendation.genre_ids.map(id => genreMap[id]).filter(Boolean);

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title,
      type,
      status: 'plan-to-watch',
      genres,
      year,
      poster: recommendation.poster_path ? `${TMDB_IMAGE_BASE_URL}${recommendation.poster_path}` : undefined,
      dateAdded: new Date().toISOString(),
      notes: recommendation.overview
    };

    setMediaItems(prev => [newItem, ...prev]);
    toast({
      title: "Added to watchlist",
      description: `"${title}" has been added to your plan to watch list.`,
    });
    setIsOpen(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <>
      <Button 
        onClick={fetchRandomRecommendation}
        disabled={isLoading}
        className="bg-gradient-to-r from-accent-purple to-primary hover:from-primary hover:to-accent-purple transition-all duration-300 hover-lift btn-glow"
      >
        <Shuffle className="w-4 h-4 mr-2" />
        {isLoading ? 'Finding...' : 'Random Pick'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-primary" />
              Random Recommendation
            </DialogTitle>
          </DialogHeader>
          
          {recommendation && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={recommendation.poster_path ? `${TMDB_IMAGE_BASE_URL}${recommendation.poster_path}` : '/placeholder.svg'}
                  alt={recommendation.title || recommendation.name}
                  className="w-full aspect-[3/4] object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className={`text-sm font-medium ${getRatingColor(recommendation.vote_average)}`}>
                    {recommendation.vote_average.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold">{recommendation.title || recommendation.name}</h3>
                  {(recommendation.release_date || recommendation.first_air_date) && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(recommendation.release_date || recommendation.first_air_date || '').getFullYear()}
                    </div>
                  )}
                </div>
                
                {recommendation.genre_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recommendation.genre_ids.slice(0, 3).map((genreId) => (
                      <Badge key={genreId} variant="secondary" className="text-xs">
                        {genreMap[genreId]}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {recommendation.overview}
                </p>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={addToWatchlist} className="flex-1 btn-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Watchlist
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RandomRecommendation;