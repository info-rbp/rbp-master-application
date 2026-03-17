'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createResource } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewResourcePage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [slug, setSlug] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createResource({
            title,
            content,
            slug,
            status,
            seoTitle,
            seoDescription,
        });
        router.push('/admin/resources');
    };

    return (
        <div className="p-4 pt-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Resource</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        <Textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required />
                        <Input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                        <Select onValueChange={(value: 'draft' | 'published') => setStatus(value)} value={status}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="SEO Title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                        <Textarea placeholder="SEO Description" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
                        <Button type="submit">Create</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
