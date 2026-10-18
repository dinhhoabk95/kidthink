#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runEngineAllocationCli } from "#scripts/check-engine-allocation";

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runEngineAllocationCli());
}
