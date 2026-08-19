import { runRemoteSSH } from "./remote-exec.js";

const args = process.argv.slice(2);
const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1];

console.log("=== MindKid Remote System Status ===");
const remoteCmd =
  "pm2 status && echo '' && docker ps && echo '' && curl -s http://127.0.0.1:3000/api/guest/health || true";

const res = runRemoteSSH({
  host: hostArg,
  dryRun: false,
  command: remoteCmd,
});

process.exit(res.success ? 0 : 1);
