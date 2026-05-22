import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Gift, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [vipCode, setVipCode] = useState('');
  const [redeemingVip, setRedeemingVip] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!redeemCode.trim()) {
      toast.error('请输入兑换码');
      return;
    }

    setRedeeming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/redeem/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('兑换成功！', {
          description: `获得 ${data.pointsAdded} 积分，当前总积分: ${data.totalPoints}`,
        });
        setRedeemCode('');
        // Refresh user data to update points display
        await refreshUser();
      } else if (response.status === 404) {
        toast.error('兑换码不存在');
      } else if (response.status === 400 && data.error === '兑换码已被使用') {
        toast.warning('兑换码已被使用');
      } else {
        throw new Error(data.error || '兑换失败');
      }
    } catch (error: any) {
      toast.error(error.message || '兑换失败');
    } finally {
      setRedeeming(false);
    }
  };

  const handleRedeemVip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vipCode.trim()) {
      toast.error('请输入VIP码');
      return;
    }

    setRedeemingVip(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vip/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: vipCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('VIP兑换成功！', {
          description: `获得 ${data.daysAdded} 天VIP，到期日期: ${data.vipExpireDate}`,
        });
        setVipCode('');
        // Refresh user data to update VIP status
        await refreshUser();
      } else if (response.status === 404) {
        toast.error('VIP码不存在');
      } else if (response.status === 400 && data.error === '兑换码已被使用') {
        toast.warning('VIP码已被使用');
      } else {
        throw new Error(data.error || 'VIP兑换失败');
      }
    } catch (error: any) {
      toast.error(error.message || 'VIP兑换失败');
    } finally {
      setRedeemingVip(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">个人中心</h1>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div>
                  <span className="font-semibold text-gray-500">用户名:</span>
                  <span className="ml-2 text-lg">{user?.username}</span>
               </div>
               <div>
                  <span className="font-semibold text-gray-500">积分:</span>
                  <span className="ml-2 text-lg font-bold text-primary">{user?.points || 0}</span>
               </div>
               <div>
                  <span className="font-semibold text-gray-500">VIP状态:</span>
                  {(user as any)?.vip_expire_date ? (
                    <span className="ml-2 text-lg font-bold text-amber-600 flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      VIP (到期: {new Date((user as any).vip_expire_date).toLocaleDateString()})
                    </span>
                  ) : (
                    <span className="ml-2 text-lg text-muted-foreground">非VIP</span>
                  )}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Redeem Points Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              兑换积分
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">兑换码</label>
                <Input
                  placeholder="请输入兑换码"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  disabled={redeeming}
                />
              </div>
              <Button type="submit" disabled={redeeming} className="w-full">
                {redeeming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    兑换中...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    立即兑换
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Redeem VIP Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              兑换VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeemVip} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">VIP码</label>
                <Input
                  placeholder="请输入VIP码"
                  value={vipCode}
                  onChange={(e) => setVipCode(e.target.value)}
                  disabled={redeemingVip}
                />
              </div>
              <Button type="submit" disabled={redeemingVip} className="w-full bg-amber-600 hover:bg-amber-700">
                {redeemingVip ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    兑换中...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    立即兑换VIP
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
