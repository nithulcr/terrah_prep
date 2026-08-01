'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Bookmark, Trash2, ExternalLink } from 'lucide-react';
import UserLayout from '@/app/user-layout';

interface BookmarkWithQuestion {
  id: number;
  question_id: number;
  created_at: string;
  question: {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation: string | null;
    category: {
      name: string;
    };
    batch: {
      batch_name: string;
    };
  };
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/bookmarks', {
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          // User doesn't have bookmarks feature in their plan
          setError('Bookmarks are not available in your current plan. Please upgrade to access this feature.');
        } else {
          setError(data.error || 'Failed to load bookmarks');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setBookmarks(data.bookmarks ?? []);
    } catch (err) {
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (questionId: number) => {
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        alert('Failed to remove bookmark');
        return;
      }

      setBookmarks((all) => all.filter((b) => b.question_id !== questionId));
    } catch (err) {
      alert('Failed to remove bookmark');
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-slate-600">Loading bookmarks...</p>
          </div>
        </main>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <main className="mx-auto max-w-2xl p-6">
          <Card>
            <CardBody className="p-8 text-center">
              <h1 className="text-2xl font-bold">Error</h1>
              <p className="mt-3 text-slate-600">{error}</p>
              <Link href="/pricing">
                <Button className="mt-6">Upgrade Plan</Button>
              </Link>
            </CardBody>
          </Card>
        </main>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            My Bookmarks
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Questions you've saved for later review
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {bookmarks.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <Bookmark className="mx-auto h-16 w-16 text-slate-400" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                No bookmarks yet
              </h3>
              <p className="mt-2 text-slate-600">
                Start practicing and bookmark questions to review them later
              </p>
              <Link href="/mock-tests">
                <Button className="mt-6">Take a Test</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="border border-slate-200 shadow-sm">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{bookmark.question.category?.name || 'General'}</Badge>
                        <Badge variant="info">
                          {(bookmark.question.batch as any)?.batch_name || 'Unknown'}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        {bookmark.question.question}
                      </h3>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>
                          <strong>A:</strong> {bookmark.question.option_a}
                        </p>
                        <p>
                          <strong>B:</strong> {bookmark.question.option_b}
                        </p>
                        <p>
                          <strong>C:</strong> {bookmark.question.option_c}
                        </p>
                        <p>
                          <strong>D:</strong> {bookmark.question.option_d}
                        </p>
                      </div>
                      {bookmark.question.explanation && (
                        <div className="mt-3 rounded-lg bg-blue-50 p-3">
                          <p className="text-sm text-slate-700">
                            <strong>Explanation:</strong> {bookmark.question.explanation}
                          </p>
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-green-600">
                          Correct Answer: {bookmark.question.correct_option}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeBookmark(bookmark.question_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
    </UserLayout>
  );
}
