import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Play, Info, Brain } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';

interface RecommendedItem {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type: 'movie' | 'tv';
  reason: string;
}

const SmartRecommendations = () => {
  const [watchlist] = useLocalStorage<MediaItem[]>('watchlist', []);
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Analyze user preferences
  const userPreferences = useMemo(() => {
    const genreCount: { [key: string]: number } = {};
    const ratingSum = watchlist.reduce((sum, item) => sum + (item.rating || 0), 0);
    const avgRating = watchlist.length > 0 ? ratingSum / watchlist.length : 0;

    watchlist.forEach(item => {
      if (item.genres && item.genres.length > 0) {
        item.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });

    const topGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    const watchedTitles = new Set(watchlist.map(item => item.title.toLowerCase()));

    return { topGenres, avgRating, watchedTitles };
  }, [watchlist]);

  const generateRecommendations = async () => {
    if (watchlist.length === 0) return;

    setLoading(true);
    try {
      const recommendations: RecommendedItem[] = [];
      
      // Get recommendations based on top genres
      for (const genre of userPreferences.topGenres.slice(0, 2)) {
        const genreId = Object.entries(genreMap).find(([, name]) => name === genre)?.[0];
        if (!genreId) continue;

        // Get movies for this genre
        const movieResponse = await fetch(
          `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`,
          { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` } }
        );
        
        if (movieResponse.ok) {
          const movieData = await movieResponse.json();
          const filteredMovies = movieData.results
            .filter((movie: any) => !userPreferences.watchedTitles.has(movie.title.toLowerCase()))
            .slice(0, 3);
          
          filteredMovies.forEach((movie: any) => {
            recommendations.push({
              ...movie,
              media_type: 'movie',
              reason: `Because you enjoy ${genre} movies`
            });
          });
        }

        // Get TV shows for this genre
        const tvResponse = await fetch(
          `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`,
          { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` } }
        );
        
        if (tvResponse.ok) {
          const tvData = await tvResponse.json();
          const filteredTv = tvData.results
            .filter((show: any) => !userPreferences.watchedTitles.has(show.name.toLowerCase()))
            .slice(0, 2);
          
          filteredTv.forEach((show: any) => {
            recommendations.push({
              ...show,
              title: show.name,
              media_type: 'tv',
              reason: `Because you love ${genre} TV series`
            });
          });
        }
      }

      // Get trending recommendations
      const trendingResponse = await fetch(
        `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`,
        { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` } }
      );

      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        const filteredTrending = trendingData.results
          .filter((item: any) => {
            const title = item.title || item.name;
            return !userPreferences.watchedTitles.has(title.toLowerCase());
          })
          .slice(0, 4);

        filteredTrending.forEach((item: any) => {
          recommendations.push({
            ...item,
            title: item.title || item.name,
            media_type: item.media_type,
            reason: 'Trending now and matches your taste'
          });
        });
      }

      // Shuffle and limit recommendations
      const shuffled = recommendations
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);

      setRecommendations(shuffled);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (watchlist.length > 0) {
      generateRecommendations();
    }
  }, [watchlist.length]);

  if (watchlist.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Start adding movies and TV shows to your watchlist to get personalized recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Smart Recommendations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your {watchlist.length} watched items • Average rating: {userPreferences.avgRating.toFixed(1)}/10
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Button onClick={generateRecommendations} variant="outline" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Refresh Recommendations
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {recommendations.map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="group relative hover-lift">
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="sm" className="w-full text-xs">
                        <Info className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>

                    {item.vote_average > 0 && (
                      <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white font-medium">
                          {item.vote_average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    </Badge>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.reason}
                    </p>
                    {item.genre_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.genre_ids.slice(0, 2).map(genreId => (
                          <Badge key={genreId} variant="outline" className="text-xs">
                            {genreMap[genreId]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {recommendations.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">
                No recommendations available right now. Try adding more items to your watchlist!
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRecommendations;