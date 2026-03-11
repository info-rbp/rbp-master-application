import type { PartnerOffer, PastProject, Testimonial } from './definitions';

export const sortByDisplayOrderThenCreatedAt = <T extends { displayOrder?: number; createdAt: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 0;
    const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export function getPublicPartnerOffers(offers: PartnerOffer[], now = Date.now()): PartnerOffer[] {
  return sortByDisplayOrderThenCreatedAt(
    offers.filter((offer) => offer.active && (!offer.expiresAt || new Date(offer.expiresAt).getTime() > now)),
  );
}

export function getPublicTestimonials(testimonials: Testimonial[]): Testimonial[] {
  return sortByDisplayOrderThenCreatedAt(testimonials.filter((testimonial) => testimonial.active));
}

export function getPublicPastProjects(projects: PastProject[]): PastProject[] {
  return sortByDisplayOrderThenCreatedAt(projects.filter((project) => project.active));
}
