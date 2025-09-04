import crypto from 'crypto';

interface CaptchaEntry {
  id: string;
  prompt: string;
  answerHash: string; // sha256(answer + id)
  expiresAt: number; // epoch ms
}

const CAP_EXPIRE_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, CaptchaEntry>();

function hashAnswer(answer: string, id: string) {
  return crypto.createHash('sha256').update(answer + '::' + id).digest('hex');
}

export function createMathChallenge() {
  // simple two-number operation
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const op = ['+','-','*'][Math.floor(Math.random()*3)];
  const id = crypto.randomBytes(8).toString('hex');
  // compute answer
  // eslint-disable-next-line no-eval
  const answer = eval(`${a}${op}${b}`);
  const prompt = `${a} ${op} ${b} = ?`;
  const answerHash = hashAnswer(String(answer), id);
  const entry: CaptchaEntry = { id, prompt, answerHash, expiresAt: Date.now() + CAP_EXPIRE_MS };
  store.set(id, entry);
  return { token: id, prompt, ttl: CAP_EXPIRE_MS / 1000 };
}

export function validateChallenge(id: string | undefined | null, answer: string | undefined | null) {
  if (!id || !answer) return false;
  const entry = store.get(id);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { store.delete(id); return false; }
  const ok = entry.answerHash === hashAnswer(String(answer), id);
  if (ok) store.delete(id); // single-use
  return ok;
}

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [k,v] of store.entries()) if (v.expiresAt < now) store.delete(k);
}, 60 * 1000).unref();
