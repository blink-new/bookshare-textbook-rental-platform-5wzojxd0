export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  university?: string;
  rating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author?: string;
  isbn?: string;
  edition?: string;
  subject?: string;
  courseCode?: string;
  description?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  images?: string[]; // Should be an array of image URLs after parsing
  isAvailable: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface RentalRequest {
  id: string;
  bookId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
  book?: Book;
  renter?: User;
  owner?: User;
}

export interface Message {
  id: string;
  rentalRequestId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Review {
  id: string;
  rentalRequestId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
  reviewee?: User;
}