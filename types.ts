export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  content: string;
}

export interface TutorConfigData {
  level: string;
}

export const TUTOR_LEVEL_OPTIONS: string[] = [
    'JNV प्रवेश परीक्षा - कक्षा 6',
    'JNV प्रवेश परीक्षा - कक्षा 9',
    'JNV प्रवेश परीक्षा - कक्षा 11',
];
