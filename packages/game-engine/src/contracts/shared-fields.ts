import { z } from "zod";

export const EmojiRef = z.string().min(1);
