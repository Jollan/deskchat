import { createAction, props } from '@ngrx/store';
import { RootState } from '../models/app-state.model';

export const resetState = createAction(
  '[App/State] Root Component',
  props<{ state: RootState }>()
);
