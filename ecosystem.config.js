/**
 * pm2 process file for the SAAHS production server (Next.js `output: "standalone"`).
 *
 * Use this instead of `PORT=3030 pm2 start .next/standalone/server.js` —
 * env vars passed inline on `pm2 start` are only applied on that first
 * start; they are NOT remembered across `pm2 restart`/`pm2 reload`, so a
 * later restart silently drops PORT back to Next's default (3000). Keeping
 * the env here means every restart/reload/reboot uses the same config.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save              # persist the process list across server reboots
 *   pm2 startup           # (one-time) generate the OS boot script
 */

module.exports = {
  apps: [
    {
      name: "saahs",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3030,
        HOSTNAME: "0.0.0.0",
      },
      exec_mode: "fork",
      instances: 1,
      watch: false,
      max_memory_restart: "512M",
    },
  ],
};
