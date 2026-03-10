/* =========================================================
   LPFA Website — TypeScript Types
   ========================================================= */

export interface GalleryImage {
  url: string;
  alt: string;
  sort_order: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  published_date: string;
  body: string;
  excerpt?: string;
  image_url?: string;
  gallery_images: GalleryImage[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  event_date?: string;
  start_date?: string;
  description: string;
  location: string;
  time?: string;
  start_time?: string;
  duration?: string;
  price?: string;
  cta_text: string;
  cta_url: string;
  headliner?: string;
  opening_band?: string;
  event_policy?: string;
  ticket_url?: string;
  image_url?: string;
  gallery_images?: GalleryImage[];
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  name: string;
  slug: string;
  section: string;
  price: string;
  price_note?: string;
  description: string;
  duration?: string;
  details?: TourDetail[];
  departure_location?: string;
  age_restriction?: string;
  booking_info?: string;
  event_policy?: string;
  sort_order: number;
  is_published: boolean;
  peekpro_product_id?: string;
  created_at: string;
  updated_at: string;
  schedules?: TourSchedule[];
}

export interface TourDetail {
  icon: string;
  text: string;
}

export interface TourSchedule {
  id: string;
  tour_id: string;
  year: number;
  month: string;
  month_order: number;
  dates: string[];
  source: 'manual' | 'peekpro';
  created_at: string;
}

export interface BoardDocument {
  id: string;
  title: string;
  document_date: string;
  document_type: 'agenda' | 'minutes' | 'resolution' | 'board_packet';
  file_url: string;
  file_name: string;
  file_size?: number;
  is_published: boolean;
  created_at: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  bio?: string;
  sort_order: number;
  is_special: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  photo_url?: string;
  bio?: string;
  term_text?: string;
  sort_order: number;
  is_officer: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  title: string;
  description?: string;
  categories: string[];
  file_url: string;
  thumbnail_url: string;
  file_name: string;
  file_size?: number;
  width?: number;
  height?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface PhotoCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin';
  display_name: string;
  email: string;
  created_at: string;
}
