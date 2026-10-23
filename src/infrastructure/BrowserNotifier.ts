import type {
  NotificationTone,
  Notifier,
} from "../domain/ports";

export interface NotificationEvent {
  id: string;
  message: string;
  tone: NotificationTone;
}

export type NotificationListener = (event: NotificationEvent) => void;

export class BrowserNotifier implements Notifier {
  private readonly listeners = new Set<NotificationListener>();

  notify(message: string, tone: NotificationTone = "info"): void {
    const event: NotificationEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      tone,
    };
    for (const listener of this.listeners) listener(event);
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
