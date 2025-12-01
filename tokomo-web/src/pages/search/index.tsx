import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">搜索结果</h1>
          <p className="text-muted-foreground">
            关键词: <span className="font-medium text-foreground">"{query}"</span>
          </p>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                搜索内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg">您搜索的内容: <span className="font-semibold text-primary">{query}</span></p>
                <p className="text-sm text-muted-foreground">
                  搜索功能正在开发中，敬请期待更多精彩内容...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
