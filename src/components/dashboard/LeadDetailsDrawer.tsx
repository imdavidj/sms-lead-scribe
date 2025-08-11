import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead as LeadType } from "@/types/dashboard";

interface LeadDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any | null;
  onPushToCRM: (lead: LeadType) => void;
}

const computeAIScore = (lead: any) => {
  let score = 50;
  if (lead?.status === "Qualified") score += 30;
  if (lead?.ai_tag) score += 20;
  if (lead?.email) score += 10;
  if (lead?.address) score += 15;
  return Math.min(score, 100);
};

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  open,
  onOpenChange,
  lead,
  onPushToCRM,
}) => {
  if (!lead) return null;

  const aiScore = computeAIScore(lead);
  const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
    "Unknown";

  const crmLead: LeadType = {
    id: lead.id,
    name: fullName,
    phone: lead.phone || "",
    property: lead.address || "Property info not available",
    value: "$0",
    aiScore,
    timeline: "Unknown",
    motivation: lead.ai_classification_reason || "Not specified",
  };

  const TagBadge = () => {
    const tag = (lead.ai_tag || "").toLowerCase();
    if (tag === "hot") return <Badge variant="destructive">HOT</Badge>;
    if (tag === "warm") return <Badge variant="secondary">WARM</Badge>;
    if (tag === "cold") return <Badge variant="outline">COLD</Badge>;
    return lead.ai_tag ? <Badge variant="secondary">{lead.ai_tag}</Badge> : null;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{fullName}</DrawerTitle>
          <DrawerDescription>
            {lead.phone || "No phone"}
            {lead.email ? ` • ${lead.email}` : ""}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4">
          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg border p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Overview</h3>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${aiScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{aiScore}</span>
                <TagBadge />
              </div>
              {lead.ai_classification_reason && (
                <p className="text-sm mt-3 text-muted-foreground">
                  {lead.ai_classification_reason}
                </p>
              )}
            </article>

            <article className="rounded-lg border p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Lead Status</h3>
              <div className="text-sm">
                <div>
                  Status: <span className="font-medium">{lead.status || "Unknown"}</span>
                </div>
                <div>
                  Created: {" "}
                  <span className="font-medium">
                    {lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact & Property</h3>
            <div className="text-sm space-y-1">
              <div>
                Phone: <span className="font-medium">{lead.phone || "—"}</span>
              </div>
              <div>
                Email: <span className="font-medium">{lead.email || "—"}</span>
              </div>
              <div>
                Address: <span className="font-medium">{lead.address || "—"}</span>
              </div>
              {lead.city || lead.state || lead.zip ? (
                <div className="font-medium">
                  {[lead.city, lead.state, lead.zip].filter(Boolean).join(", ")}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <DrawerFooter>
          <Button
            onClick={() => {
              onPushToCRM(crmLead);
              onOpenChange(false);
            }}
          >
            Push to CRM
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default LeadDetailsDrawer;
