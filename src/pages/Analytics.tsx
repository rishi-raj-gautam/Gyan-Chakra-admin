import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api/analytics.api';
import {
  TrendingUp,
  Activity,
  Award,
  Calendar,
  Loader2,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch detailed analytics
  const { data, isLoading } = useQuery({
    queryKey: ['deepAnalytics', fromDate, toDate],
    queryFn: () => analyticsApi.getDetailedAnalytics(),
  });

  const COLORS = ['#D4A34F', '#F4C878', '#1E293B', '#334155'];

  if (isLoading || !data) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <span className="text-sm font-semibold text-text-muted">Compiling telemetry charts...</span>
      </div>
    );
  }

  const { userGrowthTrend, participationTrend, rewardDistribution } = data;

  const topContests = [
    { name: 'Independence Day Mega', plays: 1200, winner: 'Ritesh Kumar' },
    { name: 'Daily Science Quiz #22', plays: 850, winner: 'Priya Sharma' },
    { name: 'Weekly GK Blast #4', plays: 780, winner: 'Amit Verma' },
    { name: 'Cricket Special Trivia', plays: 720, winner: 'Rohan Sen' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">Platform Analytics Hub</h2>
          <p className="text-xs text-text-muted mt-0.5">Deep telemetry audits on user retention, contest plays, and payouts</p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2 bg-background-card border border-white/5 p-2 rounded-xl">
          <Calendar className="w-4 h-4 text-gold ml-1.5" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 bg-background text-xxs font-bold uppercase rounded-lg border border-gold/10 text-white cursor-pointer"
          />
          <span className="text-xxs text-text-muted">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 bg-background text-xxs font-bold uppercase rounded-lg border border-gold/10 text-white cursor-pointer"
          />
        </div>
      </div>

      {/* Ratios Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <span className="block text-xxs font-bold text-text-muted uppercase tracking-wider">DAU / MAU Ratio</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">28.4%</span>
            <span className="text-xxs font-bold text-emerald-400">+1.2% MoM</span>
          </div>
          <p className="text-xxs text-text-muted mt-1 leading-normal">sticky user index engagement score</p>
        </div>

        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <span className="block text-xxs font-bold text-text-muted uppercase tracking-wider">Retention (D30)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-gold">42.8%</span>
            <span className="text-xxs font-bold text-emerald-400">+0.8%</span>
          </div>
          <p className="text-xxs text-text-muted mt-1 leading-normal">player return rates after 30 days</p>
        </div>

        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <span className="block text-xxs font-bold text-text-muted uppercase tracking-wider">Avg. Session Length</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-white">8.5m</span>
            <span className="text-xxs font-bold text-text-muted">Stable</span>
          </div>
          <p className="text-xxs text-text-muted mt-1 leading-normal">time spent per contest round</p>
        </div>

        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <span className="block text-xxs font-bold text-text-muted uppercase tracking-wider">Win Conversion</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-emerald-400">12.5%</span>
            <span className="text-xxs font-bold text-rose-500">-0.2%</span>
          </div>
          <p className="text-xxs text-text-muted mt-1 leading-normal">ratio of entrants drawing a prize</p>
        </div>
      </div>

      {/* Main charting grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User growth area */}
        <div className="lg:col-span-2 p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Audience Scale Timeline
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userDeepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A34F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4A34F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#B5B5B5" fontSize={10} tickLine={false} />
                <YAxis stroke="#B5B5B5" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1525', borderColor: 'rgba(212,163,79,0.2)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#D4A34F" strokeWidth={2} fillOpacity={1} fill="url(#userDeepGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rewards Pie Chart */}
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4" />
            Rewards Allocation Breakdown
          </h3>
          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rewardDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rewardDistribution.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1525', borderColor: 'rgba(212,163,79,0.2)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xxs text-text-muted">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Submissions & High Performing Contests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participation Bar Chart */}
        <div className="lg:col-span-2 p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Contest Submissions Analysis
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={participationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#B5B5B5" fontSize={10} tickLine={false} />
                <YAxis stroke="#B5B5B5" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1525', borderColor: 'rgba(212,163,79,0.2)' }}
                />
                <Legend iconSize={8} formatter={(value) => <span className="text-xxs text-text-muted capitalize">{value}</span>} />
                <Bar dataKey="quiz" name="Daily Quiz" fill="#D4A34F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="challenge" name="Mega Challenge" fill="#F4C878" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing table */}
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4 flex flex-col">
          <h3 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" />
            Top Performing Contests
          </h3>
          <div className="flex-grow space-y-3.5 max-h-72 overflow-y-auto">
            {topContests.map((c, i) => (
              <div
                key={i}
                className="p-3 bg-background/40 hover:bg-background/60 rounded-xl border border-white/5 flex items-center justify-between transition-all"
              >
                <div>
                  <span className="block text-xs font-bold text-white leading-none">{c.name}</span>
                  <span className="block text-xxs text-text-muted mt-1.5">Winner: {c.winner}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-black text-gold">{c.plays} plays</span>
                  <span className="block text-xxs text-emerald-400 mt-1 font-semibold">100% Filled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
