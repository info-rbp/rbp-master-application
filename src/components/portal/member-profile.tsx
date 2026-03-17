import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Badge } from '@/lib/gamification/badges';

interface MemberProfileProps {
    name: string;
    email: string;
    avatarUrl?: string;
    badges: Badge[];
    points: number;
}

export function MemberProfile({ name, email, avatarUrl, badges, points }: MemberProfileProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar>
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-bold">{name}</h2>
                    <p className="text-muted-foreground">{email}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold">Badges</h3>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {badges.map((badge) => (
                            <UiBadge key={badge.id} variant="secondary">
                                {badge.name}
                            </UiBadge>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Points</h3>
                    <p className="text-2xl font-bold">{points}</p>
                </div>
            </CardContent>
        </Card>
    );
}
