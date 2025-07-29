import { MediaItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Edit3, Trash2, Film, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

export function MediaCard({ item, onEdit, onDelete }: MediaCardProps) {
  const statusColors = {
    'watching': 'bg-gradient-to-r from-accent-purple to-accent-blue',
    'plan-to-watch': 'bg-primary',
    'finished': 'bg-muted'
  };

  const renderRating = () => {
    if (!item.rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{item.rating}/10</span>
      </div>
    );
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {item.type === 'movie' ? (
              <Film className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Tv className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {item.type}
            </span>
            {item.year && (
              <span className="text-xs text-muted-foreground">({item.year})</span>
            )}
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEdit(item)}
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight">
          {item.title}
        </h3>

        {/* Status Badge */}
        <div className="mb-3">
          <Badge 
            className={cn(
              "text-white border-0",
              statusColors[item.status]
            )}
          >
            {item.status.replace('-', ' ')}
          </Badge>
        </div>

        {/* Rating */}
        {renderRating()}

        {/* Genres */}
        {item.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
            {item.genres.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.genres.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {item.notes}
          </p>
        )}
      </div>
    </Card>
  );
}