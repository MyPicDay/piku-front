export interface Notification {
  id: number;
  relatedId: string;
  isRead: boolean;
  receiverId: string;
  message: string;
  thumbnailUrl: string;
}
