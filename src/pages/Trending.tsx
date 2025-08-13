import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Star, Calendar, TrendingUp, Film, Tv, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';
import axios from 'axios';

// TMDB API key (public, can be stored in code)
const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

interface TrendingResponse {
  results: TMDBItem[];
}

const genreMap: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
  10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

const Trending = () => {
  const [movieTrending, setMovieTrending] = useState<TMDBItem[]>([]);
  const [tvTrending, setTvTrending] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        // Fetch multiple pages to get 100 items each
        const moviePages = await Promise.all([
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=1`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=2`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=3`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=4`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=5`)
        ]);
        
        const tvPages = await Promise.all([
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=1`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=2`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=3`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=4`),
          axios.get<TrendingResponse>(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=5`)
        ]);
        
        const allMovies = moviePages.flatMap(page => page.data.results);
        const allTvShows = tvPages.flatMap(page => page.data.results);
        
        setMovieTrending(allMovies.slice(0, 100));
        setTvTrending(allTvShows.slice(0, 100));
      } catch (error) {
        console.error('Error fetching trending data:', error);
        toast({
          title: "Error",
          description: "Failed to load trending titles",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, [toast]);

  const isInCollection = (tmdbId: number, type: 'movie' | 'tv') => {
    return mediaItems.some(item => 
      item.title === (type === 'movie' ? movieTrending : tvTrending).find(t => t.id === tmdbId)?.title || 
      item.title === (type === 'movie' ? movieTrending : tvTrending).find(t => t.id === tmdbId)?.name
    );
  };

  const addToCollection = (tmdbItem: TMDBItem, type: 'movie' | 'tv') => {
    const title = tmdbItem.title || tmdbItem.name || '';
    const year = tmdbItem.release_date || tmdbItem.first_air_date ? 
      new Date(tmdbItem.release_date || tmdbItem.first_air_date || '').getFullYear() : undefined;
    const genres = tmdbItem.genre_ids.map(id => genreMap[id]).filter(Boolean);

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title,
      type,
      status: 'plan-to-watch',
      genres,
      year,
      poster: tmdbItem.poster_path ? `${TMDB_IMAGE_BASE_URL}${tmdbItem.poster_path}` : undefined,
      dateAdded: new Date().toISOString(),
      notes: tmdbItem.overview
    };

    setMediaItems(prev => [newItem, ...prev]);
    toast({
      title: "Added to collection",
      description: `"${title}" has been added to your plan to watch list.`,
    });
  };

  const TrendingCard = ({ item, type }: { item: TMDBItem; type: 'movie' | 'tv' }) => {
    const title = item.title || item.name || '';
    const year = item.release_date || item.first_air_date ? 
      new Date(item.release_date || item.first_air_date || '').getFullYear() : null;
    const genres = item.genre_ids.slice(0, 3).map(id => genreMap[id]).filter(Boolean);
    const inCollection = isInCollection(item.id, type);

    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="relative">
          <img
            src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'}
            alt={title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              onClick={() => addToCollection(item, type)}
              disabled={inCollection}
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
            >
              {inCollection ? (
                <>Already in Collection</>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to List
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {item.vote_average.toFixed(1)}
            </div>
          </div>
          
          {year && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {year}
            </div>
          )}
          
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs px-2 py-0">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground line-clamp-3">{item.overview}</p>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent-purple bg-clip-text text-transparent">
                  Trending Now
                </h1>
                <p className="text-muted-foreground text-sm">Discover what's popular this week</p>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted h-64 rounded-lg mb-3" />
                <div className="bg-muted h-4 rounded mb-2" />
                <div className="bg-muted h-3 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent-purple bg-clip-text text-transparent flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Trending Now
              </h1>
              <p className="text-muted-foreground text-sm">Discover what's popular this week</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="movies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film className="w-4 h-4" />
              Movies ({movieTrending.length})
            </TabsTrigger>
            <TabsTrigger value="tv" className="flex items-center gap-2">
              <Tv className="w-4 h-4" />
              TV Shows ({tvTrending.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movieTrending.map((movie) => (
                <TrendingCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tv">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvTrending.map((show) => (
                <TrendingCard key={show.id} item={show} type="tv" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Trending;