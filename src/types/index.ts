export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'website' | 'url' | 'text';
  content?: string;
  url?: string;
  filePath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Summary {
  id: string;
  documentId: string;
  content: string;
  keyPoints: string[];
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  documentTitle?: string; // From joined documents table
  documentType?: string; // From joined documents table
  overview?: string[];
  sections?: { title: string; bullets: string[] }[];
  chatOptions?: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled';
  plan: 'free' | 'basic' | 'premium';
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
}

export interface SummaryRequest {
  documentId: string;
  type: 'brief' | 'detailed' | 'bullet-points';
  language?: string;
} 