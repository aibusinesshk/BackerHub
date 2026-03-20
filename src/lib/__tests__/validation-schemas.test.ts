import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate schemas from API routes to test independently
const createListingSchema = z.object({
  tournamentId: z.string().uuid('Invalid tournament ID'),
  markup: z.number().min(1, 'Markup must be at least 1.0').max(2, 'Markup cannot exceed 2.0'),
  totalActionOffered: z.number().int().min(1).max(100, 'Max 100% action'),
  minThreshold: z.number().int().min(0).max(100).optional().default(0),
});

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  subject: z.enum(['general', 'backing', 'selling', 'payment', 'account', 'partnership']).optional().default('general'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
});

const investmentSchema = z.object({
  listingId: z.string().uuid(),
  sharesPurchased: z.number().int().min(1).max(100),
});

describe('createListingSchema', () => {
  const validListing = {
    tournamentId: '550e8400-e29b-41d4-a716-446655440000',
    markup: 1.1,
    totalActionOffered: 50,
  };

  it('accepts valid input', () => {
    const result = createListingSchema.safeParse(validListing);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minThreshold).toBe(0); // default
    }
  });

  it('rejects non-UUID tournament ID', () => {
    const result = createListingSchema.safeParse({ ...validListing, tournamentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects markup below 1.0', () => {
    const result = createListingSchema.safeParse({ ...validListing, markup: 0.5 });
    expect(result.success).toBe(false);
  });

  it('rejects markup above 2.0', () => {
    const result = createListingSchema.safeParse({ ...validListing, markup: 2.5 });
    expect(result.success).toBe(false);
  });

  it('rejects action > 100%', () => {
    const result = createListingSchema.safeParse({ ...validListing, totalActionOffered: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts optional minThreshold', () => {
    const result = createListingSchema.safeParse({ ...validListing, minThreshold: 25 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.minThreshold).toBe(25);
  });
});

describe('contactSchema', () => {
  const validContact = {
    name: 'John',
    email: 'john@example.com',
    message: 'Hello, I have a question.',
  };

  it('accepts valid input with defaults', () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.subject).toBe('general');
  });

  it('rejects invalid email', () => {
    const result = contactSchema.safeParse({ ...validContact, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = contactSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects message over 5000 chars', () => {
    const result = contactSchema.safeParse({ ...validContact, message: 'a'.repeat(5001) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid subject enum value', () => {
    const result = contactSchema.safeParse({ ...validContact, subject: 'hacking' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid subject values', () => {
    for (const subj of ['general', 'backing', 'selling', 'payment', 'account', 'partnership']) {
      const result = contactSchema.safeParse({ ...validContact, subject: subj });
      expect(result.success).toBe(true);
    }
  });
});

describe('investmentSchema', () => {
  it('accepts valid input', () => {
    const result = investmentSchema.safeParse({
      listingId: '550e8400-e29b-41d4-a716-446655440000',
      sharesPurchased: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects 0 shares', () => {
    const result = investmentSchema.safeParse({
      listingId: '550e8400-e29b-41d4-a716-446655440000',
      sharesPurchased: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects fractional shares', () => {
    const result = investmentSchema.safeParse({
      listingId: '550e8400-e29b-41d4-a716-446655440000',
      sharesPurchased: 10.5,
    });
    expect(result.success).toBe(false);
  });
});
