export interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  private: boolean;
  updatedAt?: string;
  url: string;
}

export type UiMessageType = 'success' | 'error';

export interface UiMessage {
  type: UiMessageType;
  text: string;
}
