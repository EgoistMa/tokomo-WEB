import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">个人中心</h1>
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
                <span className="ml-2 text-lg">{user?.points || 0}</span>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
