import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, ExternalLink, Copy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { PurchasedGame } from '@/lib/api-types';

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<PurchasedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check login status
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('请先登录后查看游戏库');
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Fetch purchased games
  useEffect(() => {
    if (!user) return;

    const fetchGames = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        });

        const response = await fetch(`${API_BASE_URL}/game/purchased?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setGames(data.games);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        } else {
          throw new Error('获取游戏库失败');
        }
      } catch (error: any) {
        toast.error(error.message || '获取游戏库失败');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [page, user, API_BASE_URL]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制到剪贴板`);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">我的游戏库</h1>
          <p className="text-muted-foreground">
            {!loading && <span>共 {total} 个游戏</span>}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* No Games */}
        {!loading && games.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">游戏库为空</p>
              <p className="text-sm text-muted-foreground mt-2">
                快去搜索并领取游戏吧！
              </p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                前往首页
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Games List */}
        {!loading && games.length > 0 && (
          <>
            <div className="grid gap-4">
              {games.map((game) => (
                <Card key={game.purchase_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-xl">{game.game_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {game.game_type && (
                            <Badge variant="secondary">{game.game_type}</Badge>
                          )}
                          <span className="text-xs">
                            领取时间: {new Date(game.purchase_date).toLocaleString()}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Download URL */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">下载链接:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={game.download_url}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(game.download_url, '下载链接')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(game.download_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Extract Password (Baidu Pan) */}
                    {game.extract_password && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">提取码:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={game.extract_password}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(game.extract_password!, '提取码')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Password (Game File) */}
                    {game.password && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">解压码:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={game.password}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-muted rounded-md"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(game.password!, '解压码')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    {game.note && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">备注:</label>
                        <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                          {game.note}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
