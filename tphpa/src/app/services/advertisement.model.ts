export interface Advertisement {
  id?: number;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  created_at?: string;
}
