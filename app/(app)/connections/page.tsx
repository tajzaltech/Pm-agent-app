"use client";

import { Pencil } from "lucide-react";

import SourcesPage from "@/app/(app)/sources/page";
import AutomationPage from "@/app/(app)/automation/page";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConnectionsStore } from "@/lib/store/connections";

export default function ConnectionsPage() {
  const editMode = useConnectionsStore((s) => s.editMode);
  const setEditMode = useConnectionsStore((s) => s.setEditMode);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b bg-card/90 backdrop-blur-sm px-4 md:px-6 h-14 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Connections & Automation</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Map your data flow and automation rules</p>
        </div>
        <Button
          variant={editMode ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1.5 text-xs shrink-0"
          onClick={() => setEditMode(!editMode)}
        >
          <Pencil className="size-3.5" /> {editMode ? "Done" : "Edit connections"}
        </Button>
      </div>
      <Tabs defaultValue="map" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b px-4 md:px-6 pt-3">
          <TabsList>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="map" className="min-h-0 flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <SourcesPage embedded />
        </TabsContent>
        <TabsContent value="rules" className="min-h-0 flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <AutomationPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
