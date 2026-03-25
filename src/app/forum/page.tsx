
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: any;
}

export default function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchPosts = async () => {
    const postsCollection = collection(db, 'forum_posts');
    const postSnapshot = await getDocs(postsCollection);
    const postList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    setPosts(postList);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleNewPost = async () => {
    if (user) {
      await addDoc(collection(db, 'forum_posts'), {
        title,
        content,
        author: user.email,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setContent('');
      fetchPosts();
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Community Forum</h1>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">New Post</h2>
        <Input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-2"
        />
        <Textarea
          placeholder="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleNewPost}>Create Post</Button>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Posts</h2>
        <ul className="space-y-4">
          {posts.map(post => (
            <li key={post.id} className="border rounded-lg p-4">
              <Link href={`/forum/${post.id}`}>
                <h3 className="font-bold">{post.title}</h3>
              </Link>
              <p>by {post.author}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
