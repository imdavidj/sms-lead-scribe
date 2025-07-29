import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Mail, Search } from 'lucide-react';

interface DocItem {
  id: number;
  title: string;
  description: string;
  link: string;
  type: 'internal' | 'external' | 'mailto';
}

export const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const docItems: DocItem[] = [
    {
      id: 1,
      title: 'Quickstart Guide',
      description: 'Get up and running with SMS Qualifier in minutes',
      link: '/docs/quickstart',
      type: 'internal'
    },
    {
      id: 2,
      title: 'API Reference',
      description: 'Complete API documentation and examples',
      link: '/docs/api',
      type: 'internal'
    },
    {
      id: 3,
      title: 'Webhook Setup',
      description: 'Configure webhooks for integrations',
      link: '/docs/webhooks',
      type: 'internal'
    },
    {
      id: 4,
      title: 'FAQ',
      description: 'Frequently asked questions and answers',
      link: '/docs/faq',
      type: 'internal'
    },
    {
      id: 5,
      title: 'Contact Support',
      description: 'Get help from our support team',
      link: 'mailto:support@lovable.com',
      type: 'mailto'
    }
  ];

  const filteredDocs = docItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (item: DocItem) => {
    if (item.type === 'mailto') {
      window.location.href = item.link;
    } else if (item.type === 'external') {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      // For internal links, you might want to handle routing differently
      window.open(item.link, '_blank');
    }
  };

  const getCardIcon = (type: string) => {
    if (type === 'mailto') {
      return <Mail className="h-5 w-5 text-muted-foreground" />;
    }
    return <ExternalLink className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Help & Documentation</h2>
        <p className="text-muted-foreground">Find guides, API docs, and support resources here.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="docSearch"
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
          </div>
        ) : (
          filteredDocs.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
              onClick={() => handleCardClick(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  {getCardIcon(item.type)}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredDocs.length > 0 && searchTerm && (
        <div className="text-sm text-muted-foreground">
          Found {filteredDocs.length} result{filteredDocs.length !== 1 ? 's' : ''} for "{searchTerm}"
        </div>
      )}
    </div>
  );
};