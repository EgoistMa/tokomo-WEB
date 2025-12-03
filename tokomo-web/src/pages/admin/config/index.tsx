import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { SiteConfig, UpdateSiteConfigRequest } from '@/lib/api-types';

const AdminConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Check if user is admin
  useEffect(() => {
    if (!loading && user && !(user as any).is_admin) {
      toast.error('需要管理员权限');
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Fetch config
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/site/config`);
      const data = await response.json();

      if (response.ok) {
        setConfig(data.config);
      } else {
        throw new Error('获取配置失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Update config
  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateData: UpdateSiteConfigRequest = {
        carousel: config.carousel,
        bannerL: config.bannerL,
        bannerR: config.bannerR,
        customerService: config.customerService,
      };

      const response = await fetch(`${API_BASE_URL}/site/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('配置更新成功');
        fetchConfig(); // Refresh config
      } else {
        throw new Error(data.error || '更新配置失败');
      }
    } catch (error: any) {
      toast.error(error.message || '更新配置失败', {
        style: {
          background: '#fee2e2',
          border: '1px solid #ef4444',
          color: '#991b1b',
        },
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Update carousel item
  const updateCarouselItem = (index: number, field: 'url' | 'title', value: string) => {
    if (!config) return;
    const newCarousel = [...config.carousel];
    newCarousel[index] = { ...newCarousel[index], [field]: value };
    setConfig({ ...config, carousel: newCarousel });
  };

  // Add carousel item
  const addCarouselItem = () => {
    if (!config) return;
    setConfig({
      ...config,
      carousel: [...config.carousel, { url: '', title: '' }],
    });
  };

  // Remove carousel item
  const removeCarouselItem = (index: number) => {
    if (!config) return;
    const newCarousel = config.carousel.filter((_, i) => i !== index);
    setConfig({ ...config, carousel: newCarousel });
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <p className="text-red-600">无法加载配置</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">网站配置</h1>
            <p className="text-muted-foreground mt-1">
              最后更新: {new Date(config.updated_at).toLocaleString()}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存配置
              </>
            )}
          </Button>
        </div>

        {/* Carousel Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>轮播图配置</CardTitle>
                <CardDescription>管理首页轮播图</CardDescription>
              </div>
              <Button onClick={addCarouselItem} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                添加轮播图
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.carousel.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label>图片 URL</Label>
                        <Input
                          value={item.url}
                          onChange={(e) => updateCarouselItem(index, 'url', e.target.value)}
                          placeholder="https://example.com/image.png"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>标题</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateCarouselItem(index, 'title', e.target.value)}
                          placeholder="图片标题"
                        />
                      </div>
                    </div>
                    {item.url && (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-32 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCarouselItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {config.carousel.length === 0 && (
              <p className="text-center text-muted-foreground py-8">暂无轮播图</p>
            )}
          </CardContent>
        </Card>

        {/* Left Banner */}
        <Card>
          <CardHeader>
            <CardTitle>左侧广告位</CardTitle>
            <CardDescription>主页左侧广告横幅</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label>图片 URL</Label>
                  <Input
                    value={config.bannerL.url}
                    onChange={(e) => setConfig({ ...config, bannerL: { ...config.bannerL, url: e.target.value } })}
                    placeholder="https://example.com/banner.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>标题</Label>
                  <Input
                    value={config.bannerL.title}
                    onChange={(e) => setConfig({ ...config, bannerL: { ...config.bannerL, title: e.target.value } })}
                    placeholder="横幅标题"
                  />
                </div>
              </div>
              {config.bannerL.url && (
                <img
                  src={config.bannerL.url}
                  alt={config.bannerL.title}
                  className="w-32 h-48 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%23ddd" width="100" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Banner */}
        <Card>
          <CardHeader>
            <CardTitle>右侧广告位</CardTitle>
            <CardDescription>主页右侧广告横幅</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label>图片 URL</Label>
                  <Input
                    value={config.bannerR.url}
                    onChange={(e) => setConfig({ ...config, bannerR: { ...config.bannerR, url: e.target.value } })}
                    placeholder="https://example.com/banner.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>标题</Label>
                  <Input
                    value={config.bannerR.title}
                    onChange={(e) => setConfig({ ...config, bannerR: { ...config.bannerR, title: e.target.value } })}
                    placeholder="横幅标题"
                  />
                </div>
              </div>
              {config.bannerR.url && (
                <img
                  src={config.bannerR.url}
                  alt={config.bannerR.title}
                  className="w-32 h-48 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="150"%3E%3Crect fill="%23ddd" width="100" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Service */}
        <Card>
          <CardHeader>
            <CardTitle>客服配置</CardTitle>
            <CardDescription>客服二维码和QQ号</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label>二维码 URL</Label>
                  <Input
                    value={config.customerService.img}
                    onChange={(e) => setConfig({ ...config, customerService: { ...config.customerService, img: e.target.value } })}
                    placeholder="https://example.com/qrcode.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>QQ 号</Label>
                  <Input
                    value={config.customerService.qq}
                    onChange={(e) => setConfig({ ...config, customerService: { ...config.customerService, qq: e.target.value } })}
                    placeholder="123456789"
                  />
                </div>
              </div>
              {config.customerService.img && (
                <img
                  src={config.customerService.img}
                  alt="客服二维码"
                  className="w-32 h-32 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E';
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button (Bottom) */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存所有配置
              </>
            )}
          </Button>
        </div>
    </div>
  );
};

export default AdminConfigPage;
