import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  Zap, 
  Coffee, 
  Moon, 
  Smile, 
  Skull, 
  Brain,
  Star,
  Calendar,
  RefreshCw,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MovieDetailModal from './MovieDetailModal';

interface MoodType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  genres: number[];
  color: string;
}

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

const moods: MoodType[] = [
  {
    id: 'feel-good',
    name: 'Feel-Good',
    icon: <Smile className="h-5 w-5" />,
    description: 'Uplifting and heartwarming content',
    genres: [35, 10751, 10749, 16], // Comedy, Family, Romance, Animation
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  },
  {
    id: 'thrilling',
    name: 'Thrilling',
    icon: <Zap className="h-5 w-5" />,
    description: 'Action-packed and suspenseful',
    genres: [28, 53, 80, 9648], // Action, Thriller, Crime, Mystery
    color: 'bg-red-500/20 text-red-300 border-red-500/30'
  },
  {
    id: 'chill',
    name: 'Chill',
    icon: <Coffee className="h-5 w-5" />,
    description: 'Relaxing and easy-going',
    genres: [18, 99, 10402, 36], // Drama, Documentary, Music, History
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  {
    id: 'dark',
    name: 'Dark & Mysterious',
    icon: <Moon className="h-5 w-5" />,
    description: 'Dark themes and mysterious plots',
    genres: [27, 9648, 53, 80], // Horror, Mystery, Thriller, Crime
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: <Heart className="h-5 w-5" />,
    description: 'Love stories and romantic dramas',
    genres: [10749, 18, 35], // Romance, Drama, Comedy
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
  },
  {
    id: 'mindblowing',
    name: 'Mind-Blowing',
    icon: <Brain className="h-5 w-5" />,
    description: 'Thought-provoking and complex',
    genres: [878, 9648, 53, 18], // Sci-Fi, Mystery, Thriller, Drama
    color: 'bg-green-500/20 text-green-300 border-green-500/30'
  },
  {
    id: 'scary',
    name: 'Scary',
    icon: <Skull className="h-5 w-5" />,
    description: 'Horror and supernatural thrills',
    genres: [27, 53], // Horror, Thriller
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  }
];

export const MoodBasedRecommendations = () => {
  const [selectedMood, setSelectedMood] = useState<MoodType>(moods[0]);
  const [recommendations, setRecommendations] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [selectedItem, setSelectedItem] = useState<{ id: number; type: 'movie' | 'tv' } | null>(null);
  const { toast } = useToast();

  const fetchRecommendations = async (mood: MoodType, type: 'movies' | 'tv') => {
    setLoading(true);
    try {
      const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';
      const genreString = mood.genres.join(',');
      
      // Get multiple pages for variety
      const promises = [1, 2, 3].map(page =>
        fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&with_genres=${genreString}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`)
          .then(res => res.json())
      );
      
      const responses = await Promise.all(promises);
      const allResults = responses.flatMap(response => response.results || []);
      
      // Shuffle and take top 12
      const shuffled = allResults.sort(() => 0.5 - Math.random()).slice(0, 12);
      setRecommendations(shuffled);
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(selectedMood, activeTab);
  }, [selectedMood, activeTab]);

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
  };

  const handleRefresh = () => {
    fetchRecommendations(selectedMood, activeTab);
  };

  const RecommendationCard = ({ item }: { item: TMDBItem }) => {
    const title = item.title || item.name || '';
    const year = item.release_date || item.first_air_date ? 
      new Date(item.release_date || item.first_air_date || '').getFullYear() : null;

    return (
      <Card 
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer bg-card/50 backdrop-blur-sm"
        onClick={() => setSelectedItem({ id: item.id, type: activeTab === 'movies' ? 'movie' : 'tv' })}
      >
        <div className="relative">
          <img
            src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : '/placeholder.svg'}
            alt={title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            <span className="text-xs font-medium text-white">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <Play className="h-6 w-6 text-white" />
            </div>
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
          <p className="text-xs text-muted-foreground line-clamp-2">{item.overview}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mood Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            What's Your Mood?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {moods.map((mood) => (
              <Button
                key={mood.id}
                variant={selectedMood.id === mood.id ? "default" : "outline"}
                className={`h-auto p-3 flex flex-col gap-2 transition-all duration-200 ${
                  selectedMood.id === mood.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-primary/10'
                }`}
                onClick={() => handleMoodSelect(mood)}
              >
                {mood.icon}
                <span className="text-xs font-medium">{mood.name}</span>
              </Button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedMood.name}:</strong> {selectedMood.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'movies' | 'tv')}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="movies" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((item) => (
                <RecommendationCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tv" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((item) => (
                <RecommendationCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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