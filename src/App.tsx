import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BrowsePage } from '@/pages/BrowsePage';
import ListBookPage from './pages/ListBookPage';
import MyRentalsPage from './pages/MyRentalsPage';
import { blink } from '@/blink/client';
import type { Book } from '@/types';

function App() {
  const [currentPage, setCurrentPage] = useState('browse');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      setLoading(state.isLoading);
    });
    return unsubscribe;
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedBook(null);
  };

  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
    setCurrentPage('book-details');
  };

  const handleRentRequest = (book: Book) => {
    setSelectedBook(book);
    setCurrentPage('rent-request');
  };

  const handleSearch = (query: string) => {
    // This will be handled by the BrowsePage component
    console.log('Search query:', query);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BookShare...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
            <span className="text-primary-foreground font-bold text-2xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Welcome to BookShare</h1>
          <p className="text-muted-foreground mb-8">
            The peer-to-peer textbook rental platform where students can rent and share textbooks with each other.
          </p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In to Get Started
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'browse':
        return (
          <BrowsePage
            onViewBook={handleViewBook}
            onRentRequest={handleRentRequest}
          />
        );
      case 'list':
        return <ListBookPage />;
      case 'rentals':
        return <MyRentalsPage />;
      case 'messages':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Messages</h2>
              <p className="text-muted-foreground">Coming soon! Chat with other users about rentals here.</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Profile</h2>
              <p className="text-muted-foreground">Coming soon! Manage your profile and settings here.</p>
            </div>
          </div>
        );
      case 'book-details':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Book Details</h2>
              <p className="text-muted-foreground">Coming soon! View detailed book information here.</p>
              {selectedBook && (
                <div className="mt-4">
                  <p>Selected book: {selectedBook.title}</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'rent-request':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Rent Request</h2>
              <p className="text-muted-foreground">Coming soon! Send rental requests here.</p>
              {selectedBook && (
                <div className="mt-4">
                  <p>Requesting to rent: {selectedBook.title}</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <BrowsePage
            onViewBook={handleViewBook}
            onRentRequest={handleRentRequest}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        onSearch={handleSearch}
      />
      <main className="min-h-[calc(100vh-4rem)]">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;