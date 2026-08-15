import { defineEventHandler } from "h3";
import assetUsageHandler from "./[...ref]/usage.get.js";

export default defineEventHandler((event) => assetUsageHandler(event));
