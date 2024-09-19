import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatAreaComponent } from './chat-area/chat-area.component';
import { ChatSettingsComponent } from './chat-settings/chat-settings.component';
import { AddContactComponent } from './add-contact/add-contact.component';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { ChatPlus, User } from './models/models';
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth';
import { auth, db } from './firebase.config';
import { doc, onSnapshot } from 'firebase/firestore';
import { loading, userStateChanged } from './login/state/actions';
import { getChat, getUser } from './app-state/app-selectors';
import { resetState } from './app-state/app-actions';
import { RootState } from './models/app-state.model';
import { AlertService } from './services/alert.service';
import { SnackbarComponent } from './utils/components/snackbar/snackbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ChatListComponent,
    ChatAreaComponent,
    ChatSettingsComponent,
    AddContactComponent,
    LoginComponent,
    SnackbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  readonly alertService = inject(AlertService);
  
  private readonly subscription = new Subscription();
  private unSub: Unsubscribe;

  user?: User | null;
  activeChat$?: Observable<ChatPlus | null>;

  ngOnInit(): void {
    this.subscription.add(
      this.store.select(getUser).subscribe((user) => {
        this.user = user;
      })
    );

    this.activeChat$ = this.store.select(getChat);

    onAuthStateChanged(
      auth,
      (authuser) => {
        this.store.dispatch(loading({ loaded: false }));

        if (authuser) {
          this.unSub?.();
          this.unSub = onSnapshot(
            doc(db, 'users', authuser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                if (!this.user) {
                  this.store.dispatch(loading({ loaded: true }));

                  this.alertService.message.set({
                    content: `You're online.`,
                    type: 'success',
                  });
                }

                this.store.dispatch(
                  userStateChanged({ user: <User>docSnap.data() })
                );
              }
            },
            (error) => {
              this.store.dispatch(loading({ loaded: true }));
              
              this.alertService.message.set({
                content: error.message,
                type: 'error',
              });
            }
          );
        } else this.store.dispatch(resetState({ state: {} as RootState }));
      },
      (error) => {
        this.alertService.message.set({
          content: error.message,
          type: 'error',
        });
      }
    );
  }

  hideSnackbar() {
    return setTimeout(() => this.alertService.message.set(null), 5500);
  }

  ngOnDestroy(): void {
    this.unSub?.();
    this.subscription.unsubscribe();
  }
}
