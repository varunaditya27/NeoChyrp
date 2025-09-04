/** Lightweight in-process job scheduler (cron alternative) */
const jobs: { name: string; intervalMs: number; lastRun: number; fn: () => Promise<void> | void }[] = [];
let ticking = false;

export function registerJob(name: string, intervalMs: number, fn: () => Promise<void> | void) {
  jobs.push({ name, intervalMs, lastRun: 0, fn });
  if (!ticking) start();
}

function start() {
  ticking = true;
  const loop = async () => {
    const now = Date.now();
    for (const job of jobs) {
      if (now - job.lastRun >= job.intervalMs) {
        job.lastRun = now;
        Promise.resolve(job.fn()).catch(e => console.warn(`[job:${job.name}] failed`, e));
      }
    }
    setTimeout(loop, 15_000); // coarse 15s tick
  };
  loop();
}
