import { runRemoteSSH } from "./remote-exec.js";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1];

console.log("=== MindKid Remote Host Provisioning ===");
const remoteCmd = "/srv/mindkid/current/infra/scripts/provision.sh";

const res = runRemoteSSH({
  host: hostArg,
  dryRun,
  command: remoteCmd,
});

process.exit(res.success ? 0 : 1);
