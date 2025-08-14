import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Star, 
  Trophy, 
  Flame, 
  Calendar,
  Film,
  Tv,
  Clock,
  CheckCircle,
  Target
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MediaItem } from '@/types';
import { StatsCard } from './StatsCard';

const COLORS = ['hsl(275, 85%, 60%)', 'hsl(290, 100%, 80%)', 'hsl(260, 70%, 50%)', 'hsl(240, 50%, 60%)', 'hsl(320, 70%, 60%)'];

export const WatchlistInsights = () => {
  const [mediaItems] = useLocalStorage<MediaItem[]>('binge-list-items', []);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const finished = mediaItems.filter(item => item.status === 'finished');
    const watching = mediaItems.filter(item => item.status === 'watching');
    const planned = mediaItems.filter(item => item.status === 'plan-to-watch');

    // This month's stats
    const finishedThisMonth = finished.filter(item => 
      item.dateFinished && new Date(item.dateFinished) >= thisMonth
    );

    // Genre breakdown
    const genreCount: Record<string, number> = {};
    finished.forEach(item => {
      item.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // Average rating
    const ratedItems = finished.filter(item => item.rating && item.rating > 0);
    const avgRating = ratedItems.length > 0 
      ? ratedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / ratedItems.length
      : 0;

    // Monthly activity data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthFinished = finished.filter(item => 
        item.dateFinished && 
        new Date(item.dateFinished) >= month &&
        new Date(item.dateFinished) < nextMonth
      );

      monthlyData.push({
        month: month.toLocaleDateString('en', { month: 'short' }),
        movies: monthFinished.filter(item => item.type === 'movie').length,
        tv: monthFinished.filter(item => item.type === 'tv').length,
        total: monthFinished.length
      });
    }

    // Genre pie chart data
    const topGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ name: genre, value: count }));

    return {
      totalWatched: finished.length,
      totalWatching: watching.length,
      totalPlanned: planned.length,
      watchedThisMonth: finishedThisMonth.length,
      averageRating: avgRating,
      topGenres,
      monthlyData,
      movieCount: finished.filter(item => item.type === 'movie').length,
      tvCount: finished.filter(item => item.type === 'tv').length,
      favoriteGenre: Object.entries(genreCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    };
  }, [mediaItems]);

  // Calculate streaks
  useEffect(() => {
    const finished = mediaItems
      .filter(item => item.status === 'finished' && item.dateFinished)
      .sort((a, b) => new Date(b.dateFinished!).getTime() - new Date(a.dateFinished!).getTime());

    let current = 0;
    let longest = 0;
    let temp = 0;
    let lastDate: Date | null = null;

    finished.forEach(item => {
      const itemDate = new Date(item.dateFinished!);
      
      if (!lastDate) {
        temp = 1;
        current = 1;
      } else {
        const daysDiff = Math.abs(lastDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 7) { // Within a week
          temp++;
          if (current === temp - 1) current = temp;
        } else {
          longest = Math.max(longest, temp);
          temp = 1;
          if (daysDiff > 14) current = 0; // Reset current if gap is too large
        }
      }
      
      lastDate = itemDate;
    });

    longest = Math.max(longest, temp);
    setCurrentStreak(current);
    setLongestStreak(longest);
  }, [mediaItems]);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Watched This Month"
          value={stats.watchedThisMonth}
          subtitle={`${stats.totalWatched} total`}
          icon={<CheckCircle className="h-5 w-5" />}
          gradient={true}
        />
        <StatsCard
          title="Average Rating"
          value={stats.averageRating.toFixed(1)}
          subtitle="out of 10"
          icon={<Star className="h-5 w-5" />}
        />
        <StatsCard
          title="Current Streak"
          value={currentStreak}
          subtitle={`${longestStreak} longest`}
          icon={<Flame className="h-5 w-5" />}
        />
        <StatsCard
          title="Favorite Genre"
          value={stats.favoriteGenre}
          subtitle="most watched"
          icon={<Trophy className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Monthly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="movies" stackId="a" fill="hsl(275, 85%, 60%)" name="Movies" />
                  <Bar dataKey="tv" stackId="a" fill="hsl(290, 100%, 80%)" name="TV Shows" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genres" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Genre Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.topGenres}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.topGenres.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Genres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.topGenres.map((genre, index) => (
                  <div key={genre.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{genre.name}</span>
                    </div>
                    <Badge variant="secondary">{genre.value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Watchlist Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Watched</span>
                    <span>{stats.totalWatched} items</span>
                  </div>
                  <Progress 
                    value={(stats.totalWatched / (stats.totalWatched + stats.totalWatching + stats.totalPlanned)) * 100} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Currently Watching</span>
                    <span>{stats.totalWatching} items</span>
                  </div>
                  <Progress 
                    value={(stats.totalWatching / (stats.totalWatched + stats.totalWatching + stats.totalPlanned)) * 100} 
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Plan to Watch</span>
                    <span>{stats.totalPlanned} items</span>
                  </div>
                  <Progress 
                    value={(stats.totalPlanned / (stats.totalWatched + stats.totalWatching + stats.totalPlanned)) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    <span>Movies</span>
                  </div>
                  <Badge variant="outline">{stats.movieCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    <span>TV Shows</span>
                  </div>
                  <Badge variant="outline">{stats.tvCount}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalWatched}</div>
                    <div className="text-sm text-muted-foreground">Total Watched</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};