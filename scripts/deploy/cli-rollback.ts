import { runRemoteSSH } from "./remote-exec.js";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1];
const targetCommit = args.find((a) => a.startsWith("--commit="))?.split("=")[1];

console.log("=== MindKid Remote Rollback ===");
const remoteCmd = `/srv/mindkid/current/infra/scripts/rollback.sh${targetCommit ? ` --commit ${targetCommit}` : ""}`;

const res = runRemoteSSH({
  host: hostArg,
  dryRun,
  command: remoteCmd,
});

process.exit(res.success ? 0 : 1);
