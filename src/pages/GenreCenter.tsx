import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Star, 
  Calendar, 
  ArrowLeft, 
  Film, 
  Tv, 
  TrendingUp,
  Filter,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';
import MovieDetailModal from '@/components/MovieDetailModal';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  overview: string;
}

interface TVShow {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  overview: string;
}

interface Genre {
  id: number;
  name: string;
}

const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // Working TMDB API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const movieGenres: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

const tvGenres: Genre[] = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' }
];

const GenreCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeGenre, setActiveGenre] = useState<Genre>(movieGenres[0]);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'release_date'>('popularity');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const [selectedMovie, setSelectedMovie] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);

  const currentGenres = activeTab === 'movies' ? movieGenres : tvGenres;
  const currentContent = activeTab === 'movies' ? movies : tvShows;

  // Fetch content by genre with pagination
  const fetchContentByGenre = async (genreId: number, type: 'movies' | 'tv', page: number = 1, reset: boolean = true) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';
      const sortParam = sortBy === 'rating' ? 'vote_average.desc' : 
                       sortBy === 'release_date' ? (type === 'movies' ? 'release_date.desc' : 'first_air_date.desc') : 
                       'popularity.desc';
      
      const response = await fetch(
        `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=${sortParam}&page=${page}&vote_count.gte=10`
      );
      
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
      
      // Update pagination state
      setCurrentPage(page);
      setHasMore(results.length === 20 && page < 50); // TMDB has max 500 pages, we limit to 50 for performance
      
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more content
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || searchQuery.trim()) return;
    
    const nextPage = currentPage + 1;
    await fetchContentByGenre(activeGenre.id, activeTab, nextPage, false);
  };

  // Search content with pagination
  const searchContent = async (query: string, type: 'movies' | 'tv', page: number = 1, reset: boolean = true) => {
    if (!query.trim()) return;
    
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const endpoint = type === 'movies' ? 'search/movie' : 'search/tv';
      const response = await fetch(
        `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
      );
      
      if (!response.ok) throw new Error('Failed to search');
      
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
      setHasMore(results.length === 20 && page < 20); // Limit search results to 20 pages
      
    } catch (error) {
      console.error('Error searching content:', error);
      toast({
        title: "Error",
        description: "Failed to search content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Handle genre change
  const handleGenreChange = (genre: Genre) => {
    setActiveGenre(genre);
    setSearchQuery('');
    setCurrentPage(1);
    setHasMore(true);
    fetchContentByGenre(genre.id, activeTab);
  };

  // Handle tab change
  const handleTabChange = (tab: 'movies' | 'tv') => {
    setActiveTab(tab);
    const newGenres = tab === 'movies' ? movieGenres : tvGenres;
    const newActiveGenre = newGenres[0];
    setActiveGenre(newActiveGenre);
    setSearchQuery('');
    setCurrentPage(1);
    setHasMore(true);
    fetchContentByGenre(newActiveGenre.id, tab);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setHasMore(true);
    if (searchQuery.trim()) {
      searchContent(searchQuery, activeTab);
    } else {
      fetchContentByGenre(activeGenre.id, activeTab);
    }
  };

  // Handle sort change - this now properly refreshes content
  const handleSortChange = (newSort: 'popularity' | 'rating' | 'release_date') => {
    setSortBy(newSort);
    setCurrentPage(1);
    setHasMore(true);
    // Always trigger a new search with current filters
    setTimeout(() => {
      if (searchQuery.trim()) {
        searchContent(searchQuery, activeTab);
      } else {
        fetchContentByGenre(activeGenre.id, activeTab);
      }
    }, 0);
  };

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Initial load
  useEffect(() => {
    fetchContentByGenre(activeGenre.id, activeTab);
  }, []);

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
            <h1 className="text-2xl font-bold">Genre Center</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="movies" className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Movies
              </TabsTrigger>
              <TabsTrigger value="tv" className="flex items-center gap-2">
                <Tv className="h-4 w-4" />
                TV Shows
              </TabsTrigger>
            </TabsList>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline">
                  Search
                </Button>
              </form>
              
              <div className="flex gap-2">
                <Button 
                  variant={sortBy === 'popularity' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleSortChange('popularity')}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Popular
                </Button>
                <Button 
                  variant={sortBy === 'rating' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleSortChange('rating')}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Rating
                </Button>
                <Button 
                  variant={sortBy === 'release_date' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => handleSortChange('release_date')}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Latest
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="movies" className="space-y-6">
            <GenreContent 
              genres={movieGenres}
              activeGenre={activeGenre}
              onGenreChange={handleGenreChange}
              content={movies}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onItemClick={(id) => setSelectedMovie({ id, type: 'movie' })}
              type="movies"
            />
          </TabsContent>

          <TabsContent value="tv" className="space-y-6">
            <GenreContent 
              genres={tvGenres}
              activeGenre={activeGenre}
              onGenreChange={handleGenreChange}
              content={tvShows}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onItemClick={(id) => setSelectedMovie({ id, type: 'tv' })}
              type="tv"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          open={!!selectedMovie}
          onOpenChange={(open) => !open && setSelectedMovie(null)}
          movieId={selectedMovie.id}
          mediaType={selectedMovie.type}
        />
      )}
    </div>
  );
};

// Genre Content Component
interface GenreContentProps {
  genres: Genre[];
  activeGenre: Genre;
  onGenreChange: (genre: Genre) => void;
  content: (Movie | TVShow)[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onItemClick: (id: number) => void;
  type: 'movies' | 'tv';
}

const GenreContent: React.FC<GenreContentProps> = ({
  genres,
  activeGenre,
  onGenreChange,
  content,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onItemClick,
  type
}) => {
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const { toast } = useToast();

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const addToWatchlist = (item: Movie | TVShow) => {
    const title = 'title' in item ? item.title : item.name;
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
    const genres = item.genre_ids.map(id => {
      const genreMap: Record<number, string> = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
        99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
        27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western', 10759: 'Action & Adventure',
        10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
        10767: 'Talk', 10768: 'War & Politics'
      };
      return genreMap[id];
    }).filter(Boolean);

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title,
      type: type === 'movies' ? 'movie' : 'tv',
      status: 'plan-to-watch',
      genres,
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

  return (
    <div className="space-y-6">
      {/* Genre Pills */}
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Badge
            key={genre.id}
            variant={activeGenre.id === genre.id ? 'default' : 'outline'}
            className={`cursor-pointer transition-all hover:scale-105 ${
              activeGenre.id === genre.id ? 'bg-primary text-primary-foreground' : 'hover:border-primary/50'
            }`}
            onClick={() => onGenreChange(genre)}
          >
            {genre.name}
          </Badge>
        ))}
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <div className="aspect-[2/3] bg-muted rounded-md"></div>
              <CardContent className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : content.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {content.map((item) => {
              const title = 'title' in item ? item.title : item.name;
              const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
              const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
              
              return (
                <Card 
                  key={item.id} 
                  className="glass-card hover:border-primary/30 transition-all hover:scale-105 group cursor-pointer"
                  onClick={() => onItemClick(item.id)}
                >
                  <div className="relative overflow-hidden rounded-t-lg group">
                    <img
                      src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'}
                      alt={title}
                      className="aspect-[2/3] object-cover w-full group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Mini Trailer Hover Effect - Premium Feature */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Play Button Animation */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <div className="w-6 h-6 border-l-8 border-t-4 border-b-4 border-l-white border-t-transparent border-b-transparent ml-1" />
                        </div>
                      </div>

                      {/* Animated waves effect */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                        <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border border-white/20 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.1s' }} />
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current text-yellow-500" />
                      <span className={`text-xs font-medium ${getRatingColor(item.vote_average)}`}>
                        {item.vote_average.toFixed(1)}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-xs w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWatchlist(item);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to List
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground">{year}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button 
                onClick={onLoadMore} 
                disabled={isLoadingMore}
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
              >
                {isLoadingMore ? (
                  'Loading...'
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More {type === 'movies' ? 'Movies' : 'TV Shows'}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No {type} found for this genre.</p>
        </div>
      )}
    </div>
  );
};

export default GenreCenter;