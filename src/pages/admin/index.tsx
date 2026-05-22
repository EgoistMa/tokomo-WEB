import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Gamepad2, Ticket, Users, TrendingUp, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalGames: number;
  totalCodes: number;
  unusedCodes: number;
  usedCodes: number;
  totalUsers?: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalGames: 0,
    totalCodes: 0,
    unusedCodes: 0,
    usedCodes: 0,
  });
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || !(user as any).is_admin)) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        // Fetch games count
        const gamesResponse = await fetch(`${API_BASE_URL}/game/list?limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const gamesData = await gamesResponse.json();

        // Fetch all redeem codes count
        const allCodesResponse = await fetch(`${API_BASE_URL}/redeem/codes?limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const allCodesData = await allCodesResponse.json();

        // Fetch unused codes count
        const unusedCodesResponse = await fetch(`${API_BASE_URL}/redeem/codes?limit=1&used=0`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const unusedCodesData = await unusedCodesResponse.json();

        // Fetch used codes count
        const usedCodesResponse = await fetch(`${API_BASE_URL}/redeem/codes?limit=1&used=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const usedCodesData = await usedCodesResponse.json();

        setStats({
          totalGames: gamesData.pagination?.total || 0,
          totalCodes: allCodesData.pagination?.total || 0,
          unusedCodes: unusedCodesData.pagination?.total || 0,
          usedCodes: usedCodesData.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, API_BASE_URL]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p>加载中...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: '游戏总数',
      value: stats.totalGames,
      icon: Gamepad2,
      description: '系统中的游戏总数',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/games',
      linkText: '管理游戏',
    },
    {
      title: '兑换码总数',
      value: stats.totalCodes,
      icon: Ticket,
      description: '已创建的兑换码总数',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/admin/paymentCode',
      linkText: '管理兑换码',
    },
    {
      title: '未使用兑换码',
      value: stats.unusedCodes,
      icon: TrendingUp,
      description: '可用的兑换码数量',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/admin/paymentCode',
      linkText: '查看详情',
    },
    {
      title: '已使用兑换码',
      value: stats.usedCodes,
      icon: Users,
      description: '已被兑换的兑换码',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      link: '/admin/paymentCode',
      linkText: '查看详情',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">管理仪表盘</h1>
        <p className="text-muted-foreground mt-1">
          欢迎回来, {user?.username}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={cn('p-2 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
                <Button
                  variant="link"
                  className="px-0 h-auto mt-2"
                  onClick={() => navigate(card.link)}
                >
                  {card.linkText} →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>游戏管理</CardTitle>
            <CardDescription>添加、编辑或删除游戏</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/admin/games')}>
              <Gamepad2 className="mr-2 h-4 w-4" />
              管理游戏
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>兑换码管理</CardTitle>
            <CardDescription>创建和管理兑换码</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/admin/paymentCode')}>
              <Ticket className="mr-2 h-4 w-4" />
              管理兑换码
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>网站配置</CardTitle>
            <CardDescription>管理网站设置和内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/admin/config')}>
              <Settings className="mr-2 h-4 w-4" />
              网站设置
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
