'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { updateResource, deleteResource, getResources, Resource } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditResourcePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [resource, setResource] = useState<Resource | null>(null);

    useEffect(() => {
        if (id) {
            const fetchResource = async () => {
                const resources = await getResources();
                const resource = resources.find(r => r.id === id);
                if (resource) {
                    setResource(resource);
                    setTitle(resource.title);
                    setContent(resource.content);
                    setSlug(resource.slug);
                    setStatus(resource.status);
                    setSeoTitle(resource.seoTitle || '');
                    setSeoDescription(resource.seoDescription || '');
                }
            };
            fetchResource();
        }
    }, [id]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [slug, setSlug] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (id) {
            await updateResource(id as string, {
                title,
                content,
                slug,
                status,
                seoTitle,
                seoDescription,
            });
            router.push('/admin/resources');
        }
    };

    const handleDelete = async () => {
        if (id) {
            await deleteResource(id as string);
            router.push('/admin/resources');
        }
    };

    if (!resource) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-4 pt-6 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Resource</CardTitle>
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
                        <div className="flex space-x-2">
                            <Button type="submit">Update</Button>
                            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
