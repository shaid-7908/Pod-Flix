import {z} from 'zod'

export const channelSchema = z.object({
  channel_name: z
    .string()
    .min(3, "Channel name should be at least 3 character long"),
  channel_description: z
    .string()
    .min(20, "Description should be at least 20 character long"),
  channel_unique_name:z.string().min(3,'Unique name should be at least 3 character long'),
  
});