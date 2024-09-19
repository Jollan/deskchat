import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  createUserWithEmailAndPassword as register,
  signInWithEmailAndPassword as login,
  deleteUser,
} from 'firebase/auth';
import {
  setDoc,
  doc,
  collection,
  getDocs,
  query as Q,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { CommonModule } from '@angular/common';
import { upload } from '../firebase.utils';
import { User } from '../models/models';
import { Store } from '@ngrx/store';
import { loading } from './state/actions';
import { removeExtraWhiteSpace } from '../utils/utils';
import { Observable } from 'rxjs';
import { getLoaded } from '../app-state/app-selectors';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy, OnInit {
  private readonly store = inject(Store);

  readonly alertService = inject(AlertService);

  private avatar: File;

  operationType: 'login' | 'register' = 'login';
  avatarDisplayUrl = '';
  loaded$?: Observable<boolean>;

  ngOnInit(): void {
    this.loaded$ = this.store.select(getLoaded);
  }

  async onFormSubmitted(form: NgForm) {
    let { username, about, email, password } = form.value;

    try {
      this.store.dispatch(loading({ loaded: false }));

      const userCredential = await { login, register }[this.operationType](
        auth,
        email,
        password
      );

      if (this.operationType === 'register') {
        username = removeExtraWhiteSpace(username).toLowerCase();

        if (!(await this.isUsernameUnique(username))) {
          throw new Error('Enter another username.');
        }

        let user = {} as User;
        if (this.avatar) {
          user.avatar = await upload('users/pps', this.avatar);
        }
        user = {
          ...user,
          username,
          email,
          about: removeExtraWhiteSpace(about) || 'God is more than able.',
          createdAt: new Date(),
          blocked: [],
          uid: userCredential.user.uid,
        };

        await setDoc(doc(db, 'users', user.uid), user);
        await setDoc(doc(db, 'userchats', user.uid), { chats: [] });
      }
    } catch (error: any) {
      this.alertService.message.set({
        content: error.message,
        type: 'error',
      });

      if (this.operationType === 'register') {
        const user = auth.currentUser;
        if (user) {
          try {
            await deleteUser(user);
          } catch (error) {
            this.alertService.message.set({
              content: 'Something went wrong please try again later.',
              type: 'error',
            });
          }
        }
      }

      this.store.dispatch(loading({ loaded: true }));
    }
  }

  onFileSelected(event: any) {
    this.avatar = event.target.files[0];
    if (this.avatar) {
      URL.revokeObjectURL(this.avatarDisplayUrl);
      this.avatarDisplayUrl = URL.createObjectURL(this.avatar);
    }
  }

  private async isUsernameUnique(username: string) {
    const query = Q(collection(db, 'users'), where('username', '==', username));
    const snapshot = await getDocs(query);
    
    return snapshot.empty;
  }

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.avatarDisplayUrl);
  }
}
