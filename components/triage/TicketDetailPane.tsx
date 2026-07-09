"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle,
  ChevronRight,
  Code2,
  FileText,
  ListChecks,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Target,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";

import { AiImprovePanel } from "@/components/triage/AiImprovePanel";
import { AskPmAgentGate } from "@/components/triage/AskPmAgentGate";
import { TriageFlowStrip } from "@/components/triage/TriageFlowStrip";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { CodeReferenceBlock } from "@/components/shared/CodeReferenceBlock";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { TicketActionsBar } from "@/components/triage/TicketActionsBar";
import { ReasoningTrace } from "@/components/triage/ReasoningTrace";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTicketStore } from "@/lib/store/tickets";
import { usePmChatStore } from "@/lib/store/pm-chat";
import { useTriageAlertsStore } from "@/lib/store/triage-alerts";
import type { Classification, PmChatMessage, Scope, Ticket } from "@/lib/types";
import { enrichTicket } from "@/lib/utils/workspace";
import { cn, formatRelativeTime } from "@/lib/utils";

const EMPTY_CHAT: PmChatMessage[] = [];

interface TicketDetailPaneProps {
  ticket: Ticket | null;
  onAccept: (ticket: Ticket) => void;
  onReject: (ticket: Ticket) => void;
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-card shadow-sm", className)}>
      <div className="flex items-center gap-2 bg-muted/30 px-4 py-2.5">
        <Icon className="size-3.5 text-primary/70" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function TicketDetailPane({ ticket, onAccept, onReject }: TicketDetailPaneProps) {
  const { editDraft, editAndAccept } = useTicketStore();
  const hasPmConsulted = useTriageAlertsStore((s) => s.hasPmConsulted);
  const markPmConsulted = useTriageAlertsStore((s) => s.markPmConsulted);
  const [editMode, setEditMode] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const enriched = ticket ? enrichTicket(ticket) : null;

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editApproach, setEditApproach] = useState("");
  const [editCriteria, setEditCriteria] = useState<string[]>([]);
  const [editClassification, setEditClassification] = useState<Classification>("bug");
  const [editScope, setEditScope] = useState<Scope>("M");
  const [newCriterion, setNewCriterion] = useState("");

  useEffect(() => {
    if (!enriched) return;
    setEditTitle(enriched.draftTitle);
    setEditDescription(enriched.draftDescription);
    setEditApproach(enriched.suggestedApproach);
    setEditCriteria(enriched.acceptanceCriteria);
    setEditClassification(enriched.classification);
    setEditScope(enriched.scope);
    setEditMode(false);
  }, [enriched?.id, refreshKey]);

  const chatSessionId = enriched ? `ticket_${enriched.id}` : "";
  const chatMessages = usePmChatStore((s) => s.messagesBySession[chatSessionId] ?? EMPTY_CHAT);
  const hasChatActivity = chatMessages.some((m) => m.role === "user");

  useEffect(() => {
    if (enriched && hasChatActivity) {
      markPmConsulted(enriched.id);
    }
  }, [enriched, hasChatActivity, markPmConsulted]);

  const pmConsulted =
    enriched != null &&
    (hasPmConsulted(enriched.id) || hasChatActivity || enriched.viaPmChat === true);

  const showFullDetail = enriched != null && (enriched.status !== "pending" || pmConsulted);

  const handleSaveDraft = useCallback(() => {
    if (!enriched) return;
    editDraft(enriched.id, {
      draftTitle: editTitle,
      draftDescription: editDescription,
      suggestedApproach: editApproach,
      acceptanceCriteria: editCriteria,
      classification: editClassification,
      scope: editScope,
    });
    toast.success("Draft saved");
    setEditMode(false);
  }, [editClassification, editCriteria, editDescription, editApproach, editDraft, editScope, editTitle, enriched]);

  const handleSaveAccept = useCallback(() => {
    if (!enriched) return;
    editAndAccept(enriched.id, {
      draftTitle: editTitle,
      draftDescription: editDescription,
      suggestedApproach: editApproach,
      acceptanceCriteria: editCriteria,
      classification: editClassification,
      scope: editScope,
    });
    toast.success("Edited and accepted");
    setEditMode(false);
    onAccept({ ...enriched, status: "accepted" });
  }, [
    editAndAccept,
    editClassification,
    editCriteria,
    editDescription,
    editApproach,
    editScope,
    editTitle,
    enriched,
    onAccept,
  ]);

  if (!enriched) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center bg-gradient-to-b from-violet-50/30 to-white">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Target className="size-7" />
          </div>
          <p className="text-sm font-semibold">Select a ticket to review</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Pick from the queue — inspect AI reasoning, improve the draft, then accept or reject
          </p>
        </div>
      </div>
    );
  }

  const confidenceColor =
    enriched.aiConfidenceLevel === "high"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : enriched.aiConfidenceLevel === "low"
        ? "text-red-600 bg-red-50 border-red-200"
        : "text-amber-600 bg-amber-50 border-amber-200";

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/20">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="w-full space-y-5 p-5 pb-8 md:p-6 lg:p-8">
          <TriageFlowStrip activeStep={showFullDetail && enriched.status === "pending" ? 3 : 4} />

          {/* Hero header */}
          <div className="rounded-2xl bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SourceBadge source={enriched.source} />
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    #{enriched.originalTicketId}
                  </span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", confidenceColor)}>
                    {enriched.aiConfidence}% AI confidence
                  </span>
                </div>
                {editMode ? (
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-lg font-semibold" />
                ) : (
                  <h2 className="text-xl md:text-2xl font-bold leading-snug tracking-tight">{enriched.draftTitle}</h2>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {editMode ? (
                    <>
                      <Select value={editClassification} onValueChange={(v) => v && setEditClassification(v as Classification)}>
                        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">Bug</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="churn_signal">Churn Signal</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={editScope} onValueChange={(v) => v && setEditScope(v as Scope)}>
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <ClassificationBadge classification={enriched.classification} />
                      <ScopeBadge scope={enriched.scope} />
                      {enriched.priorityScore != null && enriched.priorityScore >= 70 && (
                        <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">
                          Priority {enriched.priorityScore}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!editMode && enriched.status === "pending" && showFullDetail && (
                <Button size="sm" variant="outline" className="gap-1.5 h-8 shrink-0" onClick={() => setEditMode(true)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-3 flex items-center gap-3">
              <Avatar className="size-10 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {enriched.customer.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{enriched.customer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{enriched.originalSubject}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(enriched.createdAt)}</span>
            </div>
          </div>

          {enriched.status === "pending" && !pmConsulted && (
            <AskPmAgentGate ticket={enriched} />
          )}

          {showFullDetail && (
            <>
          {!editMode && enriched.status === "pending" && (
            <AiImprovePanel ticket={enriched} onApplied={() => setRefreshKey((k) => k + 1)} />
          )}

          <ReasoningTrace ticket={enriched} />

          <SectionCard icon={FileText} title="Description">
            {editMode ? (
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="text-sm" />
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{enriched.draftDescription}</p>
            )}
          </SectionCard>

          <SectionCard icon={Code2} title="Affected code">
            <div className="space-y-2">
              {enriched.codeRefs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No code references identified.</p>
              ) : (
                enriched.codeRefs.map((ref) => <CodeReferenceBlock key={ref.id} codeRef={ref} />)
              )}
            </div>
          </SectionCard>

          <SectionCard icon={Target} title="Suggested approach">
            {editMode ? (
              <Textarea value={editApproach} onChange={(e) => setEditApproach(e.target.value)} rows={4} className="text-sm" />
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-line">{enriched.suggestedApproach}</p>
            )}
          </SectionCard>

          <SectionCard icon={ListChecks} title="Acceptance criteria">
            <ul className="space-y-2">
              {(editMode ? editCriteria : enriched.acceptanceCriteria).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="size-3.5 text-emerald-600 mt-1 shrink-0" />
                  {editMode ? (
                    <div className="flex gap-1 flex-1">
                      <Input
                        value={c}
                        onChange={(e) => {
                          const next = [...editCriteria];
                          next[i] = e.target.value;
                          setEditCriteria(next);
                        }}
                        className="h-7 text-sm"
                      />
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditCriteria(editCriteria.filter((_, j) => j !== i))}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="leading-relaxed">{c}</span>
                  )}
                </li>
              ))}
            </ul>
            {editMode && (
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Input
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder="Add criterion..."
                  className="h-7 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCriterion.trim()) {
                      setEditCriteria([...editCriteria, newCriterion.trim()]);
                      setNewCriterion("");
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => {
                    if (newCriterion.trim()) {
                      setEditCriteria([...editCriteria, newCriterion.trim()]);
                      setNewCriterion("");
                    }
                  }}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            )}
          </SectionCard>

          {enriched.conversation.length > 0 && (
            <SectionCard icon={MessageSquare} title={`Conversation (${enriched.conversation.length})`}>
              <button
                className="flex items-center gap-1 text-sm font-medium text-primary w-full"
                onClick={() => setShowConversation(!showConversation)}
              >
                {showConversation ? "Hide thread" : "Show customer thread"}
                <ChevronRight className={cn("size-4 ml-auto transition-transform", showConversation && "rotate-90")} />
              </button>
              {showConversation && (
                <div className="mt-3 space-y-2">
                  {enriched.conversation.map((msg) => (
                    <div key={msg.id} className="rounded-xl border p-3 text-sm bg-muted/20">
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                        <User className="size-3" /> {msg.author}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {enriched.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {enriched.attachments.map((a) => (
                <Badge key={a.id} variant="outline" className="gap-1 py-1">
                  <Paperclip className="size-3" /> {a.name}
                </Badge>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {enriched && showFullDetail && (
        <TicketActionsBar
          ticket={enriched}
          editMode={editMode}
          onEdit={() => setEditMode(true)}
          onCancelEdit={() => setEditMode(false)}
          onSaveDraft={handleSaveDraft}
          onSaveAccept={handleSaveAccept}
        />
      )}
    </div>
  );
}
