import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

export type LeadFilterValue = {
  statuses: string[];
  cities: string[];
  aiTags: string[];
};

interface LeadFiltersProps {
  leads: any[];
  value: LeadFilterValue;
  onChange: (value: LeadFilterValue) => void;
  onClear: () => void;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({ leads, value, onChange, onClear }) => {
  const unique = (arr: (string | null | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as string[])).sort();

  const statusOptions = unique(leads.map(l => l.status));
  const cityOptions = unique(leads.map(l => l.city));
  const aiTagOptions = unique(leads.map(l => l.ai_tag));

  const toggle = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter(v => v !== item) : [...list, item];
  };

  const activeCount = value.statuses.length + value.cities.length + value.aiTags.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">{activeCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4 z-50" align="end">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Advanced Filters</h3>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
              <X className="h-4 w-4 mr-1" /> Clear all
            </Button>
          )}
        </div>
        <Separator className="my-2" />

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Status</h4>
          <ScrollArea className="max-h-40 pr-2">
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.length === 0 && (
                <div className="text-sm text-muted-foreground">No statuses</div>
              )}
              {statusOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={value.statuses.includes(opt)}
                    onCheckedChange={() => onChange({ ...value, statuses: toggle(value.statuses, opt) })}
                  />
                  <Label className="text-sm font-normal cursor-pointer">{opt}</Label>
                </label>
              ))}
            </div>
          </ScrollArea>
        </section>

        <Separator className="my-3" />

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">City</h4>
          <ScrollArea className="max-h-40 pr-2">
            <div className="grid grid-cols-2 gap-2">
              {cityOptions.length === 0 && (
                <div className="text-sm text-muted-foreground">No cities</div>
              )}
              {cityOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={value.cities.includes(opt)}
                    onCheckedChange={() => onChange({ ...value, cities: toggle(value.cities, opt) })}
                  />
                  <Label className="text-sm font-normal cursor-pointer">{opt}</Label>
                </label>
              ))}
            </div>
          </ScrollArea>
        </section>

        <Separator className="my-3" />

        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">AI Tag</h4>
          <ScrollArea className="max-h-40 pr-2">
            <div className="grid grid-cols-2 gap-2">
              {aiTagOptions.length === 0 && (
                <div className="text-sm text-muted-foreground">No AI tags</div>
              )}
              {aiTagOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={value.aiTags.includes(opt)}
                    onCheckedChange={() => onChange({ ...value, aiTags: toggle(value.aiTags, opt) })}
                  />
                  <Label className="text-sm font-normal cursor-pointer">{opt}</Label>
                </label>
              ))}
            </div>
          </ScrollArea>
        </section>
      </PopoverContent>
    </Popover>
  );
};
