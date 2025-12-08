import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui';
import { formatTime, formatPercentage } from '../utils/formatters';
import { 
  Users, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  BarChart3
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        Ошибка загрузки данных
      </div>
    );
  }

  const stats = data?.data;

  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      title: 'Имен',
      value: stats?.totalNames || 0,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-500/30',
    },
    {
      title: 'Вопросов',
      value: stats?.totalQuestions || 0,
      icon: HelpCircle,
      color: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-500/30',
    },
    {
      title: 'Завершений',
      value: stats?.totalCompletions || 0,
      icon: CheckCircle,
      color: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-500/30',
    },
    {
      title: 'Успешность',
      value: formatPercentage(stats?.completionRate || 0),
      icon: TrendingUp,
      color: 'from-accent-500 to-accent-600',
      shadowColor: 'shadow-accent-500/30',
    },
    {
      title: 'Среднее время',
      value: formatTime(stats?.averageTimeSpent || 0),
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      shadowColor: 'shadow-cyan-500/30',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Дашборд</h1>
        <p className="text-[#606070] mt-1">Обзор статистики Quiz Bot</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title}
            className="group hover:border-[#3a3a4a] transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#606070] mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-[#f0f0f5]">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadowColor} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Names */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-accent-400" />
            <CardTitle>Популярные имена</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.namesByPopularity && stats.namesByPopularity.length > 0 ? (
            <div className="space-y-4">
              {stats.namesByPopularity.map((nameItem, index) => {
                const maxCompletions = stats.namesByPopularity[0].completions;
                const percentage = (nameItem.completions / maxCompletions) * 100;

                return (
                  <div key={nameItem.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#f0f0f5] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#1a1a24] flex items-center justify-center text-xs text-[#606070]">
                          {index + 1}
                        </span>
                        {nameItem.name}
                      </span>
                      <span className="text-[#a0a0b0]">
                        {nameItem.completions} завершений
                      </span>
                    </div>
                    <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#606070] py-8">
              Нет данных о завершениях
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

