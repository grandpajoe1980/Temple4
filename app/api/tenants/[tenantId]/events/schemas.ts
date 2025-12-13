import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  visibility: z.enum(['PUBLIC', 'MEMBERS_ONLY', 'PRIVATE_LINK']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
  locationText: z.string().optional(),
  locationId: z.string().optional(),
  posterStorageKey: z.string().optional(),
  posterUrl: z.string().optional(),
  registrationRequired: z.boolean().optional(),
  registrationOpenAt: z.string().datetime().optional(),
  registrationCloseAt: z.string().datetime().optional(),
  capacityLimit: z.number().int().positive().optional(),
  waitlistEnabled: z.boolean().optional(),
  price: z.number().optional(),
  url: z.string().url().optional(),
  organizerId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  recurrenceRule: z.string().nullish(),
  recurrenceGroupId: z.string().optional(),
  volunteerRoles: z.array(z.object({
    roleName: z.string().min(1),
    capacity: z.number().int().positive()
  })).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  notifyAttendees: z.boolean().optional(),
  updateFuture: z.boolean().optional(),
});

export const listEventsQuerySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  visibility: z.string().optional(),
  tag: z.string().optional(),
  includeDrafts: z.boolean().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export const rsvpSchema = z.object({
  status: z.enum(['GOING', 'INTERESTED', 'NOT_GOING']).optional().default('GOING'),
  role: z.enum(['ATTENDEE', 'VOLUNTEER']).optional(),
  volunteerRoleId: z.string().optional(),
  notes: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
});
