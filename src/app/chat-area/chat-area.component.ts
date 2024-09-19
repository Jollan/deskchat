import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Store } from '@ngrx/store';
import {
  arrayUnion,
  doc,
  DocumentReference,
  getDoc,
  onSnapshot,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import {
  getChat,
  getChatMessagesId,
  getUser,
} from '../app-state/app-selectors';
import {
  ChatMessages,
  ChatPlus,
  Message,
  User,
  UserChats,
} from '../models/models';
import { db } from '../firebase.config';
import { FormsModule } from '@angular/forms';
import { upload } from '../firebase.utils';
import { messageSent } from './state/actions';
import { ImageLoaderComponent } from '../utils/components/image-loader/image-loader.component';
import { Subscription } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { TimeAgoPipe } from '../utils/pipes/timeago.pipe';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [
    CommonModule,
    PickerComponent,
    FormsModule,
    TimeAgoPipe,
    ImageLoaderComponent,
  ],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);

  readonly alertService = inject(AlertService);

  @ViewChild('ref') private ref: ElementRef;
  private readonly subscription = new Subscription();
  private chatMessagesUnSub: Unsubscribe;
  private chatMessagesRef: DocumentReference;
  private image?: File;

  user = new User();
  activeChat = new ChatPlus();
  chatMessages = new ChatMessages();
  input = '';

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(getUser).subscribe((user) => {
        if (user) this.user = user;
      })
    );
    this.subscription.add(
      this.store.select(getChat).subscribe((chat) => {
        if (chat) this.activeChat = chat;
      })
    );
    this.subscription.add(
      this.store.select(getChatMessagesId).subscribe((chatMessagesId) => {
        if (chatMessagesId) {
          this.chatMessagesUnSub?.();

          this.chatMessagesRef = doc(db, 'chatmessages', chatMessagesId);

          this.chatMessagesUnSub = onSnapshot(
            this.chatMessagesRef,
            (docSnap) => {
              if (docSnap.exists()) {
                this.chatMessages = docSnap.data() as ChatMessages;
                this.scroll();
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

  addEmoji(event: any) {
    this.input += event.emoji.native;
  }

  async onImageSelected(event: any) {
    this.image = event.target.files[0];
    if (this.image) {
      const message = {
        image: URL.createObjectURL(this.image),
        senderId: this.user.uid,
        createdAt: new Date(),
      };
      this.chatMessages.messages.push(message) && this.scroll();

      this.store.dispatch(
        messageSent({ lastMessage: 'Photo', updatedAt: Date.now() })
      );
      try {
        if (!this.activeChat.blockedHim && !this.activeChat.blockedMe) {
          const image = await upload('media/images', this.image);
          await this.updateMessagesDoc({ ...message, image });
        }
      } catch (error: any) {
        this.alertService.message.set({
          content: error.message,
          type: 'error',
        });
      } finally {
        this.image = undefined;
      }
    }
  }

  async send() {
    const text = this.input.trim();
    if (text) {
      this.input = '';

      const message = {
        text,
        senderId: this.user.uid,
        createdAt: new Date(),
      };
      this.chatMessages.messages.push(message) && this.scroll();

      this.store.dispatch(
        messageSent({ lastMessage: text, updatedAt: Date.now() })
      );
      try {
        if (!this.activeChat.blockedHim && !this.activeChat.blockedMe) {
          await this.updateMessagesDoc(message);
        }
      } catch (error: any) {
        this.alertService.message.set({
          content: error.message,
          type: 'error',
        });
      }
    }
  }

  private async updateMessagesDoc(message: Message) {
    await updateDoc(this.chatMessagesRef, { messages: arrayUnion(message) });

    await this.updateUsersChats(
      message.text ?? 'Photo',
      this.activeChat.correspondentId,
      this.user.uid
    );
  }

  private async updateUsersChats(lastMessage: string, ...uids: string[]) {
    uids.forEach(async (uid) => {
      const userChatsRef = doc(db, 'userchats', uid);

      const docSnap = await getDoc(userChatsRef);

      if (docSnap.exists()) {
        const userChats = docSnap.data() as UserChats;

        const chatIndex = userChats.chats.findIndex(({ messagesId }) => {
          return this.activeChat.messagesId === messagesId;
        });

        userChats.chats[chatIndex] = {
          ...userChats.chats[chatIndex],
          lastMessage,
          isRead: uid === this.user.uid ? true : false,
          updatedAt: Date.now(),
        };

        await updateDoc(userChatsRef, { ...userChats });
      }
    });
  }

  private scroll() {
    return setTimeout(() => {
      this.ref.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  ngOnDestroy(): void {
    this.chatMessagesUnSub();
    this.subscription.unsubscribe();
  }
}
