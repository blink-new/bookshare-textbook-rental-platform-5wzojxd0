import React, { useState, useEffect, useCallback } from 'react';
import { Book, Calendar, DollarSign, User, MessageCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { blink } from '../blink/client';
import { Book as BookType, RentalRequest, User as UserType } from '../types';
import toast from 'react-hot-toast';

const MyRentalsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-books' | 'my-requests' | 'incoming-requests'>('my-books');
  const [myBooks, setMyBooks] = useState<BookType[]>([]);
  const [myRequests, setMyRequests] = useState<RentalRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);

  const parseImages = (images: any): string[] => {
    if (!images) return [];
    
    try {
      if (typeof images === 'string') {
        if (images.startsWith('[') || images.startsWith('"')) {
          return JSON.parse(images);
        } else if (images.startsWith('http')) {
          return [images];
        }
      } else if (Array.isArray(images)) {
        return images;
      }
    } catch (error) {
      console.warn('Failed to parse book images:', error);
    }
    
    return [];
  };

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Load my books
      const booksData = await blink.db.books.list({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' }
      });

      const parsedBooks = booksData.map(book => ({
        ...book,
        images: parseImages(book.images)
      }));
      setMyBooks(parsedBooks);

      // Load my rental requests
      const myRequestsData = await blink.db.rentalRequests.list({
        where: { requesterId: userId },
        orderBy: { createdAt: 'desc' }
      });
      setMyRequests(myRequestsData);

      // Load incoming requests for my books
      const incomingRequestsData = await blink.db.rentalRequests.list({
        where: { 
          AND: [
            { bookId: { in: parsedBooks.map(book => book.id) } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      setIncomingRequests(incomingRequestsData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user) {
        loadData(state.user.id);
      }
    });
    return unsubscribe;
  }, [loadData]);

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await blink.db.rentalRequests.update(requestId, {
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date().toISOString()
      });

      toast.success(`Request ${action}d successfully`);
      if (user) loadData(user.id);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const toggleBookAvailability = async (bookId: string, isAvailable: boolean) => {
    try {
      await blink.db.books.update(bookId, {
        isAvailable: !isAvailable,
        updatedAt: new Date().toISOString()
      });

      toast.success(`Book ${!isAvailable ? 'activated' : 'deactivated'} successfully`);
      if (user) loadData(user.id);
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('Failed to update book');
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book listing?')) return;

    try {
      await blink.db.books.delete(bookId);
      toast.success('Book deleted successfully');
      if (user) loadData(user.id);
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your rentals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Rentals</h1>
          <p className="mt-2 text-gray-600">Manage your book listings and rental requests</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('my-books')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-books'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Book className="h-4 w-4 inline mr-2" />
                My Books ({myBooks.length})
              </button>
              <button
                onClick={() => setActiveTab('my-requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                My Requests ({myRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('incoming-requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'incoming-requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4 inline mr-2" />
                Incoming Requests ({incomingRequests.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* My Books Tab */}
            {activeTab === 'my-books' && (
              <div className="space-y-4">
                {myBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No books listed yet</h3>
                    <p className="text-gray-600 mb-4">Start earning by listing your textbooks for rent</p>
                    <a
                      href="/list-book"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      List Your First Book
                    </a>
                  </div>
                ) : (
                  myBooks.map((book) => (
                    <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <img
                          src={book.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                          alt={book.title}
                          className="w-20 h-24 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
                              <p className="text-gray-600">by {book.author}</p>
                              <p className="text-sm text-gray-500 mt-1">{book.subject}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-lg font-bold text-green-600">
                                  ${book.dailyRate}/day
                                </span>
                                {book.weeklyRate && (
                                  <span className="text-gray-600">
                                    ${book.weeklyRate}/week
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  book.isAvailable 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {book.isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleBookAvailability(book.id, book.isAvailable)}
                                className={`px-3 py-1 rounded-md text-sm font-medium ${
                                  book.isAvailable
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {book.isAvailable ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteBook(book.id)}
                                className="p-2 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Requests Tab */}
            {activeTab === 'my-requests' && (
              <div className="space-y-4">
                {myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No rental requests yet</h3>
                    <p className="text-gray-600 mb-4">Browse books and make your first rental request</p>
                    <a
                      href="/"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Browse Books
                    </a>
                  </div>
                ) : (
                  myRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Request for Book ID: {request.bookId}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.startDate} to {request.endDate}
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            ${request.totalAmount}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(request.status)}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Incoming Requests Tab */}
            {activeTab === 'incoming-requests' && (
              <div className="space-y-4">
                {incomingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming requests</h3>
                    <p className="text-gray-600">Requests for your books will appear here</p>
                  </div>
                ) : (
                  incomingRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Request from User ID: {request.requesterId}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Book ID: {request.bookId}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.startDate} to {request.endDate}
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            ${request.totalAmount}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(request.status)}
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRequestAction(request.id, 'approve')}
                                className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(request.id, 'reject')}
                                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRentalsPage;