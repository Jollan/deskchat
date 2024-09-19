import { ChatPlus, User } from './models';

export const ROOT = 'root';

export class AppState {
  [ROOT]: RootState;
}

export class RootState {
  user: User | null;
  loaded: boolean;
  chats: ChatPlus[] | null;
  chat: ChatPlus | null;
}
