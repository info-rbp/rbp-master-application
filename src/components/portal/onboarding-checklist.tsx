import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { awardBadge } from '@/lib/gamification/badges';

const checklistItems = [
    { id: 'profile', label: 'Complete your profile' },
    { id: 'feedback', label: 'Provide feedback on an article' },
    { id: 'explore', label: 'Explore a service page' },
];

export function OnboardingChecklist({ userId }: { userId: string }) {
    const [completedItems, setCompletedItems] = useState<string[]>([]);
    const { toast } = useToast();

    const handleItemToggle = (itemId: string) => {
        setCompletedItems((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const handleCompleteOnboarding = async () => {
        if (completedItems.length === checklistItems.length) {
            const success = await awardBadge(userId, 'onboarding_complete');
            if (success) {
                toast({ title: 'Onboarding Complete', description: 'You have earned a new badge!' });
            } else {
                toast({ title: 'Onboarding Already Completed', description: 'You have already earned this badge.' });
            }
        } else {
            toast({ title: 'Incomplete Checklist', description: 'Please complete all items in the checklist.' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Onboarding Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Complete these tasks to get started.</p>
                <div className="space-y-2">
                    {checklistItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={item.id}
                                checked={completedItems.includes(item.id)}
                                onCheckedChange={() => handleItemToggle(item.id)}
                            />
                            <label htmlFor={item.id}>{item.label}</label>
                        </div>
                    ))}
                </div>
                <Button onClick={handleCompleteOnboarding}>Complete Onboarding</Button>
            </CardContent>
        </Card>
    );
}
