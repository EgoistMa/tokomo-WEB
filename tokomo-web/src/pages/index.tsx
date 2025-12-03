import React, { useState, useEffect } from 'react';
import Carousel from '@/components/Carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { SiteConfig } from '@/lib/api-types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [, setLoading] = useState(true);
  const [showCustomerService, setShowCustomerService] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Fetch site config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/site/config`);
        const data = await response.json();
        if (response.ok) {
          setConfig(data.config);
        }
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [API_BASE_URL]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <>
      {/* Hero Section */}
      <Carousel slides={config?.carousel} />

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12 h-[800px]">
        <div className="flex flex-col lg:flex-row gap-8 h-full">

          {/* Left Banner */}
          <div className="hidden lg:block w-[150px] flex-shrink-0">
            {config?.bannerL.url ? (
              <a href="#" className="block h-full">
                <img
                  src={config.bannerL.url}
                  alt={config.bannerL.title}
                  className="w-full h-full object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  title={config.bannerL.title}
                />
              </a>
            ) : (
              <Card className="h-full bg-muted/50 flex items-center justify-center border-dashed">
                <CardContent className="p-6">
                  <span className="text-muted-foreground font-medium text-center">广告位 / Banner</span>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Search Area */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">发现世界</h1>
              <p className="text-muted-foreground">搜索您感兴趣的内容</p>
            </div>

            <div className="w-full max-w-lg space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入关键词搜索..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">许愿</Button>
              </form>

              {/* Popular Tags or Secondary Actions can go here */}
              <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                  <span>热门搜索:</span>
                  <span
                    className="cursor-pointer hover:text-primary hover:underline"
                    onClick={() => handleTagClick('科技')}
                  >
                    科技
                  </span>
                  <span
                    className="cursor-pointer hover:text-primary hover:underline"
                    onClick={() => handleTagClick('生活')}
                  >
                    生活
                  </span>
                  <span
                    className="cursor-pointer hover:text-primary hover:underline"
                    onClick={() => handleTagClick('娱乐')}
                  >
                    娱乐
                  </span>
              </div>
            </div>
          </div>

          {/* Right Banner */}
          <div className="hidden lg:block w-[150px] flex-shrink-0">
            {config?.bannerR.url ? (
              <a href="#" className="block h-full">
                <img
                  src={config.bannerR.url}
                  alt={config.bannerR.title}
                  className="w-full h-full object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  title={config.bannerR.title}
                />
              </a>
            ) : (
              <Card className="h-full bg-muted/50 flex items-center justify-center border-dashed">
                <CardContent className="p-6">
                  <span className="text-muted-foreground font-medium text-center">广告位 / Banner</span>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>

      {/* Floating Customer Service Button */}
      <Button
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
        onClick={() => setShowCustomerService(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Customer Service Dialog */}
      <Dialog open={showCustomerService} onOpenChange={setShowCustomerService}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>联系客服</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {config?.customerService.img && (
              <div className="flex justify-center">
                <img
                  src={config.customerService.img}
                  alt="客服二维码"
                  className="w-48 h-48 object-contain rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            {config?.customerService.qq && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">客服 QQ</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold">{config.customerService.qq}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(config.customerService.qq);
                      toast.success('QQ号已复制到剪贴板');
                    }}
                  >
                    复制
                  </Button>
                </div>
              </div>
            )}
            {!config?.customerService.img && !config?.customerService.qq && (
              <p className="text-center text-muted-foreground py-8">
                暂无客服信息
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HomePage;
