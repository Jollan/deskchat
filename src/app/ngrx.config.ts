import { ActionReducerMap, RootStoreConfig } from '@ngrx/store';
import { AppState, ROOT } from './models/app-state.model';
import { metaReducers, rootReducer } from './app-state/app-reducers';

export const reducers: ActionReducerMap<AppState> = {
  [ROOT]: rootReducer,
};

export const rootStoreConfig: RootStoreConfig<AppState> = {
  metaReducers,
};
