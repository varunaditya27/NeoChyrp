import { addFilter } from '@/src/lib/triggers';
import { validateChallenge } from './store';

// Hook into captcha_validate filter name used by comments module
addFilter('captcha_validate', (current: boolean, token?: string, answer?: string) => {
  if (!current) return current; // previous filters disabled
  const ok = validateChallenge(token, answer);
  return ok;
});
