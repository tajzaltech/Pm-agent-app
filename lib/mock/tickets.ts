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
    id: "t002",
    status: "pending",
    classification: "feature_request",
    scope: "L",
    draftTitle: "Add cursor-based pagination to /api/users endpoint",
    draftDescription:
      "Multiple customers have reported slow load times on user management pages. The /api/users endpoint uses offset-based pagination which degrades at scale (>10k users). We need to migrate to cursor-based pagination to support enterprise accounts with large user bases.",
    suggestedApproach:
      "Replace offset/limit with cursor-based pagination using the user's created_at timestamp + id as the cursor. Update the API response to include next_cursor and prev_cursor fields. Version the API as v2 to maintain backwards compatibility.",
    acceptanceCriteria: [
      "GET /api/v2/users accepts cursor, limit params",
      "Response includes next_cursor and prev_cursor",
      "Performance test shows <100ms p99 at 100k records",
      "v1 endpoint remains functional with deprecation notice",
      "API docs updated",
    ],
    scopeRationale: "5+ files across API layer and frontend, DB index changes required",
    codeRefs: [
      {
        id: "cr003",
        filePath: "src/api/users/routes.py",
        functionName: "list_users",
        lineStart: 18,
        lineEnd: 55,
        language: "python",
        snippet: `@router.get("/users")
async def list_users(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    users = db.query(User).offset(offset).limit(limit).all()
    total = db.query(User).count()
    return {"users": users, "total": total, "page": page}`,
      },
      {
        id: "cr004",
        filePath: "src/components/UserTable/index.tsx",
        functionName: "UserTable",
        lineStart: 1,
        lineEnd: 30,
        language: "tsx",
        snippet: `export function UserTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => fetchUsers({ page, limit: 50 }),
  });

  return (
    <div>
      <Table data={data?.users} />
      <Pagination
        page={page}
        total={data?.total}
        onPageChange={setPage}
      />
    </div>
  );
}`,
      },
    ],
    customer: {
      id: "c002",
      name: "Marcus Webb",
      email: "m.webb@globalcorp.io",
      plan: "enterprise",
      avatarInitials: "MW",
    },
    source: "zendesk",
    originalTicketId: "ZD-18204",
    originalSubject: "User management page takes 8+ seconds to load",
    originalBody:
      "Our admin team manages ~50,000 users and the user management page has become completely unusable. It takes 8-12 seconds to load and sometimes times out entirely. We're paying for enterprise tier and this performance is unacceptable. Is pagination configurable?",
    conversation: [
      {
        id: "msg004",
        author: "Marcus Webb",
        authorType: "customer",
        content: "User management page takes 8+ seconds to load with 50k users.",
        timestamp: "2026-06-15T14:20:00Z",
      },
      {
        id: "msg005",
        author: "Jordan (Support)",
        authorType: "agent",
        content: "Thanks Marcus. We've confirmed this is a pagination limitation. Engineering ticket raised.",
        timestamp: "2026-06-15T15:00:00Z",
      },
    ],
    internalNotes:
      "Reproduced locally with 50k seed data. Query time is 6.2s. Offset pagination hits full table scan. This needs cursor pagination + DB index on (created_at, id).",
    attachments: [
      { id: "a003", name: "performance_trace.json", type: "json", size: "28 KB" },
    ],
    createdAt: "2026-06-16T09:10:00Z",
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
    id: "t004",
    status: "pending",
    classification: "churn_signal",
    scope: "L",
    draftTitle: "Resolve data export reliability issues causing compliance audit failures",
    draftDescription:
      "Enterprise customer is unable to reliably export audit logs for compliance requirements. The export job fails silently for datasets >100MB, producing truncated CSV files with no error indication. This is blocking their SOC 2 audit and they have threatened to cancel if not resolved by end of month.",
    suggestedApproach:
      "Replace synchronous export with async background job. Add progress tracking and email notification on completion. Implement streaming CSV generation to handle large datasets. Add error handling with user-visible status.",
    acceptanceCriteria: [
      "Export jobs run asynchronously with progress indicator",
      "User notified by email when export is ready",
      "Streaming CSV handles datasets up to 1GB",
      "Error states surface to user with actionable message",
      "Export job status visible in Settings > Account > Exports",
    ],
    scopeRationale: "Cross-service: export worker, API, settings UI, email service",
    codeRefs: [
      {
        id: "cr006",
        filePath: "src/api/export/handler.py",
        functionName: "export_audit_logs",
        lineStart: 23,
        lineEnd: 65,
        language: "python",
        snippet: `def export_audit_logs(org_id: str, date_range: dict) -> str:
    logs = AuditLog.objects.filter(
        org_id=org_id,
        created_at__range=[date_range['start'], date_range['end']]
    )

    # BUG: no streaming, loads all into memory
    output = io.StringIO()
    writer = csv.writer(output)
    for log in logs:  # can be millions of rows
        writer.writerow([log.id, log.action, log.created_at])

    return output.getvalue()  # silently truncates at memory limit`,
      },
      {
        id: "cr007",
        filePath: "src/workers/export_worker.py",
        functionName: "run_export",
        lineStart: 8,
        lineEnd: 30,
        language: "python",
        snippet: `@celery_app.task
def run_export(job_id: str):
    job = ExportJob.objects.get(id=job_id)
    try:
        data = export_audit_logs(job.org_id, job.date_range)
        save_to_s3(job_id, data)
        job.status = 'complete'
    except Exception:
        pass  # BUG: silent failure, job never marked as error
    job.save()`,
      },
    ],
    customer: {
      id: "c004",
      name: "David Kim",
      email: "d.kim@vaultfintech.com",
      plan: "enterprise",
      avatarInitials: "DK",
    },
    source: "zendesk",
    originalTicketId: "ZD-18199",
    originalSubject: "URGENT: Audit log export is broken — SOC 2 audit at risk",
    originalBody:
      "We are in the middle of a SOC 2 audit and your export feature is broken. Every time we try to export logs for Q1-Q2 2026, we get a partial CSV file with only about 20% of the records. No error message, just a silent failure.\n\nIf this isn't fixed this week, we will have to consider moving to a vendor whose product actually works for enterprise compliance needs.",
    conversation: [
      {
        id: "msg007",
        author: "David Kim",
        authorType: "customer",
        content: "URGENT: Audit log export broken. SOC 2 audit at risk. Getting truncated CSV files.",
        timestamp: "2026-06-15T16:45:00Z",
      },
      {
        id: "msg008",
        author: "Sam (Support)",
        authorType: "agent",
        content: "David, I understand the urgency. This is escalated as P0. Our engineering lead will respond directly.",
        timestamp: "2026-06-15T17:02:00Z",
      },
      {
        id: "msg009",
        author: "David Kim",
        authorType: "customer",
        content: "We need this resolved by end of week or we will need to evaluate alternatives.",
        timestamp: "2026-06-15T17:30:00Z",
      },
    ],
    internalNotes:
      "P0 — churn risk. David is the primary champion at a $120k ARR account. Root cause confirmed: sync export OOMs at ~100MB. Need async job + streaming. Fast-track this.",
    attachments: [
      { id: "a004", name: "partial_export_example.csv", type: "csv", size: "18 MB" },
      { id: "a005", name: "error_screenshot.png", type: "png", size: "89 KB" },
    ],
    createdAt: "2026-06-16T09:30:00Z",
  },
  {
    id: "t005",
    status: "pending",
    classification: "bug",
    scope: "S",
    draftTitle: "Fix login redirect loop for SSO users on password reset flow",
    draftDescription:
      "Users with SSO enabled who attempt to use the standard password reset flow get caught in an infinite redirect loop between /auth/reset-password and /auth/sso. The password reset flow should detect SSO-enabled accounts and redirect to the IdP.",
    suggestedApproach:
      "In the password reset initiation handler, check if the user's email domain has SSO configured. If yes, return a specific error with a link to the SSO login page instead of sending a reset email.",
    acceptanceCriteria: [
      "SSO users attempting password reset see a clear message explaining SSO login",
      "No redirect loop occurs",
      "Non-SSO users unaffected",
    ],
    scopeRationale: "1 auth middleware function, low risk, no DB changes",
    codeRefs: [
      {
        id: "cr008",
        filePath: "src/auth/password_reset.py",
        functionName: "initiate_password_reset",
        lineStart: 15,
        lineEnd: 40,
        language: "python",
        snippet: `def initiate_password_reset(email: str) -> Response:
    user = User.objects.filter(email=email).first()
    if not user:
        return ok_response()  # security: don't reveal existence

    # BUG: doesn't check SSO configuration
    token = generate_reset_token(user)
    send_reset_email(user.email, token)
    return ok_response()`,
      },
    ],
    customer: {
      id: "c005",
      name: "Ana Martínez",
      email: "a.martinez@techstartup.co",
      plan: "growth",
      avatarInitials: "AM",
    },
    source: "freshdesk",
    originalTicketId: "FD-4819",
    originalSubject: "Stuck in login loop after trying to reset password",
    originalBody:
      "I tried to reset my password and now I'm stuck in a loop. I go to reset password, get redirected to SSO, then back to reset password, over and over. Can't log in at all now.",
    conversation: [
      {
        id: "msg010",
        author: "Ana Martínez",
        authorType: "customer",
        content: "Trying to reset password → SSO redirect → password reset → stuck in loop. Can't log in.",
        timestamp: "2026-06-16T11:00:00Z",
      },
    ],
    internalNotes: "Auth redirect loop. SSO users should be told to use IdP. 30-min fix.",
    attachments: [],
    createdAt: "2026-06-16T11:20:00Z",
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
  {
    id: "t007",
    status: "pending",
    classification: "bug",
    scope: "M",
    draftTitle: "Fix search results returning stale data after index update",
    draftDescription:
      "The full-text search endpoint returns stale results for up to 5 minutes after content is updated. The search index is updated synchronously but the cache layer is not invalidated. Users see outdated search results immediately after editing content.",
    suggestedApproach:
      "Add cache invalidation in the content update service to bust search cache entries for the affected organization. Use cache key pattern org:{org_id}:search:* for targeted invalidation.",
    acceptanceCriteria: [
      "Cache invalidated on content update",
      "Search results reflect changes within 5 seconds of update",
      "Cache key pattern documented",
    ],
    scopeRationale: "2 services (content + cache), no DB changes, medium risk due to cache logic",
    codeRefs: [
      {
        id: "cr010",
        filePath: "src/search/cache.py",
        functionName: "get_search_results",
        lineStart: 8,
        lineEnd: 35,
        language: "python",
        snippet: `def get_search_results(org_id: str, query: str) -> list:
    cache_key = f"search:{hash(query)}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    results = elasticsearch.search(org_id=org_id, query=query)
    redis.setex(cache_key, 300, json.dumps(results))  # 5 min TTL
    return results
    # BUG: cache key doesn't include org_id, can leak between orgs
    # BUG: no invalidation on content update`,
      },
    ],
    customer: {
      id: "c007",
      name: "Kenji Tanaka",
      email: "kenji@buildfast.dev",
      plan: "starter",
      avatarInitials: "KT",
    },
    source: "freshdesk",
    originalTicketId: "FD-4815",
    originalSubject: "Search shows old content after I update it",
    originalBody:
      "When I edit a document and then search for it, I still see the old version in search results. Sometimes it takes 10 minutes for the search to show the new content. This is really confusing.",
    conversation: [
      {
        id: "msg012",
        author: "Kenji Tanaka",
        authorType: "customer",
        content: "Edited document → search still shows old content for 10+ minutes.",
        timestamp: "2026-06-16T09:45:00Z",
      },
    ],
    internalNotes: "Cache invalidation bug. Also noticed cache key is missing org_id — potential data leak. Flag for security review.",
    attachments: [],
    createdAt: "2026-06-16T10:00:00Z",
  },
  {
    id: "t008",
    status: "accepted",
    classification: "bug",
    scope: "S",
    draftTitle: "Fix mobile nav menu not closing after route change",
    draftDescription:
      "On mobile viewports, the navigation sidebar overlay persists after the user taps a nav item and navigates to a new route. Users must manually close the menu.",
    suggestedApproach:
      "Add a route change listener that closes the mobile nav state. Subscribe to Next.js router events in the NavSidebar component.",
    acceptanceCriteria: [
      "Nav closes on route change on mobile",
      "No regression on desktop",
    ],
    scopeRationale: "1 component, 3 lines of logic, no risk",
    codeRefs: [
      {
        id: "cr011",
        filePath: "src/components/NavSidebar/index.tsx",
        functionName: "NavSidebar",
        lineStart: 22,
        lineEnd: 45,
        language: "tsx",
        snippet: `export function NavSidebar({ isOpen, onClose }: Props) {
  // TODO: close on route change
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left">
        <NavItems />
      </SheetContent>
    </Sheet>
  );
}`,
      },
    ],
    customer: {
      id: "c008",
      name: "Linh Nguyen",
      email: "linh@appco.io",
      plan: "starter",
      avatarInitials: "LN",
    },
    source: "freshdesk",
    originalTicketId: "FD-4800",
    originalSubject: "Mobile menu doesn't close when I navigate",
    originalBody: "On my phone, when I click a menu item the menu stays open on top of the page. Have to close it manually every time.",
    conversation: [],
    internalNotes: "Quick fix. Router event listener.",
    attachments: [],
    createdAt: "2026-06-15T14:00:00Z",
  },
  {
    id: "t009",
    status: "rejected",
    classification: "feature_request",
    scope: "L",
    draftTitle: "Add native mobile app (iOS/Android)",
    draftDescription:
      "Customer requested a native mobile application. Scope is too large for current roadmap.",
    suggestedApproach: "N/A — rejected, out of scope for V1",
    acceptanceCriteria: [],
    scopeRationale: "Full native app build, out of roadmap scope",
    codeRefs: [],
    customer: {
      id: "c009",
      name: "Rachel Green",
      email: "rachel@mobilefw.com",
      plan: "starter",
      avatarInitials: "RG",
    },
    source: "zendesk",
    originalTicketId: "ZD-18170",
    originalSubject: "Is there a mobile app?",
    originalBody: "Do you have a native iOS or Android app? Would love to manage tickets on the go.",
    conversation: [],
    internalNotes: "Out of scope. Mobile-responsive web is the current strategy.",
    attachments: [],
    createdAt: "2026-06-14T10:00:00Z",
  },
  {
    id: "t010",
    status: "pending",
    classification: "churn_signal",
    scope: "M",
    draftTitle: "Fix notification emails being sent to spam / improve deliverability",
    draftDescription:
      "Multiple customers report that notification emails (digests, alerts) land in spam. Investigation shows missing DKIM signature and no DMARC policy. The email service is not signing outgoing mail, causing major providers (Gmail, Outlook) to flag as spam.",
    suggestedApproach:
      "Configure DKIM signing in the email provider settings. Publish SPF and DMARC DNS records. Update the email service module to pass the signing selector. Test with mail-tester.com.",
    acceptanceCriteria: [
      "DKIM signatures present on all outgoing mail",
      "DMARC record published",
      "SPF record includes sending IP ranges",
      "mail-tester.com score ≥ 9/10",
    ],
    scopeRationale: "Infrastructure + email service config, no app code changes",
    codeRefs: [
      {
        id: "cr012",
        filePath: "src/services/email_service.py",
        functionName: "send_email",
        lineStart: 5,
        lineEnd: 30,
        language: "python",
        snippet: `def send_email(to: str, subject: str, body: str):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to
    # Missing: DKIM signing

    with smtplib.SMTP(settings.SMTP_HOST) as server:
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.FROM_EMAIL, to, msg.as_string())`,
      },
    ],
    customer: {
      id: "c010",
      name: "Omar Hassan",
      email: "o.hassan@retailchain.com",
      plan: "growth",
      avatarInitials: "OH",
    },
    source: "freshdesk",
    originalTicketId: "FD-4818",
    originalSubject: "Your emails keep going to spam",
    originalBody:
      "All the notification emails from your system go straight to our spam folder. We've missed several critical alerts because of this. Other vendors we use don't have this problem. Please fix your email setup.",
    conversation: [
      {
        id: "msg013",
        author: "Omar Hassan",
        authorType: "customer",
        content: "All notification emails going to spam. Missed critical alerts. Other vendors don't have this issue.",
        timestamp: "2026-06-16T10:30:00Z",
      },
    ],
    internalNotes: "Multiple customers reporting this. No DKIM = spam folder. Infrastructure fix needed urgently.",
    attachments: [],
    createdAt: "2026-06-16T11:30:00Z",
  },
  {
    id: "t011",
    status: "pending",
    classification: "question",
    scope: "S",
    draftTitle: "Add API rate limit documentation and rate limit headers",
    draftDescription:
      "Customer is hitting 429 errors with no guidance on rate limits. The API does not return X-RateLimit-* headers, making it impossible to implement proper backoff. Documentation doesn't mention rate limits.",
    suggestedApproach:
      "Add X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers to all API responses. Add rate limit documentation to the developer docs page.",
    acceptanceCriteria: [
      "All API responses include X-RateLimit-Limit, Remaining, Reset headers",
      "Rate limit docs added to developer docs",
      "429 response body includes retry-after seconds",
    ],
    scopeRationale: "Middleware change + docs, no business logic changes",
    codeRefs: [
      {
        id: "cr013",
        filePath: "src/middleware/rate_limiter.py",
        functionName: "rate_limit_middleware",
        lineStart: 1,
        lineEnd: 25,
        language: "python",
        snippet: `class RateLimitMiddleware:
    def __call__(self, request):
        key = f"rate:{request.user.id}"
        current = redis.incr(key)
        if current == 1:
            redis.expire(key, 60)

        if current > 100:
            return HttpResponse(status=429)
            # Missing: rate limit headers, retry-after

        return self.get_response(request)`,
      },
    ],
    customer: {
      id: "c011",
      name: "Felix Wagner",
      email: "felix@devtools.co",
      plan: "starter",
      avatarInitials: "FW",
    },
    source: "webhook",
    originalTicketId: "WH-291",
    originalSubject: "What are the API rate limits?",
    originalBody: "I keep hitting 429 errors but I can't find any documentation on rate limits. Also the 429 response doesn't tell me when I can retry. Please add this info.",
    conversation: [],
    internalNotes: "Rate limit docs missing. Easy win — add headers and docs.",
    attachments: [],
    createdAt: "2026-06-16T12:00:00Z",
  },
  {
    id: "t012",
    status: "pending",
    classification: "feature_request",
    scope: "S",
    draftTitle: "Add keyboard shortcut to quickly switch between workspaces",
    draftDescription:
      "Power users managing multiple workspaces want a keyboard shortcut (⌘K style) to switch between them without navigating to the workspace selector. A command palette for workspace switching would improve their workflow.",
    suggestedApproach:
      "Add a ⌘K / Ctrl+K command palette with workspace search and switching. Reuse the existing dialog component with a combobox for workspace selection.",
    acceptanceCriteria: [
      "⌘K / Ctrl+K opens command palette",
      "Workspace list is searchable",
      "Enter switches to selected workspace",
      "Esc closes the palette",
    ],
    scopeRationale: "New UI component only, no backend changes",
    codeRefs: [
      {
        id: "cr014",
        filePath: "src/components/WorkspaceSwitcher/index.tsx",
        functionName: "WorkspaceSwitcher",
        lineStart: 1,
        lineEnd: 20,
        language: "tsx",
        snippet: `export function WorkspaceSwitcher({ workspaces }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {currentWorkspace.name} <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {workspaces.map(ws => (
          <DropdownMenuItem key={ws.id} onClick={() => switchWorkspace(ws.id)}>
            {ws.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
      },
    ],
    customer: {
      id: "c012",
      name: "Sophie Laurent",
      email: "s.laurent@agencywork.fr",
      plan: "growth",
      avatarInitials: "SL",
    },
    source: "zendesk",
    originalTicketId: "ZD-18205",
    originalSubject: "Keyboard shortcut to switch workspaces?",
    originalBody: "I manage 8 different client workspaces and switching between them requires too many clicks. Do you have or plan to add a ⌘K style switcher?",
    conversation: [],
    internalNotes: "Good feature. Quick build using existing Dialog + Combobox.",
    attachments: [],
    createdAt: "2026-06-16T13:00:00Z",
  },
];
