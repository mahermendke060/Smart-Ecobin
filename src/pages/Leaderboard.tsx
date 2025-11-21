import { useEffect, useMemo, useState } from 'react';
import { Recycle, TrendingUp, Trophy, Medal, Award } from 'lucide-react';
import { apiService } from '@/services/api';

type LBRow = { rank: number; user_name: string; avatar_url?: string | null; recycling_score: number; total_scans: number; is_current_user: boolean; };

const Leaderboard = () => {
  const [data, setData] = useState<LBRow[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiService.getLeaderboard();
      setData(res?.leaderboard || []);
      setYourRank(res?.current_user_rank || null);
    })();
  }, []);

  const top3 = useMemo(() => data.slice(0, 3), [data]);
  const rest = useMemo(() => data.slice(3), [data]);
  const maxPoints = useMemo(() => Math.max(1, ...(data.map(d => d.recycling_score))), [data]);
  const initials = (name: string) => (name || 'U').split(' ').map((p) => p[0]).slice(0,2).join('').toUpperCase();

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-amber-500"/>;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400"/>;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600"/>;
    return <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">{rank}</div>;
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-6 rounded-xl">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Podium (Ranking Board) */}
          <div className="order-2 lg:order-1">
            <div className="mb-4 flex justify-center items-end gap-4 px-2">
              {/* 2nd */}
              {top3[1] && (
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-2xl shadow p-4 w-32 h-36 flex flex-col items-center justify-center border-2 border-slate-300">
                    <div className="w-14 h-14 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold text-xl mb-2">{initials(top3[1].user_name)}</div>
                    <Medal className="w-7 h-7 text-slate-400 mb-1"/>
                    <div className="text-xl font-bold text-slate-700">{top3[1].recycling_score}</div>
                    <div className="text-[10px] text-gray-500">pts</div>
                  </div>
                  <div className="bg-slate-300 w-full h-20 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-3xl font-bold text-slate-600">2</span>
                  </div>
                </div>
              )}

              {/* 1st */}
              {top3[0] && (
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl shadow p-4 w-36 h-44 flex flex-col items-center justify-center border-2 border-amber-300">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-amber-600 font-bold text-2xl mb-2">{initials(top3[0].user_name)}</div>
                    <Trophy className="w-9 h-9 text-white mb-1"/>
                    <div className="text-3xl font-bold text-white">{top3[0].recycling_score}</div>
                    <div className="text-[10px] text-amber-100">pts</div>
                  </div>
                  <div className="bg-gradient-to-b from-amber-400 to-amber-500 w-full h-28 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">1</span>
                  </div>
                </div>
              )}

              {/* 3rd */}
              {top3[2] && (
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-2xl shadow p-4 w-32 h-32 flex flex-col items-center justify-center border-2 border-orange-300">
                    <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-lg mb-2">{initials(top3[2].user_name)}</div>
                    <Award className="w-6 h-6 text-orange-600 mb-1"/>
                    <div className="text-2xl font-bold text-orange-700">{top3[2].recycling_score}</div>
                    <div className="text-[10px] text-gray-500">pts</div>
                  </div>
                  <div className="bg-orange-400 w-full h-16 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-3xl font-bold text-orange-700">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed List */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-xl md:text-2xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <Recycle className="w-5 h-5"/> Top Recyclers
              </h2>
              <div className="space-y-3">
                {data.map((u) => (
                  <div key={u.rank} className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md ${u.rank===1 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' : u.rank===2 ? 'bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200' : u.rank===3 ? 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
                    {/* Rank Icon */}
                    <div className="flex-shrink-0"><RankIcon rank={u.rank}/></div>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full ${u.rank===1?'bg-amber-500':u.rank===2?'bg-slate-400':u.rank===3?'bg-orange-600':'bg-emerald-500'} flex items-center justify-center text-white font-bold text-sm`}>{initials(u.user_name)}</div>
                    {/* Name */}
                    <div className="flex-grow">
                      <div className="font-semibold text-gray-800 text-sm md:text-base">{u.user_name} {u.is_current_user && <span className="text-xs text-emerald-600 ml-1">(You)</span>}</div>
                      {u.rank===1 && <div className="text-[11px] text-emerald-600">🎯 Current Leader!</div>}
                    </div>
                    {/* Progress */}
                    <div className="flex-grow max-w-xs hidden md:block">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${u.rank===1?'bg-gradient-to-r from-amber-400 to-yellow-500':u.rank===2?'bg-gradient-to-r from-slate-400 to-gray-500':u.rank===3?'bg-gradient-to-r from-orange-500 to-red-500':'bg-emerald-500'}`} style={{width: `${Math.round(u.recycling_score/maxPoints*100)}%`}} />
                      </div>
                    </div>
                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <div className={`${u.rank===1?'text-amber-600':u.rank===2?'text-slate-600':u.rank===3?'text-orange-600':'text-emerald-600'} text-lg md:text-2xl font-bold`}>{u.recycling_score}</div>
                      <div className="text-[11px] text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>

              {yourRank && (
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-300 text-center">
                  <span className="inline-flex items-center gap-2 text-emerald-800 font-semibold"><Trophy className="w-4 h-4"/> Your current rank: #{yourRank} 🎉</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
