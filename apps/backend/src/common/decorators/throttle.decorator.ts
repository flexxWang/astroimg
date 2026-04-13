import { SetMetadata } from '@nestjs/common';

export const THROTTLE_OPTIONS_KEY = 'throttle:options';
export const THROTTLE_SKIP_KEY = 'throttle:skip';

export type ThrottleOptions = {
  limit: number;
  ttl: number;
  keyPrefix?: string;
};

export const Throttle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_OPTIONS_KEY, options);

export const SkipThrottle = () => SetMetadata(THROTTLE_SKIP_KEY, true);
