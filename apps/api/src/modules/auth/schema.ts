import { z } from "zod";

export const unlockSchema = z.object({
  password: z.string().min(1).max(256),
});
