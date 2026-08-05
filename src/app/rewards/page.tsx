'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge } from '@/components/ui';
import { usePoints } from '@/context/PointsContext';
import { Trophy, Gift, Sparkles, History, AlertCircle } from 'lucide-react';
import UserLayout from '@/app/user-layout';

type RewardType = 'points' | 'plan' | 'none' | null;

export default function RewardsPage() {
  const { availablePoints, canSpin, spinCost, spinHistory, loading, spin, refreshPoints, redeemPoints } = usePoints();
  const [spinning, setSpinning] = useState(false);
  const [rewardType, setRewardType] = useState<RewardType>(null);
  const [rewardValue, setRewardValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    setError('');
    setShowResult(false);
    setRewardType(null);
    
    try {
      const result = await spin();
      
      if (result.success && result.reward) {
        setRewardType(result.reward.type);
        setRewardValue(result.reward.value);
        setShowResult(true);
        await refreshPoints();
      } else if (!result.success) {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSpinning(false);
    }
  };

  const planRewards = [
    { slug: 'starter', name: 'Starter', points: 100 },
    { slug: 'pro', name: 'PRO', points: 200 },
    { slug: 'elite', name: 'Elite', points: 300 },
    { slug: 'premium', name: 'Premium', points: 400 },
  ];

  const getRewardDisplay = () => {
    if (!showResult || !rewardType) return null;

    if (rewardType === 'points') {
      return {
        icon: '🎉',
        title: 'Congratulations!',
        message: `You won ${rewardValue} Points!`,
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
      };
    }

    if (rewardType === 'plan') {
      return {
        icon: '🎉',
        title: 'Congratulations!',
        message: `You unlocked the ${rewardValue} Plan for 30 days!`,
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-800',
      };
    }

    if (rewardType === 'none') {
      return {
        icon: '😔',
        title: 'Better luck next time!',
        message: 'No reward this time. Try again!',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-800',
      };
    }

    return null;
  };

  const rewardDisplay = getRewardDisplay();

  return (
    <UserLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Rewards Center</h1>
          <p className="mt-2 text-slate-600">Earn points by reporting questions and spin the wheel for amazing rewards!</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Points Balance Card */}
          <div className="lg:col-span-1">
            <Card className="border border-slate-200 shadow-sm">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">My Points</h2>
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-12 bg-slate-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-slate-200 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-slate-600">Available Points</p>
                      <p className="text-4xl font-bold text-blue-600">{availablePoints}</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Spin Cost:</span>
                        <span className="font-semibold">{spinCost} points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Can Spin:</span>
                        <Badge variant={canSpin ? 'success' : 'danger'}>
                          {canSpin ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Spin History */}
            <Card className="border border-slate-200 shadow-sm mt-6">
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Recent Spins</h3>
                </div>
                
                {spinHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No spins yet. Try your luck!</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {spinHistory.map((spin) => (
                      <div key={spin.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{spin.reward_value}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(spin.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={spin.reward_type === 'plan' ? 'success' : 'info'}>
                          {spin.reward_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Spin Wheel Section */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm">
              <CardBody className="p-8">
                <div className="text-center">
                  <div className="mb-6">
                    <Sparkles className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Lucky Spin Wheel</h2>
                    <p className="text-slate-600">
                      Spend {spinCost} points to spin and win amazing rewards!
                    </p>
                  </div>

                  {/* Spin Wheel Display */}
                  <div className="relative mx-auto mb-8 h-80 w-80">
                    <div className={`flex h-full w-full items-center justify-center rounded-full border-8 border-yellow-400 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 shadow-2xl ${spinning ? 'animate-spin' : ''}`}>
                      <div className="text-center text-white">
                        <Gift className="mx-auto h-16 w-16 mb-2" />
                        <p className="text-xl font-bold">SPIN!</p>
                      </div>
                    </div>
                    
                    {/* Pointer */}
                    <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 -translate-y-2 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-yellow-400"></div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mx-auto mb-6 max-w-md rounded-lg bg-red-50 p-4 text-red-800">
                      <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {/* Spin Button */}
                  <Button
                    size="lg"
                    onClick={handleSpin}
                    disabled={!canSpin || spinning}
                    className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                  >
                    {spinning ? (
                      <>Spinning...</>
                    ) : canSpin ? (
                      <>Spin Now ({spinCost} points)</>
                    ) : (
                      <>Need {spinCost} points</>
                    )}
                  </Button>

                  {/* Result Display */}
                  {rewardDisplay && (
                    <div className={`mx-auto max-w-md rounded-lg p-6 ${rewardDisplay.bgColor} ${rewardDisplay.textColor}`}>
                      <div className="text-4xl mb-2">{rewardDisplay.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{rewardDisplay.title}</h3>
                      <p className="text-lg">{rewardDisplay.message}</p>
                    </div>
                  )}

                  {/* Possible Rewards */}
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Possible Rewards</h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded-lg bg-blue-50 p-3 text-center">
                        <p className="text-sm font-medium text-slate-700">10 Points</p>
                        <p className="text-xs text-slate-500">30% chance</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 text-center">
                        <p className="text-sm font-medium text-slate-700">20 Points</p>
                        <p className="text-xs text-slate-500">25% chance</p>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-3 text-center">
                        <p className="text-sm font-medium text-slate-700">50 Points</p>
                        <p className="text-xs text-slate-500">15% chance</p>
                      </div>
                      <div className="rounded-lg bg-yellow-50 p-3 text-center">
                        <p className="text-sm font-medium text-slate-700">Plan Rewards</p>
                        <p className="text-xs text-slate-500">Up to 20%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Redeem Plans Section */}
            <Card className="border border-slate-200 shadow-sm mt-6">
              <CardBody className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-semibold text-slate-900">Redeem Plans</h3>
                </div>
                
                <p className="mb-4 text-sm text-slate-600">
                  Use your points to redeem subscription plans. Each plan gives you 30 days of access!
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {planRewards.map((plan) => (
                    <div
                      key={plan.slug}
                      className="rounded-lg border-2 border-slate-200 p-4 transition-all hover:border-blue-500"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                          <p className="text-sm text-slate-600">30 days subscription</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{plan.points}</p>
                          <p className="text-xs text-slate-500">points</p>
                        </div>
                      </div>
                      <Button
                        className="mt-3 w-full"
                        variant="outline"
                        disabled={availablePoints < plan.points}
                        onClick={async () => {
                          if (confirm(`Redeem ${plan.name} plan for ${plan.points} points?`)) {
                            const result = await redeemPoints(plan.slug);
                            if (result.success) {
                              alert(result.message);
                            } else {
                              alert(result.error || 'Failed to redeem');
                            }
                          }
                        }}
                      >
                        {availablePoints >= plan.points ? (
                          <>Redeem Now</>
                        ) : (
                          <>Need {plan.points - availablePoints} more points</>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}