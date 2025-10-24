import { SimMsg, SimIntent } from "./types";

export type MessageHandler = (msg: SimMsg) => void;
export type IntentSender = (intent: SimIntent) => void;

export interface SimTransport {
  onMessage(handler: MessageHandler): void;
  sendIntent(intent: SimIntent): void;
  terminate(): void;
}

export class WorkerTransport implements SimTransport {
  private worker: Worker;
  private handler?: MessageHandler;

  constructor() {
    this.worker = new Worker(
      new URL("../workers/engine.worker.ts", import.meta.url),
      { type: "module" }
    );
  }

  onMessage(handler: MessageHandler): void {
    this.handler = handler;
    this.worker.onmessage = (event: MessageEvent<SimMsg>) => {
      this.handler?.(event.data);
    };
  }

  sendIntent(intent: SimIntent): void {
    this.worker.postMessage(intent);
  }

  terminate(): void {
    this.worker.terminate();
  }
}
