import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BookCard } from '@/components/books/BookCard';
import { blink } from '@/blink/client';
import type { Book } from '@/types';

interface BrowsePageProps {
  onViewBook: (book: Book) => void;
  onRentRequest: (book: Book) => void;
}

export function BrowsePage({ onViewBook, onRentRequest }: BrowsePageProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    subject: '',
    condition: '',
    priceRange: [0, 100],
    location: '',
  });

  const loadBooks = async () => {
    try {
      setLoading(true);
      const booksData = await blink.db.books.list({
        where: { isAvailable: "1" },
        orderBy: { createdAt: 'desc' },
        limit: 50
      });
      
      // Load owner information for each book
      const booksWithOwners = await Promise.all(
        booksData.map(async (book) => {
          try {
            const owner = await blink.db.users.list({
              where: { id: book.userId },
              limit: 1
            });
            
            // Safely parse images with error handling
            let parsedImages: string[] = [];
            try {
              if (book.images) {
                if (typeof book.images === 'string') {
                  // Only parse if it looks like JSON (starts with [ or ")
                  if (book.images.startsWith('[') || book.images.startsWith('"')) {
                    parsedImages = JSON.parse(book.images);
                  } else {
                    // If it's a plain URL string, wrap it in an array
                    parsedImages = [book.images];
                  }
                } else if (Array.isArray(book.images)) {
                  parsedImages = book.images;
                }
              }
            } catch (imageError) {
              console.warn('Failed to parse book images for book:', book.id, imageError);
              // If parsing fails, try to use the raw string as a single image
              if (typeof book.images === 'string' && book.images.startsWith('http')) {
                parsedImages = [book.images];
              } else {
                parsedImages = [];
              }
            }
            
            return {
              ...book,
              owner: owner[0] || null,
              images: parsedImages
            };
          } catch (error) {
            // Safely parse images with error handling (error case)
            let parsedImages: string[] = [];
            try {
              if (book.images) {
                if (typeof book.images === 'string') {
                  // Only parse if it looks like JSON (starts with [ or ")
                  if (book.images.startsWith('[') || book.images.startsWith('"')) {
                    parsedImages = JSON.parse(book.images);
                  } else {
                    // If it's a plain URL string, wrap it in an array
                    parsedImages = [book.images];
                  }
                } else if (Array.isArray(book.images)) {
                  parsedImages = book.images;
                }
              }
            } catch (imageError) {
              console.warn('Failed to parse book images for book:', book.id, imageError);
              // If parsing fails, try to use the raw string as a single image
              if (typeof book.images === 'string' && book.images.startsWith('http')) {
                parsedImages = [book.images];
              } else {
                parsedImages = [];
              }
            }
            
            return {
              ...book,
              owner: null,
              images: parsedImages
            };
          }
        })
      );
      
      setBooks(booksWithOwners);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchQuery || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = !filters.subject || book.subject === filters.subject;
    const matchesCondition = !filters.condition || book.condition === filters.condition;
    const matchesPrice = book.pricePerDay >= filters.priceRange[0] && book.pricePerDay <= filters.priceRange[1];
    const matchesLocation = !filters.location || 
      book.location?.toLowerCase().includes(filters.location.toLowerCase());
    
    return matchesSearch && matchesSubject && matchesCondition && matchesPrice && matchesLocation;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.pricePerDay - b.pricePerDay;
      case 'price-high':
        return b.pricePerDay - a.pricePerDay;
      case 'rating':
        return (b.owner?.rating || 0) - (a.owner?.rating || 0);
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const subjects = [...new Set(books.map(book => book.subject).filter(Boolean))];
  const conditions = ['new', 'like_new', 'good', 'fair', 'poor'];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Textbook</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Rent textbooks from students at your university and save money
        </p>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search by title, author, subject, or course code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Books</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label>Subject</Label>
                  <Select value={filters.subject} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, subject: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All subjects</SelectItem>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Condition</Label>
                  <Select value={filters.condition} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, condition: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any condition</SelectItem>
                      {conditions.map(condition => (
                        <SelectItem key={condition} value={condition}>
                          {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Price Range (per day)</Label>
                  <div className="mt-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, priceRange: value }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Enter location..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {sortedBooks.length} books found
          </span>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {sortedBooks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">No books found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find more books.
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {sortedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetails={onViewBook}
              onRentRequest={onRentRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}