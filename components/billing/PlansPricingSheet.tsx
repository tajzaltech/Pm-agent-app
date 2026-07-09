"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlansPricingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlansPricingSheet({ open, onOpenChange }: PlansPricingSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Plans & Pricing</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current plan</p>
            <p className="text-xl font-bold mt-1">Growth</p>
            <p className="text-sm text-muted-foreground mt-1">PM + CS seats · Freshdesk sync · PM Agent Chat</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tickets this month</span>
                <span className="font-medium">248 / 500</span>
              </div>
              <Progress value={49.6} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Seats</span>
                <span className="font-medium">4 / 10</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
          </div>
          <Button className="w-full">Upgrade to Enterprise</Button>
          <p className="text-xs text-center text-muted-foreground">Billing managed in Settings → Account</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
