import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getPublishedPastProjects } from '@/lib/data';

export default async function PastProjectsPage() {
  try {
    const projects = await getPublishedPastProjects();

    return (
      <div>
        <section className="relative w-full pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Our Track Record</h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">We've partnered with ambitious companies to navigate complex challenges and deliver tangible results. Explore some of our past projects.</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            {projects.length === 0 ? (
              <Alert className="max-w-2xl mx-auto"><AlertTitle>No published projects yet</AlertTitle><AlertDescription>Check back soon for new case studies and delivery highlights.</AlertDescription></Alert>
            ) : (
              <div className="grid gap-8 md:gap-12">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <div className="flex flex-col p-6 md:p-8 gap-4">
                      <CardHeader className="p-0"><CardTitle className="text-2xl md:text-3xl">{project.name}</CardTitle></CardHeader>
                      <CardContent className="p-0"><p className="text-muted-foreground text-base md:text-lg">{project.description}</p></CardContent>
                      {project.link ? <div><Button asChild variant="outline"><Link href={project.link}>View project details</Link></Button></div> : null}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  } catch {
    return <div className="container mx-auto px-4 md:px-6 py-16"><Alert variant="destructive"><AlertTitle>Unable to load past projects</AlertTitle><AlertDescription>Please try again shortly.</AlertDescription></Alert></div>;
  }
}
