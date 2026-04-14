import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId: string;
  traceId: string;
  method?: string;
  path?: string;
  userId?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run<T>(context: RequestContextStore, callback: () => T) {
    return this.storage.run(context, callback);
  }

  get() {
    return this.storage.getStore();
  }

  getRequestId() {
    return this.get()?.requestId;
  }

  getTraceId() {
    return this.get()?.traceId;
  }

  setUserId(userId: string) {
    const store = this.get();
    if (store) {
      store.userId = userId;
    }
  }
}
