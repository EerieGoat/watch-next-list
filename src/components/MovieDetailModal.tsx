import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  Calendar, 
  Clock, 
  Play, 
  Plus, 
  X, 
  ExternalLink,
  MapPin,
  Users,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';

interface MovieDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  production_companies: Array<{ id: number; name: string; logo_path: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  status: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  homepage?: string;
}

interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  popularity: number;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

interface WatchProvider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

interface WatchProviders {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

interface MovieDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieId: number;
  mediaType: 'movie' | 'tv';
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  open,
  onOpenChange,
  movieId,
  mediaType
}) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const { toast } = useToast();

  useEffect(() => {
    if (open && movieId) {
      fetchMovieDetails();
    }
  }, [open, movieId, mediaType]);

  const fetchMovieDetails = async () => {
    setIsLoading(true);
    try {
      const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
      
      // Fetch all data in parallel
      const [detailsRes, creditsRes, videosRes, watchProvidersRes] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/${endpoint}/${movieId}?api_key=${TMDB_API_KEY}`),
        fetch(`${TMDB_BASE_URL}/${endpoint}/${movieId}/credits?api_key=${TMDB_API_KEY}`),
        fetch(`${TMDB_BASE_URL}/${endpoint}/${movieId}/videos?api_key=${TMDB_API_KEY}`),
        fetch(`${TMDB_BASE_URL}/${endpoint}/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`)
      ]);

      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        setDetails(detailsData);
      }

      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        setCast(creditsData.cast?.slice(0, 12) || []);
      }

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        const trailers = videosData.results?.filter((video: Video) => 
          video.type === 'Trailer' && video.site === 'YouTube'
        ) || [];
        setVideos(trailers);
      }

      if (watchProvidersRes.ok) {
        const watchData = await watchProvidersRes.json();
        setWatchProviders(watchData.results?.US || null);
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      toast({
        title: "Error",
        description: "Failed to load movie details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = () => {
    if (!details) return;

    const title = details.title || details.name || '';
    const year = details.release_date || details.first_air_date ? 
      new Date(details.release_date || details.first_air_date || '').getFullYear() : undefined;
    const genres = details.genres.map(g => g.name);

    const newItem: MediaItem = {
      id: Date.now().toString(),
      title,
      type: mediaType,
      status: 'plan-to-watch',
      genres,
      year,
      poster: details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : undefined,
      dateAdded: new Date().toISOString(),
      notes: details.overview
    };

    setMediaItems(prev => [newItem, ...prev]);
    toast({
      title: "Added to watchlist",
      description: `"${title}" has been added to your plan to watch list.`,
    });
  };

  const openTrailer = (videoKey: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoKey}`, '_blank');
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(amount);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-card border-primary/20 p-0">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ) : details ? (
          <div className="overflow-hidden">
            {/* Backdrop Header */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={details.backdrop_path ? `${TMDB_BACKDROP_BASE_URL}${details.backdrop_path}` : '/placeholder.svg'}
                alt={details.title || details.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-start gap-4">
                  <img
                    src={details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : '/placeholder.svg'}
                    alt={details.title || details.name}
                    className="w-24 h-36 object-cover rounded-lg shadow-lg hidden sm:block"
                  />
                  <div className="flex-1 text-white">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      {details.title || details.name}
                    </h1>
                    {details.tagline && (
                      <p className="text-sm opacity-90 italic mb-2">{details.tagline}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        <span>{details.vote_average.toFixed(1)}</span>
                        <span className="opacity-70">({details.vote_count.toLocaleString()})</span>
                      </div>
                      {(details.release_date || details.first_air_date) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(details.release_date || details.first_air_date || '').getFullYear()}
                        </div>
                      )}
                      {details.runtime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatRuntime(details.runtime)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[calc(90vh-16rem)]">
              <div className="p-6 space-y-6">
                {/* Genres and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {details.genres.map((genre) => (
                      <Badge key={genre.id} variant="secondary">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {videos.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openTrailer(videos[0].key)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Trailer
                      </Button>
                    )}
                    <Button onClick={addToWatchlist} className="btn-glow">
                      <Plus className="h-4 w-4 mr-2" />
                      Add to List
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="cast">Cast</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="watch">Watch</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {details.overview || 'No synopsis available.'}
                      </p>
                    </div>
                    
                    {details.production_companies.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Production</h3>
                        <div className="flex flex-wrap gap-2">
                          {details.production_companies.slice(0, 3).map((company) => (
                            <Badge key={company.id} variant="outline">
                              {company.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="cast" className="space-y-4">
                    {cast.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {cast.map((actor) => (
                          <Card key={actor.id} className="glass-card">
                            <CardContent className="p-3 text-center">
                              <img
                                src={actor.profile_path ? `${TMDB_IMAGE_BASE_URL}${actor.profile_path}` : '/placeholder.svg'}
                                alt={actor.name}
                                className="w-full aspect-[3/4] object-cover rounded-md mb-2"
                              />
                              <h4 className="font-medium text-sm line-clamp-1">{actor.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{actor.character}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No cast information available.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm">Status</h4>
                          <p className="text-muted-foreground">{details.status}</p>
                        </div>
                        {mediaType === 'tv' && (
                          <>
                            {details.number_of_seasons && (
                              <div>
                                <h4 className="font-medium text-sm">Seasons</h4>
                                <p className="text-muted-foreground">{details.number_of_seasons}</p>
                              </div>
                            )}
                            {details.number_of_episodes && (
                              <div>
                                <h4 className="font-medium text-sm">Episodes</h4>
                                <p className="text-muted-foreground">{details.number_of_episodes}</p>
                              </div>
                            )}
                          </>
                        )}
                        {details.spoken_languages.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Languages</h4>
                            <p className="text-muted-foreground">
                              {details.spoken_languages.map(lang => lang.name).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {details.production_countries.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Countries</h4>
                            <p className="text-muted-foreground">
                              {details.production_countries.map(country => country.name).join(', ')}
                            </p>
                          </div>
                        )}
                        {details.budget && details.budget > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Budget</h4>
                            <p className="text-muted-foreground">{formatMoney(details.budget)}</p>
                          </div>
                        )}
                        {details.revenue && details.revenue > 0 && (
                          <div>
                            <h4 className="font-medium text-sm">Revenue</h4>
                            <p className="text-muted-foreground">{formatMoney(details.revenue)}</p>
                          </div>
                        )}
                        {details.homepage && (
                          <div>
                            <h4 className="font-medium text-sm">Official Website</h4>
                            <a 
                              href={details.homepage} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              Visit <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="watch" className="space-y-4">
                    {watchProviders ? (
                      <div className="space-y-4">
                        {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Stream</h4>
                            <div className="flex flex-wrap gap-2">
                              {watchProviders.flatrate.map((provider) => (
                                <div key={provider.provider_id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                                  <img
                                    src={`${TMDB_IMAGE_BASE_URL}${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="w-8 h-8 rounded"
                                  />
                                  <span className="text-sm">{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {watchProviders.rent && watchProviders.rent.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Rent</h4>
                            <div className="flex flex-wrap gap-2">
                              {watchProviders.rent.map((provider) => (
                                <div key={provider.provider_id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                                  <img
                                    src={`${TMDB_IMAGE_BASE_URL}${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="w-8 h-8 rounded"
                                  />
                                  <span className="text-sm">{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {watchProviders.buy && watchProviders.buy.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Buy</h4>
                            <div className="flex flex-wrap gap-2">
                              {watchProviders.buy.map((provider) => (
                                <div key={provider.provider_id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                                  <img
                                    src={`${TMDB_IMAGE_BASE_URL}${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="w-8 h-8 rounded"
                                  />
                                  <span className="text-sm">{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No streaming information available for your region.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load movie details.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MovieDetailModal;