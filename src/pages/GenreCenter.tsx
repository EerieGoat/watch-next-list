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
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'release_date'>('popularity');

  const currentGenres = activeTab === 'movies' ? movieGenres : tvGenres;
  const currentContent = activeTab === 'movies' ? movies : tvShows;

  // Fetch content by genre
  const fetchContentByGenre = async (genreId: number, type: 'movies' | 'tv') => {
    setIsLoading(true);
    try {
      const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';
      const sortParam = sortBy === 'rating' ? 'vote_average.desc' : 
                       sortBy === 'release_date' ? (type === 'movies' ? 'release_date.desc' : 'first_air_date.desc') : 
                       'popularity.desc';
      
      const response = await fetch(
        `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=${sortParam}&page=1&page=2&page=3&vote_count.gte=10`
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      
      // Fetch additional pages for more variety
      const additionalPages = await Promise.all([
        fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=${sortParam}&page=2&vote_count.gte=10`),
        fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=${sortParam}&page=3&vote_count.gte=10`)
      ]);
      
      const additionalData = await Promise.all(
        additionalPages.map(res => res.ok ? res.json() : { results: [] })
      );
      
      const allResults = [
        ...(data.results || []),
        ...additionalData.flatMap(d => d.results || [])
      ];
      
      if (type === 'movies') {
        setMovies(allResults.slice(0, 60) || []);
      } else {
        setTVShows(allResults.slice(0, 60) || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Search content
  const searchContent = async (query: string, type: 'movies' | 'tv') => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const endpoint = type === 'movies' ? 'search/movie' : 'search/tv';
      const response = await fetch(
        `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`
      );
      
      if (!response.ok) throw new Error('Failed to search');
      
      const data = await response.json();
      
      if (type === 'movies') {
        setMovies(data.results || []);
      } else {
        setTVShows(data.results || []);
      }
    } catch (error) {
      console.error('Error searching content:', error);
      toast({
        title: "Error",
        description: "Failed to search content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle genre change
  const handleGenreChange = (genre: Genre) => {
    setActiveGenre(genre);
    setSearchQuery('');
    fetchContentByGenre(genre.id, activeTab);
  };

  // Handle tab change
  const handleTabChange = (tab: 'movies' | 'tv') => {
    setActiveTab(tab);
    const newGenres = tab === 'movies' ? movieGenres : tvGenres;
    const newActiveGenre = newGenres[0];
    setActiveGenre(newActiveGenre);
    setSearchQuery('');
    fetchContentByGenre(newActiveGenre.id, tab);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchContent(searchQuery, activeTab);
    } else {
      fetchContentByGenre(activeGenre.id, activeTab);
    }
  };

  // Handle sort change
  const handleSortChange = (newSort: 'popularity' | 'rating' | 'release_date') => {
    setSortBy(newSort);
    if (searchQuery.trim()) {
      searchContent(searchQuery, activeTab);
    } else {
      fetchContentByGenre(activeGenre.id, activeTab);
    }
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
              type="tv"
            />
          </TabsContent>
        </Tabs>
      </div>
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
  type: 'movies' | 'tv';
}

const GenreContent: React.FC<GenreContentProps> = ({
  genres,
  activeGenre,
  onGenreChange,
  content,
  isLoading,
  type
}) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {content.map((item) => {
            const title = 'title' in item ? item.title : item.name;
            const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            
            return (
              <Card key={item.id} className="glass-card hover:border-primary/30 transition-all hover:scale-105 group">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'}
                    alt={title}
                    className="aspect-[2/3] object-cover w-full group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span className={`text-xs font-medium ${getRatingColor(item.vote_average)}`}>
                      {item.vote_average.toFixed(1)}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="text-xs">
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
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No {type} found for this genre.</p>
        </div>
      )}
    </div>
  );
};

export default GenreCenter;