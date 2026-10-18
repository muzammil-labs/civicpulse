// Product identity in one place. The final name is not chosen yet (see docs/PRODUCT_PLAN.md §2),
// so it can be changed here or with NEXT_PUBLIC_BRAND_NAME without touching any page.
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Sahvaas',
  tagline: 'Your community, running smoothly.',
  civicName: 'CivicPulse',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'hello@example.com',
  city: 'Hyderabad',
} as const
