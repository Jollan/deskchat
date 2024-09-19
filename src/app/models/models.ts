abstract class Metadata {
  createdAt: any;
}

export class User extends Metadata {
  avatar?: string;
  username: string;
  email: string;
  about: string;
  blocked: string[];
  uid: string;
}

export class Message extends Metadata {
  text?: string;
  image?: string;
  senderId: string;
}

export class ChatMessages extends Metadata {
  messages: Message[];
}

export class Chat {
  messagesId: string;
  lastMessage: string;
  isRead: boolean;
  correspondentId: string;
  updatedAt: number;
}

export class ChatPlus extends Chat {
  blockedMe: boolean;
  blockedHim: boolean;
  correspondent: User;
}

export class UserChats {
  chats: Chat[];
}
