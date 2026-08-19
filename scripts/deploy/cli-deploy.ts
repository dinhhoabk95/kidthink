import { getCurrentCommitHash, runRemoteSSH } from "./remote-exec.js";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const hostArg = args.find((a) => a.startsWith("--host="))?.split("=")[1];
const commit = getCurrentCommitHash();

console.log(`=== MindKid Remote Deploy (Commit: ${commit}) ===`);
const remoteCmd = `/srv/mindkid/current/infra/scripts/release.sh --commit ${commit}${dryRun ? " --dry-run" : ""}`;

const res = runRemoteSSH({
  host: hostArg,
  dryRun,
  command: remoteCmd,
});

process.exit(res.success ? 0 : 1);
