import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Star, 
  Calendar, 
  Film, 
  Tv,
  Filter,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MovieDetailModal from './MovieDetailModal';
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

const genres = [
  { value: '', label: 'All Genres' },
  { value: '28', label: 'Action' },
  { value: '35', label: 'Comedy' },
  { value: '18', label: 'Drama' },
  { value: '27', label: 'Horror' },
  { value: '10749', label: 'Romance' },
  { value: '878', label: 'Sci-Fi' },
  { value: '53', label: 'Thriller' }
];

export const RecentlyAdded = () => {
  const [movies, setMovies] = useState<TMDBItem[]>([]);
  const [tvShows, setTVShows] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const { toast } = useToast();

  const fetchRecentlyAdded = async (type: 'movies' | 'tv', page: number = 1, reset: boolean = true) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';
      const releaseDate = new Date();
      releaseDate.setMonth(releaseDate.getMonth() - 6); // Last 6 months
      const releaseDateStr = releaseDate.toISOString().split('T')[0];
      
      let url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&sort_by=release_date.desc&page=${page}`;
      
      if (type === 'movies') {
        url += `&release_date.gte=${releaseDateStr}`;
      } else {
        url += `&first_air_date.gte=${releaseDateStr}`;
      }
      
      if (selectedGenre) {
        url += `&with_genres=${selectedGenre}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      const results = data.results || [];

      if (type === 'movies') {
        if (reset) {
          setMovies(results);
        } else {
          setMovies(prev => [...prev, ...results]);
        }
      } else {
        if (reset) {
          setTVShows(results);
        } else {
          setTVShows(prev => [...prev, ...results]);
        }
      }

      setCurrentPage(page);
      setHasMore(results.length === 20 && page < 20);

    } catch (error) {
      console.error('Error fetching recently added:', error);
      toast({
        title: "Error",
        description: "Failed to load recently added content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    await fetchRecentlyAdded(activeTab, nextPage, false);
  };

  const handleTabChange = (tab: 'movies' | 'tv') => {
    setActiveTab(tab);
    setCurrentPage(1);
    setHasMore(true);
    fetchRecentlyAdded(tab);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
    setHasMore(true);
    fetchRecentlyAdded(activeTab);
  };

  const addToWatchlist = (item: TMDBItem) => {
    const title = item.title || item.name || '';
    const year = item.release_date || item.first_air_date ? 
      new Date(item.release_date || item.first_air_date || '').getFullYear() : undefined;
    const itemGenres = item.genre_ids.map(id => genreMap[id]).filter(Boolean);

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title,
      type: activeTab === 'movies' ? 'movie' : 'tv',
      status: 'plan-to-watch',
      genres: itemGenres,
      year,
      poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : undefined,
      dateAdded: new Date().toISOString(),
      notes: item.overview
    };

    setMediaItems(prev => [newItem, ...prev]);
    toast({
      title: "Added to watchlist",
      description: `"${title}" has been added to your plan to watch list.`,
    });
  };

  const isInWatchlist = (item: TMDBItem) => {
    const title = item.title || item.name || '';
    return mediaItems.some(mediaItem => mediaItem.title === title);
  };

  useEffect(() => {
    fetchRecentlyAdded(activeTab);
  }, []);

  const RecentlyAddedCard = ({ item }: { item: TMDBItem }) => {
    const title = item.title || item.name || '';
    const year = item.release_date || item.first_air_date ? 
      new Date(item.release_date || item.first_air_date || '').getFullYear() : null;
    const itemGenres = item.genre_ids.slice(0, 2).map(id => genreMap[id]).filter(Boolean);
    const inWatchlist = isInWatchlist(item);

    return (
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
        onClick={() => setSelectedItem({ id: item.id, type: activeTab === 'movies' ? 'movie' : 'tv' })}
      >
        <div className="relative">
          <img
            src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'}
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            <span className="text-xs font-medium text-white">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                addToWatchlist(item);
              }}
              disabled={inWatchlist}
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
            >
              {inWatchlist ? (
                'In Watchlist'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to List
                </>
              )}
            </Button>
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{title}</h3>
          {year && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Calendar className="w-3 h-3" />
              {year}
            </div>
          )}
          {itemGenres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {itemGenres.map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs px-2 py-0">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2">{item.overview}</p>
        </CardContent>
      </Card>
    );
  };

  const currentContent = activeTab === 'movies' ? movies : tvShows;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Added
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="movies" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Movies
                </TabsTrigger>
                <TabsTrigger value="tv" className="flex items-center gap-2">
                  <Tv className="h-4 w-4" />
                  TV Shows
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedGenre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre.value} value={genre.value}>
                      {genre.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentContent.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {currentContent.map((item) => (
              <RecentlyAddedCard key={item.id} item={item} />
            ))}
          </div>
          
          {hasMore && (
            <div className="text-center">
              <Button 
                onClick={loadMore} 
                disabled={loadingMore}
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
              >
                {loadingMore ? (
                  'Loading...'
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recently added {activeTab} found.</p>
        </div>
      )}

      {/* Movie Detail Modal */}
      {selectedItem && (
        <MovieDetailModal
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          movieId={selectedItem.id}
          mediaType={selectedItem.type}
        />
      )}
    </div>
  );
};