import { Injectable, signal } from '@angular/core';

type Message = {
  content: string;
  type: 'success' | 'error' | 'warning' | 'info';
};

@Injectable({ providedIn: 'root' })
export class AlertService {
  message = signal<Message | null>(null);
}
