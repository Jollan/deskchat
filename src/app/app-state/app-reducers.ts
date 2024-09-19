import { ActionReducer, MetaReducer, createReducer, on } from '@ngrx/store';
import { RootState, AppState } from '../models/app-state.model';
import { loading, userStateChanged } from '../login/state/actions';
import { chatSet, userChatsChanged } from '../chat-list/state/actions';
import { messageSent } from '../chat-area/state/actions';
import { clone, findIndex } from 'lodash-es';
import { resetState } from './app-actions';

const initialState = { loaded: true } as RootState;

function log(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    const curState = reducer(state, action);
    console.groupCollapsed(action.type);
    console.log('Etat precedent: ', state);
    console.log('Etat suivant: ', curState);
    console.groupEnd();
    return curState;
  };
}

export const metaReducers: MetaReducer[] = [];

export const rootReducer = createReducer(
  initialState,
  on(loading, (state, props) => {
    return { ...state, loaded: props.loaded };
  }),
  on(userStateChanged, (state, props) => {
    return { ...state, user: props.user };
  }),
  on(userChatsChanged, (state, props) => {
    return { ...state, chats: props.chats };
  }),
  on(chatSet, (state, props) => {
    return { ...state, chat: props.chat };
  }),
  on(messageSent, (state, props) => {
    const chats = clone(state.chats)!;
    const i = findIndex(chats, ['messagesId', state.chat!.messagesId]);
    chats[i] = {
      ...chats[i],
      lastMessage: props.lastMessage,
      updatedAt: props.updatedAt,
    };
    return { ...state, chats, chat: { ...state.chat, ...chats[i] } };
  }),
  on(resetState, (state, props) => {
    return { ...props.state, loaded: true };
  })
);
