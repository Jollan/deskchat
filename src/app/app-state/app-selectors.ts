import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ROOT, RootState } from '../models/app-state.model';

const selectRoot = createFeatureSelector<RootState>(ROOT);

export const getUser = createSelector(selectRoot, (rootState) => {
  return rootState.user;
});

export const getLoaded = createSelector(selectRoot, (rootState) => {
  return rootState.loaded;
});

export const getUserId = createSelector(selectRoot, (rootState) => {
  return rootState.user?.uid;
});

export const getUserBlocked = createSelector(selectRoot, (rootState) => {
  return rootState.user?.blocked;
});

export const getuserChats = createSelector(selectRoot, (rootState) => {
  return rootState.chats;
});

export const getChat = createSelector(selectRoot, (rootState) => {
  return rootState.chat;
});

export const getChatMessagesId = createSelector(selectRoot, (rootState) => {
  return rootState.chat?.messagesId;
});
