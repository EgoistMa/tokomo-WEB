import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Settings, Gamepad2, Ticket, LayoutDashboard, Users, UsersRound, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Check if user is admin
  useEffect(() => {
    if (!loading && (!user || !(user as any).is_admin)) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>加载中...</p>
      </div>
    );
  }

  if (!user || !(user as any).is_admin) {
    return null;
  }

  const menuItems = [
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: '仪表盘',
      exact: true,
    },
    {
      path: '/admin/users',
      icon: Users,
      label: '用户管理',
    },
    {
      path: '/admin/games',
      icon: Gamepad2,
      label: '游戏管理',
    },
    {
      path: '/admin/paymentCode',
      icon: Ticket,
      label: '兑换码管理',
    },
    {
      path: '/admin/vipCode',
      icon: Crown,
      label: 'VIP码管理',
    },
    {
      path: '/admin/groups',
      icon: UsersRound,
      label: '群组管理',
    },
    {
      path: '/admin/config',
      icon: Settings,
      label: '网站配置',
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <Card className="p-4 sticky top-20">
            <div className="space-y-1">
              <div className="px-3 py-2 mb-2">
                <h2 className="text-lg font-semibold">管理后台</h2>
              </div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
