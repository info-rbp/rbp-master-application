import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';

const projects = [
  {
    title: "Global SaaS FinTech Expansion",
    description: "Led the international expansion for a Series B FinTech company, establishing their presence in North America and Europe. This involved developing the market entry strategy, setting up local entities, and building the initial team.",
    image: placeholderImages.projectImage1,
    tags: ["Strategy", "International Expansion", "FinTech"]
  },
  {
    title: "Capital Raise for HealthTech Innovator",
    description: "Managed a successful $15M Series A capital raise. Responsible for financial modeling, pitch deck creation, data room management, and investor negotiations, resulting in a 20% oversubscription.",
    image: placeholderImages.projectImage2,
    tags: ["Capital Raising", "HealthTech", "Financial Modeling"]
  },
  {
    title: "Operational Turnaround for E-commerce Brand",
    description: "Executed a complete operational and financial turnaround for a direct-to-consumer e-commerce business. Restructured the supply chain, implemented a new ERP system, and optimized unit economics to achieve profitability within 9 months.",
    image: placeholderImages.projectImage3,
    tags: ["Operations", "E-commerce", "Turnaround"]
  }
];

export default function PastProjectsPage() {
  const { projectsHero } = placeholderImages;

  return (
    <div>
      <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Our Track Record
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            We've partnered with ambitious companies to navigate complex challenges and deliver tangible results. Explore some of our past projects.
          </p>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:gap-12">
            {projects.map((project, index) => (
              <Card key={project.title} className="grid lg:grid-cols-2 overflow-hidden">
                <div className={`flex items-center justify-center ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <Image
                    src={project.image.src}
                    alt={project.title}
                    width={project.image.width}
                    height={project.image.height}
                    data-ai-hint={project.image.hint}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col p-6 md:p-8">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl">{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-base md:text-lg">
                      {project.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
