"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { CodeReferenceBlock } from "@/components/shared/CodeReferenceBlock";
import { ScopeBadge } from "@/components/shared/ScopeBadge";
import { SourceBadge } from "@/components/shared/SourceBadge";
import { ReasoningTrace } from "@/components/triage/ReasoningTrace";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useTicketStore } from "@/lib/store/tickets";
import type { Classification, Scope, Ticket } from "@/lib/types";
import { enrichTicket } from "@/lib/utils/workspace";
import { cn, formatRelativeTime } from "@/lib/utils";

interface TicketDetailPaneProps {
  ticket: Ticket | null;
  onAccept: (ticket: Ticket) => void;
  onReject: (ticket: Ticket) => void;
}

export function TicketDetailPane({ ticket, onAccept, onReject }: TicketDetailPaneProps) {
  const { editDraft, editAndAccept } = useTicketStore();
  const [editMode, setEditMode] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
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
  }, [enriched?.id]);

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
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Select a ticket or cluster</p>
          <p className="text-xs text-muted-foreground mt-1">Review drafts, reasoning, and code context here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-5 space-y-5 pb-8">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source={enriched.source} />
                <span className="text-xs font-mono text-muted-foreground">#{enriched.originalTicketId}</span>
              </div>
              {editMode ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-lg font-semibold" />
              ) : (
                <h2 className="text-xl font-bold leading-snug">{enriched.draftTitle}</h2>
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
                  </>
                )}
              </div>
            </div>
            {!editMode && enriched.status === "pending" && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 shrink-0" onClick={() => setEditMode(true)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
            )}
          </div>

          <ReasoningTrace ticket={enriched} />

          <div className="rounded-xl border bg-muted/20 p-3 flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">{enriched.customer.avatarInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{enriched.customer.name}</p>
              <p className="text-xs text-muted-foreground truncate">{enriched.originalSubject}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(enriched.createdAt)}</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Description</p>
            {editMode ? (
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="text-sm" />
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90">{enriched.draftDescription}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Affected Code</p>
            <div className="space-y-2">
              {enriched.codeRefs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No code references identified.</p>
              ) : (
                enriched.codeRefs.map((ref) => <CodeReferenceBlock key={ref.id} codeRef={ref} />)
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Suggested Approach</p>
            {editMode ? (
              <Textarea value={editApproach} onChange={(e) => setEditApproach(e.target.value)} rows={3} className="text-sm" />
            ) : (
              <p className="text-sm leading-relaxed">{enriched.suggestedApproach}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Acceptance Criteria</p>
            <ul className="space-y-2">
              {(editMode ? editCriteria : enriched.acceptanceCriteria).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
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
                    <span>{c}</span>
                  )}
                </li>
              ))}
            </ul>
            {editMode && (
              <div className="flex gap-2 mt-2">
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
                <Button size="sm" variant="outline" className="h-7" onClick={() => {
                  if (newCriterion.trim()) {
                    setEditCriteria([...editCriteria, newCriterion.trim()]);
                    setNewCriterion("");
                  }
                }}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          {enriched.conversation.length > 0 && (
            <div>
              <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground" onClick={() => setShowConversation(!showConversation)}>
                <MessageSquare className="size-4" /> Conversation ({enriched.conversation.length})
                <ChevronRight className={cn("size-4 transition-transform", showConversation && "rotate-90")} />
              </button>
              {showConversation && (
                <div className="mt-2 space-y-2">
                  {enriched.conversation.map((msg) => (
                    <div key={msg.id} className="rounded-lg border p-3 text-sm bg-white">
                      <p className="text-xs font-medium mb-1">{msg.author}</p>
                      <p className="text-muted-foreground">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {enriched.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {enriched.attachments.map((a) => (
                <Badge key={a.id} variant="outline" className="gap-1">
                  <Paperclip className="size-3" /> {a.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {enriched.status === "pending" && (
        <div className="border-t bg-white px-4 py-3 flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}><X className="size-4" /> Cancel</Button>
              <Button variant="outline" size="sm" onClick={handleSaveDraft}><Check className="size-4" /> Save draft</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 ml-auto" onClick={handleSaveAccept}>Save & Accept</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => onReject(enriched)}>
                <XCircle className="size-4" /> Reject
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}><Pencil className="size-4" /> Edit</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 ml-auto" onClick={() => onAccept(enriched)}>
                <CheckCircle className="size-4" /> Accept
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
