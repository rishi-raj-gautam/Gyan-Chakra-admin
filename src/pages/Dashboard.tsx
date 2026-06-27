import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api/analytics.api';
import {
  Users,
  UserCheck,
  Coins,
  Award,
  Activity,
  TrendingUp,
  PieChart as PieIcon,
  Loader2,
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

export const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => analyticsApi.getDetailedAnalytics(),
    refetchInterval: 60000, // Auto-refetch every 60 seconds
  });

  const COLORS = ['#D4A34F', '#0B1525', '#F4C878', '#1E293B'];

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <span className="text-sm font-semibold text-text-muted">Analyzing platform telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex flex-col gap-3 items-start">
        <div className="space-y-1">
          <h3 className="font-bold text-rose-500">Error Loading Analytics</h3>
          <p className="text-sm text-text-muted">Failed to communicate with metrics aggregator. Please verify the API is running.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 rounded-xl text-xs font-bold text-rose-400 cursor-pointer transition-colors duration-150"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { overview, userGrowthTrend, participationTrend, rewardDistribution } = data;

  const cardData = [
    {
      title: 'Total Users',
      value: overview.totalUsers,
      desc: 'Registered audience',
      icon: Users,
      color: 'text-gold bg-gold/10 border-gold/20',
    },
    {
      title: 'Active Users',
      value: overview.activeUsers,
      desc: 'Active status count',
      icon: UserCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Rewards Distributed',
      value: `₹${Number(overview.totalRewardsDistributed).toLocaleString()}`,
      desc: 'Credited earnings',
      icon: Coins,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Total Winners',
      value: overview.totalWinners,
      desc: 'Draws finalised',
      icon: Award,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card) => (
          <div
            key={card.title}
            className="p-6 bg-background-card rounded-2xl border border-white/5 shadow-xl flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                {card.title}
              </span>
              <h2 className="text-2xl font-black text-white">{card.value}</h2>
              <p className="text-xxs text-text-muted tracking-wide">{card.desc}</p>
            </div>
            <div className={`p-3.5 rounded-xl border ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Area Chart */}
        <div className="lg:col-span-2 p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Audience Growth Trend
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A34F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4A34F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" stroke="#B5B5B5" fontSize={10} tickLine={false} />
                <YAxis stroke="#B5B5B5" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1525', borderColor: 'rgba(212,163,79,0.2)' }}
                  labelStyle={{ color: '#D4A34F', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="users" stroke="#D4A34F" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reward Distribution Pie Chart */}
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4" />
            Rewards Allocation
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

      {/* Participation & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participation Bar Chart */}
        <div className="lg:col-span-2 p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
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

        {/* Recent Winners Feed */}
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl space-y-4 flex flex-col">
          <h3 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" />
            Latest Prize Draws
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-72">
            {overview.recentWinners?.length > 0 ? (
              overview.recentWinners.map((winner: any) => (
                <div
                  key={winner._id}
                  className="p-3 bg-background/40 hover:bg-background/60 rounded-xl border border-white/5 flex items-center gap-3 transition-colors duration-150"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-extrabold text-xs uppercase shadow-inner">
                    {winner.userId?.name?.slice(0, 2) || 'WN'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <span className="block text-xs font-bold text-white truncate">
                      {winner.userId?.name || 'User'}
                    </span>
                    <span className="block text-xxs text-text-muted uppercase tracking-wider mt-0.5">
                      {winner.contestType?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-extrabold text-gold">
                      +₹{winner.rewardAmount}
                    </span>
                    <span className="block text-xxs text-text-muted/60 mt-0.5">
                      {new Date(winner.announcementDate || winner.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center py-12 text-center text-text-muted">
                No recent draws detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
