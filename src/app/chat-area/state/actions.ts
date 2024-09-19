import { createAction, props } from '@ngrx/store';

export const messageSent = createAction(
  '[Chat/Message text] Chat area',
  props<{ lastMessage: string; updatedAt: number }>()
);
