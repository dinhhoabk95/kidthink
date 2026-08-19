import { runRemoteSSH } from "./remote-exec.js";

const args = process.argv.slice(2);
const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1];
const appArg = args.find((a) => !a.startsWith("--")) || "web";

console.log(`=== MindKid Remote Logs for ${appArg} ===`);
const remoteCmd = `tail -n 100 -f /var/log/mindkid/${appArg}/out.log /var/log/mindkid/${appArg}/error.log 2>/dev/null || pm2 logs mindkid-${appArg} --lines 100`;

const res = runRemoteSSH({
  host: hostArg,
  dryRun: false,
  command: remoteCmd,
});

process.exit(res.success ? 0 : 1);
