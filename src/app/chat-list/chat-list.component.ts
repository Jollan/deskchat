import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  getChat,
  getUser,
  getUserBlocked,
  getuserChats,
  getUserId,
} from '../app-state/app-selectors';
import { UserChats, User, ChatPlus, Chat } from '../models/models';
import {
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  DocumentReference,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Unsubscribe } from 'firebase/auth';
import { chatSet, userChatsChanged } from './state/actions';
import { FormsModule, NgModel } from '@angular/forms';
import { removeExtraWhiteSpace, title } from '../utils/utils';
import { cloneDeep, find, findIndex, isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly store = inject(Store);

  readonly alertService = inject(AlertService);

  @ViewChild('searchInput') private searchInput: NgModel;
  private readonly subscription = new Subscription();
  private userChatsSnapUnSub: Unsubscribe;
  private userSnapUnSubs: Unsubscribe[] = [];
  private userChats: UserChats;
  private userChatsRef: DocumentReference;
  private chats: ChatPlus[] = [];
  private filter: string;

  user = new User();
  addMode = false;
  filteredChats: ChatPlus[] = [];
  activeChat?: ChatPlus | null;

  async ngOnInit() {
    this.subscription.add(
      this.store.select(getuserChats).subscribe((chats) => {
        if (chats) {
          this.chats = cloneDeep(chats);
          this.chats.sort((a, b) => b.updatedAt - a.updatedAt);
          this.filterChats();

          if (this.activeChat) {
            const isActiveChatUnread = chats.some(({ messagesId, isRead }) => {
              return this.activeChat!.messagesId === messagesId && !isRead;
            });
            if (isActiveChatUnread) this.markAsRead(this.activeChat.messagesId);
          }
        }
      })
    );
    this.subscription.add(
      this.store.select(getChat).subscribe((chat) => {
        this.activeChat = chat;
      })
    );
    this.subscription.add(
      this.store.select(getUser).subscribe((user) => {
        if (user) this.user = user;
      })
    );
    this.subscription.add(
      this.store.select(getUserBlocked).subscribe((blocked) => {
        if (blocked) this.notifyBlockedHim();
      })
    );
    this.subscription.add(
      this.store.select(getUserId).subscribe(async (uid) => {
        if (uid) {
          let init: boolean, chats: ChatPlus[];
          this.userChatsRef = doc(db, 'userchats', uid);

          this.userChatsSnapUnSub = onSnapshot(
            this.userChatsRef,
            async (docSnap) => {
              if (docSnap.exists()) {
                [, this.userChats, init, chats, this.userSnapUnSubs] = [
                  this.userSnapUnSubs.forEach((unSub) => unSub()),
                  <UserChats>docSnap.data(),
                  false,
                  [],
                  [],
                ];
                
                this.userChats.chats.forEach((userChat, i, { length }) => {
                  this.userSnapUnSubs.push(
                    onSnapshot(
                      doc(db, 'users', userChat.correspondentId),
                      (docSnap) => {
                        if (docSnap.exists()) {
                          const correspondent = <User>docSnap.data();
                          if (!init) {
                            chats = [
                              ...chats,
                              <ChatPlus>{
                                ...userChat,
                                correspondent,
                              },
                            ];
                            this.notifyMessagedMe(userChat, correspondent);

                            if (i === length - 1) {
                              init = true;
                              this.store.dispatch(userChatsChanged({ chats }));
                            }
                          } else {
                            if (this.chats.length) {
                              const index = findIndex(this.chats, [
                                'correspondentId',
                                correspondent.uid,
                              ]);

                              this.notifyBlockedMe(correspondent);

                              this.chats[index].correspondent = correspondent;
                              this.store.dispatch(
                                userChatsChanged({ chats: this.chats })
                              );
                            }
                          }
                        }
                      },
                      (error) => {
                        this.alertService.message.set({
                          content: error.message,
                          type: 'error',
                        });
                      }
                    )
                  );
                });
              }
            },
            (error) => {
              this.alertService.message.set({
                content: error.message,
                type: 'error',
              });
            }
          );
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.subscription.add(
      this.searchInput.valueChanges?.subscribe((value: string) => {
        this.filter = removeExtraWhiteSpace(value).toLowerCase();
        this.filterChats();
      })
    );
  }

  toggleAddMode() {
    this.addMode = !this.addMode;
  }

  onChatActivated(chat: ChatPlus) {
    if (this.activeChat?.messagesId !== chat.messagesId) {
      chat = {
        ...chat,
        blockedHim: this.user.blocked.includes(chat.correspondentId),
        blockedMe: chat.correspondent.blocked.includes(this.user.uid),
      };
      this.store.dispatch(chatSet({ chat }));
      this.markAsRead(chat.messagesId);
    }
  }

  private filterChats() {
    if (this.filter) {
      this.filteredChats = this.chats.filter(({ correspondent }) => {
        return correspondent.username.indexOf(this.filter) !== -1;
      });
    } else this.filteredChats = this.chats;
  }

  private async markAsRead(messagesId: string) {
    const i = [this.filteredChats, this.userChats.chats].map((chats) =>
      findIndex(chats, ['messagesId', messagesId])
    );
    this.filteredChats[i[0]] = {
      ...this.filteredChats[i[0]],
      isRead: true,
    };
    this.userChats.chats[i[1]] = {
      ...this.userChats.chats[i[1]],
      isRead: true,
    };
    try {
      await updateDoc(this.userChatsRef, { ...this.userChats });
    } catch (error: any) {
      this.alertService.message.set({
        content: error.message,
        type: 'error',
      });
    }
  }

  private notifyMessagedMe(snapChat: Chat, correspondent: User) {
    if (this.chats.length) {
      const chat = find(this.chats, ['messagesId', snapChat.messagesId]);
      if (
        chat &&
        this.activeChat?.messagesId !== chat.messagesId &&
        chat.lastMessage !== snapChat.lastMessage
      ) {
        this.alertService.message.set({
          content: `New message from ${title(correspondent.username)}`,
          type: 'info',
        });
      } else if (!chat) {
        if (correspondent.uid !== this.user.uid) {
          this.searchInput.reset('');
        }
        this.alertService.message.set({
          content: `New chat with ${title(correspondent.username)}`,
          type: 'info',
        });
      }
    }
  }

  private notifyBlockedMe(correspondent: User) {
    if (this.chats.length) {
      const chat = find(this.chats, ['correspondentId', correspondent.uid]);

      if (chat && !isEqual(chat.correspondent.blocked, correspondent.blocked)) {
        const blockedMe = correspondent.blocked.includes(this.user.uid);
        this.setBlockedMe(chat, correspondent, blockedMe);

        const uname = title(correspondent.username);
        this.alertService.message.set({
          content: `You've just ${blockedMe ? 'block' : 'unblock'} by ${uname}`,
          type: 'info',
        });
      }
    }
  }

  private setBlockedMe(
    chat: ChatPlus,
    correspondent: User,
    blockedMe: boolean
  ) {
    if (this.activeChat?.messagesId === chat.messagesId) {
      this.activeChat = {
        ...this.activeChat,
        correspondent,
        blockedMe,
      };
      this.store.dispatch(chatSet({ chat: this.activeChat }));
    }
  }

  private notifyBlockedHim() {
    if (this.activeChat) {
      const blockedHim = this.user.blocked.includes(
        this.activeChat.correspondentId
      );
      const username = title(this.activeChat.correspondent.username);

      this.alertService.message.set({
        content: `You've just ${blockedHim ? 'block' : 'unblock'} ${username}`,
        type: 'success',
      });

      this.setBlockedHim(this.activeChat, blockedHim);
    }
  }

  private setBlockedHim(chat: ChatPlus, blockedHim: boolean) {
    this.store.dispatch(chatSet({ chat: { ...chat, blockedHim } }));
  }

  ngOnDestroy(): void {
    this.userChatsSnapUnSub();
    this.userSnapUnSubs.forEach((unSub) => unSub());
    this.subscription.unsubscribe();
  }
}
