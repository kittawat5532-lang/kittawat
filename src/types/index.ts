export type UserRole = 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MediaType = 'pdf' | 'video' | 'website' | 'article' | 'slides' | 'other';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string;
  mediaType: MediaType;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  isHidden: boolean;
  viewCount: number;
  favoriteCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory?: string;
  createdAt: string;
}

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ModerationLog {
  id: string;
  action: string;
  targetType: 'resource' | 'user' | 'setting' | 'report';
  targetId: string;
  targetTitle: string;
  performedBy: string;
  performedByName: string;
  reason?: string;
  timestamp: string;
}

export interface SiteSettings {
  siteName: string;
  description: string;
  announcement: string;
  bannerText: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ResourceFilterState {
  searchQuery: string;
  category: string;
  gradeLevel: string;
  mediaType: string;
  sortBy: 'latest' | 'popular' | 'views';
}

export const GRADE_LEVELS = [
  'ทั้งหมด',
  'ประถมศึกษา (ป.1 - ป.6)',
  'มัธยมศึกษาตอนต้น (ม.1 - ม.3)',
  'มัธยมศึกษาตอนปลาย (ม.4 - ม.6)',
  'อาชีวศึกษา (ปวช. / ปวส.)',
  'อุดมศึกษา / มหาวิทยาลัย',
  'ครู / บุคลากรทางการศึกษา',
  'ประชาชนทั่วไป'
];

export const MEDIA_TYPES: { type: MediaType; label: string; icon: string }[] = [
  { type: 'pdf', label: 'เอกสาร PDF / ชีทสรุป', icon: 'FileText' },
  { type: 'video', label: 'คลิปวิดีโอ / บรรยาย', icon: 'Video' },
  { type: 'website', label: 'เว็บไซต์ / ลิงก์สื่อ', icon: 'Globe' },
  { type: 'slides', label: 'สไลด์นำเสนอ / Canva', icon: 'Presentation' },
  { type: 'article', label: 'บทความ / เนื้อหา', icon: 'BookOpen' },
  { type: 'other', label: 'สื่อการสอนอื่นๆ', icon: 'Folder' },
];

export const DEFAULT_CATEGORIES = [
  'คอมพิวเตอร์และเทคโนโลยี',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และฟิสิกส์',
  'ภาษาไทย',
  'ภาษาอังกฤษและภาษาต่างประเทศ',
  'สังคมศึกษาและประวัติศาสตร์',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะและดนตรี',
  'การงานอาชีพและธุรกิจ',
  'เตรียมสอบและแนะแนวการศึกษา'
];
