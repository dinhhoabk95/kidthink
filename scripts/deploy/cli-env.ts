import { runRemoteSSH } from "./remote-exec.js";

const args = process.argv.slice(2);
const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1];

console.log("=== MindKid Remote Environment File Check ===");
const remoteCmd =
  "ls -la /etc/mindkid/env/ && stat -c '%a %U:%G %n' /etc/mindkid/env/* 2>/dev/null || true";

const res = runRemoteSSH({
  host: hostArg,
  dryRun: false,
  command: remoteCmd,
});

process.exit(res.success ? 0 : 1);
