import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query as Q,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { isEmail, removeExtraWhiteSpace } from '../utils/utils';
import { Chat, ChatMessages, ChatPlus, User } from '../models/models';
import { Store } from '@ngrx/store';
import { getUser, getuserChats } from '../app-state/app-selectors';
import { Subscription } from 'rxjs';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-add-contact',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-contact.component.html',
  styleUrl: './add-contact.component.scss',
})
export class AddContactComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly subscription = new Subscription();

  readonly alertService = inject(AlertService);

  private userChats: ChatPlus[];
  private user: User;

  @Output() readonly added = new EventEmitter();
  keyword = '';
  contact?: User | null;

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(getUser).subscribe((user) => {
        this.user = user!;
      })
    );
    this.subscription.add(
      this.store.select(getuserChats).subscribe((chats) => {
        if (chats) this.userChats = chats;
      })
    );
  }
  async search() {
    const keyword = removeExtraWhiteSpace(this.keyword).toLowerCase();
    if (keyword) {
      try {
        if (this.isTryToAddMyself(keyword)) {
          this.contact = null;
          throw new Error('You can not add yourself.');
        }
        if (this.isChatWithAlready(keyword)) {
          this.contact = null;
          throw new Error('You are already in chat with this contact.');
        }

        const query = Q(
          collection(db, 'users'),
          where(isEmail(keyword) ? 'email' : 'username', '==', keyword)
        );
        const querySnapShot = await getDocs(query);

        if (querySnapShot.empty) {
          this.contact = null;
          throw new Error('No contact with this username or email.');
        }

        this.contact = querySnapShot.docs[0].data() as User;
      } catch (error: any) {
        this.alertService.message.set({
          content: error.message,
          type: 'error',
        });
      }
    }
  }

  async addNewContact() {
    const newChatMessagesRef = doc(collection(db, 'chatmessages'));
    try {
      await setDoc(newChatMessagesRef, {
        messages: [],
        createdAt: new Date(),
      } as ChatMessages);

      await this.updateUsersChats(
        newChatMessagesRef.id,
        this.contact!.uid,
        this.user.uid
      );
    } catch (error: any) {
      this.alertService.message.set({
        content: error.message,
        type: 'error',
      });
    }
  }

  private async updateUsersChats(
    messagesId: string,
    ...uids: [string, string]
  ) {
    uids.forEach(async (uid, i) => {
      await updateDoc(doc(db, 'userchats', uid), {
        chats: arrayUnion({
          messagesId,
          lastMessage: '',
          correspondentId: uids[+!i],
          updatedAt: Date.now(),
        } as Chat),
      });
    });
  }

  private isChatWithAlready(keyword: string) {
    return this.userChats.some(
      ({ correspondent }) =>
        correspondent.username === keyword || correspondent.email === keyword
    );
  }

  private isTryToAddMyself(keyword: string) {
    return this.user.username === keyword || this.user.email === keyword;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
