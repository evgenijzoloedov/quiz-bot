import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, namesApi } from '../api';
import type { Name } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Select } from '../components/ui';
import { formatTime, formatPercentage } from '../utils/formatters';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [selectedName, setSelectedName] = useState<string>('');

  const { data: namesData } = useQuery({
    queryKey: ['names'],
    queryFn: () => namesApi.getAll({ limit: 100 }),
  });

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
  });

  const { data: nameData, isLoading: nameLoading } = useQuery({
    queryKey: ['analytics', 'name', selectedName],
    queryFn: () => analyticsApi.getNameAnalytics(selectedName),
    enabled: !!selectedName,
  });

  const nameOptions = namesData?.data?.map((nameDoc: Name) => ({
    value: nameDoc.name,
    label: nameDoc.name,
  })) || [];

  const stats = overviewData?.data;
  const nameStats = nameData?.data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Аналитика</h1>
        <p className="text-[#606070] mt-1">Статистика прохождения квизов</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-[#1a1a24] rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#606070] mb-1">Всего пользователей</p>
                    <p className="text-3xl font-bold text-[#f0f0f5]">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#606070] mb-1">Завершений</p>
                    <p className="text-3xl font-bold text-[#f0f0f5]">{stats?.totalCompletions || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#606070] mb-1">Успешность</p>
                    <p className="text-3xl font-bold text-[#f0f0f5]">
                      {formatPercentage(stats?.completionRate || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#606070] mb-1">Среднее время</p>
                    <p className="text-3xl font-bold text-[#f0f0f5]">
                      {formatTime(stats?.averageTimeSpent || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Name Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-accent-400" />
              <CardTitle>Аналитика по имени</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select
            options={nameOptions}
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            placeholder="Выберите имя..."
          />

          {selectedName && (
            <>
              {nameLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : nameStats ? (
                <div className="space-y-6">
                  {/* Name Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-[#0a0a0f] border border-[#1a1a24]">
                      <p className="text-xs text-[#606070] mb-1">Попыток</p>
                      <p className="text-xl font-bold text-[#f0f0f5]">{nameStats.totalAttempts}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#0a0a0f] border border-[#1a1a24]">
                      <p className="text-xs text-[#606070] mb-1">Успешно</p>
                      <p className="text-xl font-bold text-green-400">{nameStats.completions}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#0a0a0f] border border-[#1a1a24]">
                      <p className="text-xs text-[#606070] mb-1">Успешность</p>
                      <p className="text-xl font-bold text-accent-400">
                        {formatPercentage(nameStats.completionRate)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#0a0a0f] border border-[#1a1a24]">
                      <p className="text-xs text-[#606070] mb-1">Среднее время</p>
                      <p className="text-xl font-bold text-[#f0f0f5]">
                        {formatTime(nameStats.averageTimeSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Question Stats */}
                  {nameStats.questionStats && nameStats.questionStats.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-[#a0a0b0] mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Статистика по вопросам (от сложных к лёгким)
                      </h4>
                      <div className="space-y-3">
                        {nameStats.questionStats.map((qs, index) => (
                          <div
                            key={qs.questionId}
                            className="p-4 rounded-lg bg-[#0a0a0f] border border-[#1a1a24]"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm text-[#f0f0f5] flex-1 pr-4 line-clamp-2">
                                {index + 1}. {qs.questionText}
                              </p>
                              <span className={`text-sm font-medium ${
                                qs.accuracy >= 80 ? 'text-green-400' :
                                qs.accuracy >= 50 ? 'text-amber-400' :
                                'text-red-400'
                              }`}>
                                {formatPercentage(qs.accuracy)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-[#606070]">
                              <span className="text-green-400">✓ {qs.correctCount}</span>
                              <span className="text-red-400">✗ {qs.incorrectCount}</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  qs.accuracy >= 80 ? 'bg-green-500' :
                                  qs.accuracy >= 50 ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${qs.accuracy}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-[#606070] py-8">
                  Нет данных для этого имени
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

