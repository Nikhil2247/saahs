export interface GalleryEvent {
  id: string
  title: string
  date: string
  category: "Academic" | "Cultural" | "Sports" | "Welfare" | "Conventions"
  location: string
  description: string
  coverImage: string
  images: string[]
  createdAt?: string
}

// Demo data cleared so user can upload their own event galleries from dashboard
export const initialGalleryEvents: GalleryEvent[] = []
