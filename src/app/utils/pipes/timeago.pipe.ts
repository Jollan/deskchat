import {
  Pipe,
  PipeTransform,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';

@Pipe({
  standalone: true,
  name: 'timeago',
  pure: false,
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer: any;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  transform(value: Date): string {
    this.removeTimer();
    const time = this.getTimeAgo(value);

    this.timer = setInterval(() => {
      this.changeDetectorRef.markForCheck();
    }, 60000);

    return time;
  }

  private removeTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    const intervals: Record<string, number> = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const interval in intervals) {
      const time = Math.floor(seconds / intervals[interval]);
      if (time > 1) {
        return `${time} ${interval}s ago`;
      } else if (time === 1) {
        return `1 ${interval} ago`;
      }
    }

    return 'Just now';
  }

  ngOnDestroy(): void {
    this.removeTimer();
  }
}
