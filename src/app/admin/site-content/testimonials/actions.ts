'use server';

export async function generateTestimonialContent(clientName: string, promptSeed: string): Promise<string> {
  return `${clientName} says: ${promptSeed}`;
}
