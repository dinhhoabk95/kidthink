import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  throw new ValidationError(
    "Game templates are Layer 1 code definitions and cannot be created via API (BR-GTC-04)"
  );
});
