import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChatPlus, User } from '../models/models';
import { getChat, getUser } from '../app-state/app-selectors';
import { CommonModule } from '@angular/common';
import { auth, db } from '../firebase.config';
import { doc, updateDoc } from 'firebase/firestore';
import { Subscription } from 'rxjs';
import { without } from 'lodash-es';
import { AlertService } from '../services/alert.service';
import { chatSet } from '../chat-list/state/actions';

@Component({
  selector: 'app-chat-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-settings.component.html',
  styleUrl: './chat-settings.component.scss',
})
export class ChatSettingsComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);

  readonly alertService = inject(AlertService);
  
  private readonly subscription = new Subscription();
  private user: User;
  
  activeChat = new ChatPlus();

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
  }

  async blockContact(block: boolean) {
    try {
      await updateDoc(doc(db, 'users', this.user.uid), {
        ...this.user,
        blocked: block
          ? [...this.user.blocked, this.activeChat.correspondentId]
          : without(this.user.blocked, this.activeChat.correspondentId),
      });
    } catch (error: any) {
      this.alertService.message.set({
        content: error.message,
        type: 'error',
      });
    }
  }

  async logout() {
    auth.signOut();
    
    this.alertService.message.set({
      content: `You're offline.`,
      type: 'success',
    });
  }

  closeChat() {
    this.store.dispatch(chatSet({ chat: null }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
