import { createAction, props } from '@ngrx/store';
import { ChatPlus } from '../../models/models';

export const chatSet = createAction(
  '[Chat/ChatPlus] Chat area',
  props<{ chat: ChatPlus | null }>()
);

export const userChatsChanged = createAction(
  '[Chat/UserChats] Chat list',
  props<{ chats: ChatPlus[] }>()
);
