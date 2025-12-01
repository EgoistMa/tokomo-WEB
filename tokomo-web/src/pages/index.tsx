import React, { useState } from 'react';
import Carousel from '@/components/Carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
      <Carousel />

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12 h-[800px]">
        <div className="flex flex-col lg:flex-row gap-8 h-full">
          
          {/* Left Banner */}
          <div className="hidden lg:block w-[150px] flex-shrink-0">
            <Card className="h-full bg-muted/50 flex items-center justify-center border-dashed">
              <CardContent className="p-6">
                <span className="text-muted-foreground font-medium">广告位 / Banner</span>
              </CardContent>
            </Card>
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
                <Button type="submit">搜索</Button>
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
            <Card className="h-full bg-muted/50 flex items-center justify-center border-dashed">
              <CardContent className="p-6">
                <span className="text-muted-foreground font-medium">广告位 / Banner</span>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </>
  );
};

export default HomePage;
