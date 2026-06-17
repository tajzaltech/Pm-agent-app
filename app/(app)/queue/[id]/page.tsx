"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTicketStore } from "@/lib/store/tickets";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { CodeReferenceBlock } from "@/components/shared/CodeReferenceBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/utils";
import type { Classification, Scope } from "@/lib/types";
import { useDispatchStore, AGENT_LABELS } from "@/lib/store/dispatch";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Paperclip,
  MessageSquare,
  FileText,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  BotMessageSquare,
  Loader2,
  GitFork,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-violet-50 text-violet-700 border-violet-200",
  growth: "bg-blue-50 text-blue-700 border-blue-200",
  starter: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function TicketReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { tickets, accept, reject, editDraft, editAndAccept, undo, getPending } = useTicketStore();
  const { getRecord, config: dispatchConfig } = useDispatchStore();

  const ticket = tickets.find((t) => t.id === id);
  const pendingTickets = getPending();
  const currentPendingIdx = pendingTickets.findIndex((t) => t.id === id);
  const prevTicket = currentPendingIdx > 0 ? pendingTickets[currentPendingIdx - 1] : null;
  const nextTicket = currentPendingIdx < pendingTickets.length - 1 ? pendingTickets[currentPendingIdx + 1] : null;

  const [editMode, setEditMode] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState(ticket?.draftTitle ?? "");
  const [editDescription, setEditDescription] = useState(ticket?.draftDescription ?? "");
  const [editApproach, setEditApproach] = useState(ticket?.suggestedApproach ?? "");
  const [editCriteria, setEditCriteria] = useState<string[]>(ticket?.acceptanceCriteria ?? []);
  const [editClassification, setEditClassification] = useState<Classification>(ticket?.classification ?? "bug");
  const [editScope, setEditScope] = useState<Scope>(ticket?.scope ?? "M");
  const [newCriterion, setNewCriterion] = useState("");

  const handleAccept = useCallback(() => {
    if (!ticket) return;
    accept(ticket.id);
    toast.success("Accepted and pushed to Linear", {
      action: { label: "Undo", onClick: undo },
      duration: 5000,
    });
    if (nextTicket) router.push(`/queue/${nextTicket.id}`);
    else router.push("/queue");
  }, [accept, nextTicket, router, ticket, undo]);

  const handleReject = useCallback(() => {
    if (!ticket) return;
    reject(ticket.id);
    toast.error("Ticket rejected", {
      action: { label: "Undo", onClick: undo },
      duration: 5000,
    });
    if (nextTicket) router.push(`/queue/${nextTicket.id}`);
    else router.push("/queue");
  }, [nextTicket, reject, router, ticket, undo]);

  const handleSaveDraft = useCallback(() => {
    if (!ticket) return;
    editDraft(ticket.id, {
      draftTitle: editTitle,
      draftDescription: editDescription,
      suggestedApproach: editApproach,
      acceptanceCriteria: editCriteria,
      classification: editClassification,
      scope: editScope,
    });
    toast.success("Draft saved — still pending review");
    setEditMode(false);
  }, [
    editClassification,
    editCriteria,
    editDescription,
    editApproach,
    editDraft,
    editScope,
    editTitle,
    ticket,
  ]);

  const handleSaveEdit = useCallback(() => {
    if (!ticket) return;
    editAndAccept(ticket.id, {
      draftTitle: editTitle,
      draftDescription: editDescription,
      suggestedApproach: editApproach,
      acceptanceCriteria: editCriteria,
      classification: editClassification,
      scope: editScope,
    });
    toast.success("Edited and accepted - pushed to Linear");
    setEditMode(false);
    if (nextTicket) router.push(`/queue/${nextTicket.id}`);
    else router.push("/queue");
  }, [
    editAndAccept,
    editApproach,
    editClassification,
    editCriteria,
    editDescription,
    editScope,
    editTitle,
    nextTicket,
    router,
    ticket,
  ]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ticket) return;
    setEditTitle(ticket.draftTitle);
    setEditDescription(ticket.draftDescription);
    setEditApproach(ticket.suggestedApproach);
    setEditCriteria(ticket.acceptanceCriteria);
    setEditClassification(ticket.classification);
    setEditScope(ticket.scope);
  }, [ticket]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (editMode) {
        if (e.key === "Escape") setEditMode(false);
        else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          handleSaveDraft();
        }
        return;
      }
      if (["INPUT", "TEXTAREA"].includes(tag)) return;

      if (e.key === "a" || e.key === "A") handleAccept();
      else if (e.key === "r" || e.key === "R") handleReject();
      else if (e.key === "e" || e.key === "E") setEditMode(true);
      else if (e.key === "ArrowLeft" && prevTicket) router.push(`/queue/${prevTicket.id}`);
      else if (e.key === "ArrowRight" && nextTicket) router.push(`/queue/${nextTicket.id}`);
      else if (e.key === "Escape") router.push("/queue");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode, handleAccept, handleReject, handleSaveDraft, nextTicket, prevTicket, router]);

  if (!ticket) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b px-6 py-4 flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 border-r p-6 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
          <div className="w-1/2 p-6 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full">
      {/* Top navigation bar */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push("/queue")}>
          <ArrowLeft className="size-4" />
          Back to Queue
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {currentPendingIdx >= 0
              ? `${currentPendingIdx + 1} of ${pendingTickets.length} pending`
              : "Reviewed"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={!prevTicket}
              onClick={() => prevTicket && router.push(`/queue/${prevTicket.id}`)}
              title="Previous (←)"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-7"
              disabled={!nextTicket}
              onClick={() => nextTicket && router.push(`/queue/${nextTicket.id}`)}
              title="Next (→)"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Two-panel split */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Customer Ticket */}
        <ScrollArea className="w-1/2 border-r">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Ticket</span>
                  <SourceBadge source={ticket.source} />
                  <a
                    href="#"
                    className="text-xs text-primary font-mono flex items-center gap-0.5 hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    #{ticket.originalTicketId}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <h2 className="text-base font-semibold leading-snug">{ticket.originalSubject}</h2>
              </div>
            </div>

            {/* Customer info */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Avatar className="size-9">
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                  {ticket.customer.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{ticket.customer.name}</p>
                <p className="text-xs text-muted-foreground">{ticket.customer.email}</p>
              </div>
              <div className="ml-auto">
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", PLAN_COLORS[ticket.customer.plan])}
                >
                  {ticket.customer.plan}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Message</p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 p-4 rounded-lg border bg-white">
                {ticket.originalBody}
              </div>
            </div>

            {/* Conversation */}
            {ticket.conversation.length > 0 && (
              <div>
                <button
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => setShowConversation(!showConversation)}
                >
                  <MessageSquare className="size-4" />
                  Conversation ({ticket.conversation.length})
                  <ChevronRight className={cn("size-4 transition-transform", showConversation && "rotate-90")} />
                </button>
                {showConversation && (
                  <div className="space-y-3">
                    {ticket.conversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-3 rounded-lg text-sm",
                          msg.authorType === "internal"
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-muted/40 border"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">{msg.author}</span>
                          {msg.authorType === "internal" && (
                            <Badge variant="outline" className="text-[10px] h-4 bg-amber-50 text-amber-700 border-amber-200">Internal</Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatRelativeTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Internal notes */}
            {ticket.internalNotes && (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Internal Notes</p>
                <p className="text-sm text-amber-900/80 leading-relaxed">{ticket.internalNotes}</p>
              </div>
            )}

            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="size-4" />
                  Attachments ({ticket.attachments.length})
                </p>
                <div className="space-y-1.5">
                  {ticket.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-white hover:bg-muted/30 transition-colors cursor-pointer">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{att.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{att.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* RIGHT: Agent Draft */}
        <ScrollArea className="w-1/2">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent Draft</span>
                {ticket.processingState === "analyzing" && (
                  <Badge variant="outline" className="text-xs animate-pulse">Analyzing…</Badge>
                )}
                {/* Dispatch status badge */}
                {(() => {
                  const rec = getRecord(ticket.id);
                  if (!rec) return null;
                  if (rec.status === "dispatching") return (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 gap-1 animate-pulse">
                      <Loader2 className="size-3 animate-spin" />
                      Dispatching to {AGENT_LABELS[rec.agentType]}…
                    </Badge>
                  );
                  if (rec.status === "dispatched") return (
                    <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200 gap-1">
                      <BotMessageSquare className="size-3" />
                      {AGENT_LABELS[rec.agentType]} · <code className="font-mono text-[10px]">{rec.branchName}</code>
                    </Badge>
                  );
                  if (rec.status === "failed") return (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 gap-1">
                      Dispatch failed
                    </Badge>
                  );
                  return null;
                })()}
              </div>
              {!editMode && ticket.status === "pending" && (
                <Button size="sm" variant="outline" className="gap-1.5 h-7" onClick={() => setEditMode(true)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>

            {/* Title */}
            {editMode ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Ticket title"
              />
            ) : (
              <h2 className="text-xl font-bold leading-snug">{ticket.draftTitle}</h2>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Select value={editClassification} onValueChange={(v) => { if (v) setEditClassification(v as Classification); }}>
                    <SelectTrigger className="h-7 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="churn_signal">Churn Signal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={editScope} onValueChange={(v) => { if (v) setEditScope(v as Scope); }}>
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S — Small</SelectItem>
                      <SelectItem value="M">M — Medium</SelectItem>
                      <SelectItem value="L">L — Large</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <ClassificationBadge classification={ticket.classification} />
                  <ScopeBadge scope={ticket.scope} />
                  {ticket.status !== "pending" && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        ticket.status === "accepted"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {ticket.status === "accepted" ? "Accepted" : "Rejected"}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              {editMode ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  className="text-sm leading-relaxed resize-none"
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90">{ticket.draftDescription}</p>
              )}
            </div>

            {/* Code refs */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Affected Code</p>
              {ticket.processingState === "no_code_match" ? (
                <p className="text-sm text-muted-foreground italic">
                  No matching code areas identified.
                </p>
              ) : ticket.codeRefs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No code references.</p>
              ) : (
                <div className="space-y-2">
                  {ticket.codeRefs.map((ref) => (
                    <CodeReferenceBlock key={ref.id} codeRef={ref} />
                  ))}
                </div>
              )}
            </div>

            {/* Suggested approach */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Suggested Approach</p>
              {editMode ? (
                <Textarea
                  value={editApproach}
                  onChange={(e) => setEditApproach(e.target.value)}
                  rows={4}
                  className="text-sm leading-relaxed resize-none"
                />
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90">{ticket.suggestedApproach}</p>
              )}
            </div>

            {/* Acceptance criteria */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acceptance Criteria</p>
              <ul className="space-y-2">
                {(editMode ? editCriteria : ticket.acceptanceCriteria).map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    {editMode ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <Input
                          value={c}
                          onChange={(e) => {
                            const next = [...editCriteria];
                            next[i] = e.target.value;
                            setEditCriteria(next);
                          }}
                          className="h-7 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-red-600 shrink-0"
                          onClick={() => setEditCriteria(editCriteria.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-foreground/90">{c}</span>
                    )}
                  </li>
                ))}
              </ul>
              {editMode && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    placeholder="Add acceptance criterion..."
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
                    className="h-7 gap-1 shrink-0"
                    onClick={() => {
                      if (newCriterion.trim()) {
                        setEditCriteria([...editCriteria, newCriterion.trim()]);
                        setNewCriterion("");
                      }
                    }}
                  >
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Scope rationale */}
            {!editMode && (
              <div className="p-3 rounded-lg bg-muted/40 border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Scope Rationale</p>
                <p className="text-sm text-muted-foreground">{ticket.scopeRationale}</p>
              </div>
            )}

            {/* Extra padding for sticky bar */}
            <div className="h-4" />
          </div>
        </ScrollArea>
      </div>

      {/* Dispatch info banner — shows after accept when dispatch is enabled */}
      {(() => {
        const rec = getRecord(ticket.id);
        if (!rec || ticket.status !== "accepted") return null;
        return (
          <div className={cn(
            "border-t px-6 py-2.5 flex items-center gap-2.5 text-xs shrink-0",
            rec.status === "dispatched" ? "bg-violet-50 border-violet-200" :
            rec.status === "dispatching" ? "bg-blue-50 border-blue-200" :
            "bg-red-50 border-red-200"
          )}>
            {rec.status === "dispatching" && <Loader2 className="size-3.5 text-blue-600 animate-spin shrink-0" />}
            {rec.status === "dispatched" && <BotMessageSquare className="size-3.5 text-violet-600 shrink-0" />}
            {rec.status === "failed" && <GitFork className="size-3.5 text-red-600 shrink-0" />}
            <span className={cn(
              rec.status === "dispatched" ? "text-violet-800" :
              rec.status === "dispatching" ? "text-blue-800" : "text-red-800"
            )}>
              {rec.status === "dispatching" && `Dispatching to ${AGENT_LABELS[rec.agentType]}…`}
              {rec.status === "dispatched" && `Dispatched to ${AGENT_LABELS[rec.agentType]} · branch `}
              {rec.status === "failed" && `Dispatch failed${rec.error ? ` — ${rec.error}` : ""}`}
            </span>
            {rec.status === "dispatched" && (
              <code className="font-mono text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded text-[11px]">{rec.branchName}</code>
            )}
          </div>
        );
      })()}

      {/* Sticky bottom action bar */}
      <div className="border-t bg-white px-6 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/queue")}>
          <ArrowLeft className="size-4" />
          Queue
        </Button>
        <div className="flex-1" />

        {editMode ? (
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditMode(false)}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSaveDraft}>
              <Check className="size-4" />
              Save draft
            </Button>
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveEdit}>
              <Check className="size-4" />
              Save & Accept
            </Button>
          </>
        ) : (
          <>
            {ticket.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleReject}
                >
                  <XCircle className="size-4" />
                  Reject <kbd className="ml-1 text-[10px] font-mono border rounded px-1 opacity-50">R</kbd>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="size-4" />
                  Edit <kbd className="ml-1 text-[10px] font-mono border rounded px-1 opacity-50">E</kbd>
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAccept}
                >
                  <CheckCircle className="size-4" />
                  Accept <kbd className="ml-1 text-[10px] font-mono border rounded px-1 opacity-50">A</kbd>
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
