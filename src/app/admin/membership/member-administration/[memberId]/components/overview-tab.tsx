
import React from 'react';
import { Member } from '../../../components/columns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OverviewTabProps {
  member: Member;
}

export function OverviewTab({ member }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No recent activity to display.</p>
            {/* TODO: Populate with actual activity data */}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Assigned Administrator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="" alt={member.assignedAdmin} />
                <AvatarFallback>{member.assignedAdmin.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{member.assignedAdmin}</p>
                <p className="text-sm text-muted-foreground">Administrator</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No notes to display.</p>
             {/* TODO: Populate with actual notes data */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
