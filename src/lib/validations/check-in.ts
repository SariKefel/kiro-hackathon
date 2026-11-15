import { z } from "zod";
import { safetyStatuses } from "@/types/domain";

export const checkInPayloadSchema = z
  .object({
    userId: z.string().min(1).max(128),
    safetyStatus: z.enum(safetyStatuses),
    message: z.string().trim().max(500),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
  })
  .strict()
  .refine((value) => (value.latitude === null) === (value.longitude === null), {
    message: "Provide both latitude and longitude, or neither.",
    path: ["latitude"],
  });

export const operationSchema = z
  .object({
    id: z.uuid(),
    type: z.literal("personnel.check_in"),
    version: z.literal(1),
    organizationId: z.uuid(),
    incidentId: z.uuid(),
    clientRecordedAt: z.iso.datetime(),
    payload: checkInPayloadSchema,
  })
  .strict();
export const syncRequestSchema = z
  .object({ version: z.literal(1), operations: z.array(operationSchema).min(1).max(25) })
  .strict();
export const acknowledgementSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(["confirmed", "unavailable", "rejected"]),
    serverReceivedAt: z.iso.datetime().optional(),
    message: z.string().optional(),
  })
  .refine((ack) => ack.status !== "confirmed" || Boolean(ack.serverReceivedAt));
export const syncResponseSchema = z.object({
  version: z.literal(1),
  acknowledgements: z.array(acknowledgementSchema),
});
export type CheckInPayload = z.infer<typeof checkInPayloadSchema>;
export type CheckInOperation = z.infer<typeof operationSchema>;
export type SyncResponse = z.infer<typeof syncResponseSchema>;
