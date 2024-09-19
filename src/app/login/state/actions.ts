import { createAction, props } from '@ngrx/store';
import { User } from '../../models/models';

export const userStateChanged = createAction(
  '[Auth/User] authen',
  props<{ user: User | null }>()
);

export const loading = createAction(
  '[Auth/User] authen login',
  props<{ loaded: boolean }>()
);
