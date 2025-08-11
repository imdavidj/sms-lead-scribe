import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any | null;
  onSaved: (lead: any) => void;
}

type FormValues = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  status?: string;
  ai_tag?: string;
};

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  open,
  onOpenChange,
  lead,
  onSaved,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      first_name: lead?.first_name || "",
      last_name: lead?.last_name || "",
      phone: lead?.phone || "",
      email: lead?.email || "",
      address: lead?.address || "",
      city: lead?.city || "",
      state: lead?.state || "",
      zip: lead?.zip || "",
      status: lead?.status || "No Response",
      ai_tag: lead?.ai_tag || "",
    },
  });

  useEffect(() => {
    if (lead) {
      reset({
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        zip: lead.zip || "",
        status: lead.status || "No Response",
        ai_tag: lead.ai_tag || "",
      });
    }
  }, [lead, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!lead) return;
    try {
      setSaving(true);

      // If it's a mock lead, just update locally
      if (String(lead.id).startsWith("mock-")) {
        const updated = { ...lead, ...values };
        onSaved(updated);
        toast({ title: "Lead updated", description: "Changes saved locally." });
        onOpenChange(false);
        return;
      }

      const { data, error } = await supabase
        .from("leads")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", lead.id)
        .select()
        .single();

      if (error) throw error;

      onSaved(data);
      toast({ title: "Lead updated", description: "The lead was saved successfully." });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message || "Could not save lead.",
      });
    } finally {
      setSaving(false);
    }
  };

  const status = watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update contact and property details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" placeholder="First name" {...register("first_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" placeholder="Last name" {...register("last_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@email.com" {...register("email")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Street address" {...register("address")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="State" {...register("state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" placeholder="ZIP" {...register("zip")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status || "No Response"}
                onValueChange={(val) => setValue("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="No Response">No Response</SelectItem>
                  <SelectItem value="Unqualified">Unqualified</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai_tag">AI Tag</Label>
              <Input id="ai_tag" placeholder="e.g., hot, warm, cold" {...register("ai_tag")} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;
