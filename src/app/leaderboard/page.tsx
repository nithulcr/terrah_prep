'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import UserLayout from '@/app/user-layout';

interface LeaderboardEntry {
  user_id: string;
  email: string;
  full_name: string;
  total_points: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select(`
          total_points,
          user_id,
          user:profiles(email, full_name)
        `)
        .order('total_points', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading leaderboard:', error);
        return;
      }

      const formattedData = data?.map((entry: any, index: number) => ({
        user_id: entry.user_id,
        email: entry.user?.email || 'Unknown',
        full_name: entry.user?.full_name || 'Anonymous',
        total_points: entry.total_points,
        rank: index + 1,
      })) || [];

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error in loadLeaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-slate-600">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <UserLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Trophy className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Top Contributors</h1>
          <p className="text-slate-600">Recognizing our most active community members</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-12 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No rankings yet</h3>
              <p className="text-slate-600">
                Be the first to report questions and earn points to appear on the leaderboard!
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <Card
                key={entry.user_id}
                className={`border-2 transition-all hover:shadow-md ${
                  entry.rank <= 3 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-white' : 'border-slate-200'
                }`}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {entry.full_name || entry.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{entry.email}</p>
                    </div>

                    {/* Points */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-blue-600">{entry.total_points}</p>
                      <p className="text-xs text-slate-500">points</p>
                    </div>

                    {/* Badge */}
                    {entry.rank <= 3 && (
                      <Badge className={getRankBadge(entry.rank)}>
                        {entry.rank === 1 ? '🥇 Champion' : entry.rank === 2 ? '🥈 Runner-up' : '🥉 Third'}
                      </Badge>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {!loading && leaderboard.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Showing top {leaderboard.length} contributors
            </p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}