import { TestimonialsManager } from '@/app/admin/components/admin-content-managers';
import { getTestimonials } from '@/lib/data';

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonials();
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Testimonials</h2>
      <TestimonialsManager initial={testimonials} />
    </div>
  );
}
