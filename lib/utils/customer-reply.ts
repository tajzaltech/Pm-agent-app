import { SOURCE_CONFIG } from "@/lib/constants";
import type { Ticket, PmChatCustomerReply } from "@/lib/types";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export function buildCustomerReply(ticket: Ticket): PmChatCustomerReply {
  const channel = SOURCE_CONFIG[ticket.source]?.label ?? "your support channel";
  const name = firstName(ticket.customer.name);
  const subject = ticket.originalSubject.startsWith("Re:")
    ? ticket.originalSubject
    : `Re: ${ticket.originalSubject}`;

  let body: string;

  if (ticket.classification === "question") {
    body = `Hi ${name},

Thank you for reaching out about "${ticket.originalSubject}".

${ticket.draftDescription.split(".").slice(0, 2).join(".")}.

If anything still isn't clear, reply to this thread and we'll help right away.

Best regards,
Support Team`;
  } else if (ticket.classification === "feature_request") {
    body = `Hi ${name},

Thanks for the suggestion — "${ticket.originalSubject}".

We've logged this for the product team. While it's not on the immediate roadmap, your feedback helps us prioritize what to build next.

We'll follow up if we need more detail.

Best regards,
Support Team`;
  } else if (ticket.classification === "churn_signal") {
    body = `Hi ${name},

Thank you for sharing your concerns — we take this seriously.

${ticket.draftDescription.split(".").slice(0, 2).join(".")}.

A member of our team would like to understand what's not working and how we can make this right. Could you share a good time for a quick call this week?

Best regards,
Support Team`;
  } else {
    body = `Hi ${name},

Thank you for reporting "${ticket.originalSubject}".

We've reviewed your message. ${ticket.draftDescription.split(".").slice(0, 2).join(".")}.

No engineering change is required on our side for this one — please try the steps above and let us know if the issue persists.

Best regards,
Support Team`;
  }

  return {
    subject,
    body,
    channel,
    customerName: ticket.customer.name,
  };
}
