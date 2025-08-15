import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, TrendingUp, RefreshCw } from 'lucide-react';

interface TrendingItem {
  id: number;
  title: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  overview: string;
}

const TrendingInMyCountry = () => {
  const [movieTrending, setMovieTrending] = useState<TrendingItem[]>([]);
  const [tvTrending, setTvTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('US');
  const [countryName, setCountryName] = useState<string>('United States');

  const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MmJhMzBkMTFlNDdlZjMwMmU3OGJhODMwYzYwZWQ5YyIsIm5iZiI6MTczNDc3NDE4OC4yMjIsInN1YiI6IjY3NjlkMGRjMGIzNDE2MzBkYWJhZmVhYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Bsmc4eZGV2r8wH7kILWNTgTzOuX5xMCb_7N5ubVUdYY';
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

  const genreMap: { [key: number]: string } = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
  };

  const countryNames: { [key: string]: string } = {
    'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
    'DE': 'Germany', 'FR': 'France', 'ES': 'Spain', 'IT': 'Italy', 'JP': 'Japan',
    'KR': 'South Korea', 'IN': 'India', 'BR': 'Brazil', 'MX': 'Mexico', 'NL': 'Netherlands',
    'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'BE': 'Belgium', 'CH': 'Switzerland'
  };

  // Get user's country (simplified)
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to detect user's country via IP geolocation API
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const country = data.country_code;
          if (countryNames[country]) {
            setUserCountry(country);
            setCountryName(countryNames[country]);
          }
        }
      } catch (error) {
        console.log('Could not detect country, using default (US)');
      }
    };

    detectCountry();
  }, []);

  const fetchTrendingContent = async () => {
    setLoading(true);
    try {
      // Fetch trending movies in user's country
      const movieResponse = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&region=${userCountry}&page=1`,
        { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` } }
      );

      if (movieResponse.ok) {
        const movieData = await movieResponse.json();
        setMovieTrending(movieData.results.slice(0, 20));
      }

      // Fetch trending TV shows in user's country  
      const tvResponse = await fetch(
        `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&region=${userCountry}&page=1`,
        { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` } }
      );

      if (tvResponse.ok) {
        const tvData = await tvResponse.json();
        setTvTrending(tvData.results.slice(0, 20));
      }

    } catch (error) {
      console.error('Error fetching trending content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userCountry) {
      fetchTrendingContent();
    }
  }, [userCountry]);

  const TrendingCard = ({ item, type }: { item: TrendingItem; type: 'movie' | 'tv' }) => {
    const title = type === 'movie' ? item.title : item.name || item.title;
    const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

    return (
      <div className="group relative bg-card rounded-lg overflow-hidden hover-lift transition-all duration-300">
        <div className="relative aspect-[2/3] overflow-hidden">
          {item.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {item.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-white font-medium">
                {item.vote_average.toFixed(1)}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-xs line-clamp-3 mb-2">
              {item.overview}
            </p>
            <div className="flex flex-wrap gap-1">
              {item.genre_ids.slice(0, 2).map(genreId => (
                <Badge key={genreId} variant="secondary" className="text-xs">
                  {genreMap[genreId]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 mb-1">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{year}</span>
            <Badge variant="outline" className="text-xs">
              {type === 'movie' ? 'Movie' : 'TV Show'}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Trending in {countryName}
          </CardTitle>
          <Button onClick={fetchTrendingContent} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          What's popular in your region right now
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="movies" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="tv">TV Shows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="movies">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                    <div className="h-4 bg-muted rounded mb-1" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movieTrending.map((movie) => (
                  <TrendingCard key={movie.id} item={movie} type="movie" />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tv">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                    <div className="h-4 bg-muted rounded mb-1" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tvTrending.map((show) => (
                  <TrendingCard key={show.id} item={show} type="tv" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrendingInMyCountry;