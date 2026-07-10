import type { Ticket } from "@/lib/types";

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "t001",
    status: "pending",
    classification: "bug",
    scope: "M",
    draftTitle: "Fix Stripe webhook timeout causing duplicate payment charges",
    draftDescription:
      "The payment service is timing out on Stripe webhook events with large payloads (>4KB). When a timeout occurs, Stripe retries the event, resulting in duplicate charge processing. The issue manifests in the checkout service's webhook handler which does not implement idempotency checks.",
    suggestedApproach:
      "Add idempotency key validation in the webhook handler before processing. Store processed webhook IDs in Redis with a 24h TTL. Return HTTP 200 immediately after idempotency check passes, process charge asynchronously.",
    acceptanceCriteria: [
      "Webhook handler checks idempotency key before processing any charge",
      "Duplicate events return 200 without re-processing",
      "Unit tests cover idempotent and duplicate scenarios",
      "Redis TTL set to 24h for processed webhook IDs",
    ],
    scopeRationale: "2 files, isolated to payment service, no DB schema changes",
    codeRefs: [
      {
        id: "cr001",
        filePath: "src/checkout/webhook_handler.py",
        functionName: "handle_stripe_event",
        lineStart: 42,
        lineEnd: 89,
        language: "python",
        snippet: `def handle_stripe_event(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)

    # TODO: add idempotency check here
    if event['type'] == 'payment_intent.succeeded':
        handle_payment_success(event['data']['object'])

    return HttpResponse(status=200)`,
      },
      {
        id: "cr002",
        filePath: "src/api/orders.py",
        functionName: "process_payment",
        lineStart: 112,
        lineEnd: 145,
        language: "python",
        snippet: `def process_payment(order_id: str, payment_intent_id: str):
    order = Order.objects.get(id=order_id)
    if order.payment_status == 'paid':
        # BUG: this check is after the charge, not before
        logger.warning(f"Order {order_id} already paid")
        return

    charge = stripe.PaymentIntent.capture(payment_intent_id)
    order.payment_status = 'paid'
    order.save()`,
      },
    ],
    customer: {
      id: "c001",
      name: "Sarah Chen",
      email: "sarah.chen@acmetech.com",
      plan: "enterprise",
      avatarInitials: "SC",
    },
    source: "freshdesk",
    originalTicketId: "FD-4821",
    originalSubject: "Customers being charged twice for the same order!",
    originalBody:
      "Hi support team,\n\nWe've had 3 enterprise customers report being double-charged today. This is a critical issue for us. The charges are exactly 2x the order amount and the duplicates appear about 30 seconds after the first charge.\n\nOrder IDs affected: ORD-9921, ORD-9934, ORD-9967\n\nThis is impacting our trust with customers and we need this fixed urgently.",
    conversation: [
      {
        id: "msg001",
        author: "Sarah Chen",
        authorType: "customer",
        content: "Hi, we've had 3 enterprise customers report being double-charged today. Critical issue.",
        timestamp: "2026-06-16T08:10:00Z",
      },
      {
        id: "msg002",
        author: "Alex (Support)",
        authorType: "agent",
        content: "Hi Sarah, I've escalated this to our engineering team. Can you share the affected order IDs?",
        timestamp: "2026-06-16T08:25:00Z",
      },
      {
        id: "msg003",
        author: "Sarah Chen",
        authorType: "customer",
        content: "Order IDs: ORD-9921, ORD-9934, ORD-9967. All enterprise tier.",
        timestamp: "2026-06-16T08:31:00Z",
      },
    ],
    internalNotes:
      "Checked Stripe dashboard — webhook events show 2x delivery for these order IDs. Timeout on our side causing Stripe retries. Engineering needs to add idempotency.",
    attachments: [
      { id: "a001", name: "stripe_webhook_logs.csv", type: "csv", size: "42 KB" },
      { id: "a002", name: "duplicate_charges_screenshot.png", type: "png", size: "156 KB" },
    ],
    createdAt: "2026-06-16T08:45:00Z",
  },

  {
    id: "t003",
    status: "pending",
    classification: "question",
    scope: "S",
    draftTitle: "Document SSO configuration for SAML 2.0 providers",
    draftDescription:
      "Customer is unable to configure SAML 2.0 SSO with their IdP (Okta). The auth module supports SAML but the configuration flow is undocumented. The settings UI exposes the required fields but there's no guidance on required assertions or attribute mapping.",
    suggestedApproach:
      "Add in-app help text to the SSO configuration panel for each SAML field (Entity ID, ACS URL, IdP metadata URL). Link to a new help article covering Okta, Azure AD, and Google Workspace setup flows.",
    acceptanceCriteria: [
      "Help text added to each SAML configuration field",
      "Link to documentation added to SSO settings panel",
      "Okta setup guide published in help docs",
    ],
    scopeRationale: "1 settings component, copy changes only, no logic changes",
    codeRefs: [
      {
        id: "cr005",
        filePath: "src/settings/SSOConfiguration.tsx",
        functionName: "SSOConfigPanel",
        lineStart: 44,
        lineEnd: 90,
        language: "tsx",
        snippet: `export function SSOConfigPanel() {
  return (
    <form onSubmit={handleSubmit}>
      <Input label="Entity ID" name="entity_id" />
      <Input label="ACS URL" name="acs_url" />
      <Input label="IdP Metadata URL" name="idp_metadata_url" />
      {/* TODO: add help text and docs link */}
      <Button type="submit">Save SSO Configuration</Button>
    </form>
  );
}`,
      },
    ],
    customer: {
      id: "c003",
      name: "Priya Sharma",
      email: "priya@innovatehq.com",
      plan: "growth",
      avatarInitials: "PS",
    },
    source: "freshdesk",
    originalTicketId: "FD-4803",
    originalSubject: "How to configure SSO with Okta?",
    originalBody:
      "Hi! We're trying to set up SSO with Okta for our team. I found the SSO settings page but I'm not sure what to put in the Entity ID and ACS URL fields. Can you help?",
    conversation: [
      {
        id: "msg006",
        author: "Priya Sharma",
        authorType: "customer",
        content: "Trying to configure SSO with Okta. Not sure what to put in Entity ID / ACS URL fields.",
        timestamp: "2026-06-16T07:30:00Z",
      },
    ],
    internalNotes: "This comes up every week. We need in-app docs for SSO config. Low effort, high impact.",
    attachments: [],
    createdAt: "2026-06-16T10:15:00Z",
  },

  {
    id: "t006",
    status: "pending",
    classification: "feature_request",
    scope: "M",
    draftTitle: "Add bulk team member import via CSV upload",
    draftDescription:
      "Teams of 10+ members face significant friction when onboarding. Currently each member must be invited individually. A CSV upload flow would dramatically reduce the time to set up large teams.",
    suggestedApproach:
      "Add a CSV upload endpoint that accepts columns: name, email, role. Validate each row, send batch invitations, return a summary of sent/failed invites. Add a simple UI in Settings > Team.",
    acceptanceCriteria: [
      "CSV upload accepts name, email, role columns",
      "Validation errors shown per-row before sending",
      "Bulk invitations sent in one action",
      "Summary shows sent/failed counts",
      "Duplicate email addresses skipped with notification",
    ],
    scopeRationale: "New API endpoint + settings UI component, no schema changes",
    codeRefs: [
      {
        id: "cr009",
        filePath: "src/api/team/invitations.py",
        functionName: "invite_member",
        lineStart: 10,
        lineEnd: 35,
        language: "python",
        snippet: `@router.post("/team/invite")
async def invite_member(
    email: str,
    role: str,
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403)

    invitation = Invitation.create(email=email, role=role, org_id=current_user.org_id)
    send_invitation_email(invitation)
    return {"status": "sent"}`,
      },
    ],
    customer: {
      id: "c006",
      name: "Tom Bradley",
      email: "tom@scaleup.ventures",
      plan: "growth",
      avatarInitials: "TB",
    },
    source: "zendesk",
    originalTicketId: "ZD-18190",
    originalSubject: "Can we bulk-invite team members?",
    originalBody:
      "We're onboarding 45 new team members and inviting them one by one is incredibly slow. Is there a way to bulk invite or import users from a CSV?",
    conversation: [
      {
        id: "msg011",
        author: "Tom Bradley",
        authorType: "customer",
        content: "Need to onboard 45 team members. Inviting one-by-one is very slow. CSV bulk import?",
        timestamp: "2026-06-15T13:00:00Z",
      },
    ],
    internalNotes: "Commonly requested. Growth teams need this. Should scope to CSV for V1.",
    attachments: [],
    createdAt: "2026-06-16T10:40:00Z",
  },
];
