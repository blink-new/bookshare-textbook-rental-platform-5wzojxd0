import { Star, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Book } from '@/types';

interface BookCardProps {
  book: Book;
  onViewDetails: (book: Book) => void;
  onRentRequest?: (book: Book) => void;
}

export function BookCard({ book, onViewDetails, onRentRequest }: BookCardProps) {
  const conditionColors = {
    new: 'bg-green-100 text-green-800',
    like_new: 'bg-blue-100 text-blue-800',
    good: 'bg-yellow-100 text-yellow-800',
    fair: 'bg-orange-100 text-orange-800',
    poor: 'bg-red-100 text-red-800',
  };

  const conditionLabels = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };

  // Handle images - they should already be parsed as an array from BrowsePage
  let images: string[] = [];
  if (book.images) {
    if (Array.isArray(book.images)) {
      images = book.images;
    } else if (typeof book.images === 'string') {
      // Fallback: if somehow we get a string, try to parse it safely
      try {
        if (book.images.startsWith('[') || book.images.startsWith('"')) {
          images = JSON.parse(book.images);
        } else if (book.images.startsWith('http')) {
          images = [book.images];
        }
      } catch (error) {
        console.warn('Failed to parse book images in BookCard:', error);
        // If it's a URL string, use it directly
        if (book.images.startsWith('http')) {
          images = [book.images];
        }
      }
    }
  }
  
  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <div onClick={() => onViewDetails(book)}>
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
          <img
            src={primaryImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-2 right-2">
            <Badge className={conditionColors[book.condition]}>
              {conditionLabels[book.condition]}
            </Badge>
          </div>
          {!book.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-white bg-black/70">
                Not Available
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            
            {book.author && (
              <p className="text-sm text-muted-foreground">by {book.author}</p>
            )}
            
            {book.subject && (
              <Badge variant="outline" className="text-xs">
                {book.subject}
              </Badge>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-primary">
                ${book.pricePerDay}/day
              </div>
              {book.pricePerWeek && (
                <div className="text-sm text-muted-foreground">
                  ${book.pricePerWeek}/week
                </div>
              )}
            </div>
            
            {book.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {book.location}
              </div>
            )}
          </div>
        </CardContent>
      </div>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={book.owner?.avatarUrl} />
            <AvatarFallback className="text-xs">
              {(book.owner?.displayName || book.owner?.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              {book.owner?.displayName || 'User'}
            </span>
            {book.owner && book.owner.totalRatings > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {book.owner.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {book.isAvailable && onRentRequest && (
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onRentRequest(book);
            }}
          >
            Rent
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}