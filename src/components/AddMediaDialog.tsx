import { useState } from 'react';
import { MediaItem, MediaType, WatchStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface AddMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: Omit<MediaItem, 'id' | 'dateAdded'>) => void;
  editItem?: MediaItem;
}

const commonGenres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi',
  'Thriller', 'War', 'Western', 'Biography', 'Family', 'Musical'
];

export function AddMediaDialog({ open, onOpenChange, onSave, editItem }: AddMediaDialogProps) {
  const [title, setTitle] = useState(editItem?.title || '');
  const [type, setType] = useState<MediaType>(editItem?.type || 'movie');
  const [status, setStatus] = useState<WatchStatus>(editItem?.status || 'plan-to-watch');
  const [rating, setRating] = useState(editItem?.rating?.toString() || '');
  const [year, setYear] = useState(editItem?.year?.toString() || '');
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(editItem?.genres || []);
  const [customGenre, setCustomGenre] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      type,
      status,
      rating: rating ? Number(rating) : undefined,
      year: year ? Number(year) : undefined,
      notes: notes.trim() || undefined,
      genres: selectedGenres,
      dateFinished: status === 'finished' ? new Date().toISOString() : editItem?.dateFinished
    });

    // Reset form
    if (!editItem) {
      setTitle('');
      setType('movie');
      setStatus('plan-to-watch');
      setRating('');
      setYear('');
      setNotes('');
      setSelectedGenres([]);
    }
    
    onOpenChange(false);
  };

  const addGenre = (genre: string) => {
    if (genre && !selectedGenres.includes(genre)) {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  const addCustomGenre = () => {
    if (customGenre.trim()) {
      addGenre(customGenre.trim());
      setCustomGenre('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editItem ? 'Edit Media' : 'Add New Media'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as MediaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="tv">TV Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as WatchStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan-to-watch">Plan to Watch</SelectItem>
                  <SelectItem value="watching">Watching</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-10)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Genres</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedGenres.map((genre) => (
                <Badge key={genre} variant="secondary" className="cursor-pointer">
                  {genre}
                  <X
                    className="w-3 h-3 ml-1"
                    onClick={() => removeGenre(genre)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={addGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Add genre..." />
                </SelectTrigger>
                <SelectContent>
                  {commonGenres
                    .filter(g => !selectedGenres.includes(g))
                    .map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Custom genre..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGenre())}
              />
              <Button type="button" variant="outline" onClick={addCustomGenre}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editItem ? 'Update' : 'Add'} Media
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}