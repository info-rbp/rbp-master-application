'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

const ONBOARDING_TASKS = [
    { id: 'explore-knowledge-center', label: 'Explore the Knowledge Center', link: '/knowledge-center' },
    { id: 'discover-tools', label: 'Discover Powerful Tools', link: '/tools' },
    { id: 'unlock-partner-offers', label: 'Unlock Partner Offers', link: '/partner-offers' },
    { id: 'complete-profile', label: 'Complete your profile', link: '/settings/profile' },
];

export default function WelcomePage() {
    const [completedTasks, setCompletedTasks] = useState<string[]>([]);

    const handleTaskToggle = (taskId: string) => {
        setCompletedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    const completionPercentage = (completedTasks.length / ONBOARDING_TASKS.length) * 100;

    return (
        <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to the Platform!</h1>
            <p className="text-lg text-muted-foreground mb-8">We're excited to have you on board. Here are a few steps to get you started:</p>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Onboarding Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress value={completionPercentage} className="mb-4" />
                    <div className="space-y-2 text-left">
                        {ONBOARDING_TASKS.map((task) => (
                            <div key={task.id} className="flex items-center gap-4 p-2 rounded-md transition-colors hover:bg-muted/50">
                                <Checkbox
                                    id={task.id}
                                    checked={completedTasks.includes(task.id)}
                                    onCheckedChange={() => handleTaskToggle(task.id)}
                                />
                                <label htmlFor={task.id} className="flex-1 text-sm font-medium">{task.label}</label>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={task.link}>Go</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 text-left">
                <Card>
                    <CardHeader>
                        <CardTitle>Explore the Knowledge Center</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Access a wealth of articles, guides, and resources to help you grow your business.</p>
                        <Button asChild variant="outline">
                            <Link href="/knowledge-center">Browse Articles</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Discover Powerful Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Use our suite of tools to streamline your operations and improve your productivity.</p>
                        <Button asChild variant="outline">
                            <Link href="/tools">View Tools</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Unlock Partner Offers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">Take advantage of exclusive discounts and offers from our network of partners.</p>
                        <Button asChild variant="outline">
                            <Link href="/partner-offers">See Offers</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">Ready to dive in?</h2>
                <p className="text-muted-foreground mb-6">You're all set to explore the platform. We recommend starting with a tool that interests you.</p>
                <Button asChild size="lg">
                    <Link href="/tools">Find a Tool</Link>
                </Button>
            </div>
        </div>
    );
}
