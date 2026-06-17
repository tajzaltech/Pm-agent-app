from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT_DIR = Path("deliverables")
OUT_DIR.mkdir(exist_ok=True)
PDF_PATH = OUT_DIR / "PM-Agent-How-It-Works.pdf"

TITLE = "PM Agent: How the Tool Works"
SUBTITLE = "A simple English guide for understanding the full product flow"


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="TitleCustom",
            parent=base["Title"],
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#2E4BFF"),
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="SubtitleCustom",
            parent=base["BodyText"],
            alignment=TA_CENTER,
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#5B6475"),
            spaceAfter=18,
        )
    )
    base.add(
        ParagraphStyle(
            name="H1Custom",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#243B53"),
            spaceBefore=14,
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            name="H2Custom",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=17,
            textColor=colors.HexColor("#2E4BFF"),
            spaceBefore=10,
            spaceAfter=5,
        )
    )
    base.add(
        ParagraphStyle(
            name="BodyCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15.5,
            textColor=colors.HexColor("#1F2937"),
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            name="SmallCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#4B5563"),
        )
    )
    return base


S = styles()


def p(text):
    return Paragraph(text, S["BodyCustom"])


def h1(text):
    return Paragraph(text, S["H1Custom"])


def h2(text):
    return Paragraph(text, S["H2Custom"])


def bullets(items, ordered=False):
    rows = []
    for index, item in enumerate(items, start=1):
        marker = f"{index}." if ordered else "-"
        rows.append(
            [
                Paragraph(f"<font color='#2E4BFF'>{marker}</font>", S["BodyCustom"]),
                Paragraph(item, S["BodyCustom"]),
            ]
        )
    table = Table(rows, colWidths=[0.26 * inch, 6.0 * inch], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]
        )
    )
    return table


def note(title, body):
    title_p = Paragraph(f"<b>{title}</b>", S["SmallCustom"])
    body_p = Paragraph(body, S["SmallCustom"])
    table = Table([[title_p], [body_p]], colWidths=[6.35 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F4F6FF")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE3FF")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return [table, Spacer(1, 8)]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#8A94A6"))
    canvas.drawString(0.75 * inch, 0.45 * inch, "PM Agent - Simple Product Guide")
    canvas.drawRightString(7.75 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_story():
    story = [
        Paragraph(TITLE, S["TitleCustom"]),
        Paragraph(SUBTITLE, S["SubtitleCustom"]),
    ]
    story += note(
        "Short summary",
        "PM Agent turns customer support requests into clear engineering tickets. It connects to ticket sources, reads useful code context from repositories, drafts implementation-ready tickets, and lets the team approve or reject them before sending them to a project management tool.",
    )

    story += [
        h1("1. What PM Agent Is"),
        p("PM Agent is a product management assistant for software teams. It helps teams convert customer requests, bugs, and support messages into organized development work."),
        p("The tool does not replace a product manager or engineer. It prepares a first draft, adds useful context, and gives the team a review screen so a human can make the final decision."),
        bullets(
            [
                "Support teams use it to avoid manually rewriting tickets.",
                "Product teams use it to understand customer demand.",
                "Engineering teams use it to see related code areas and implementation notes.",
            ]
        ),
        h1("2. First User Flow"),
        p("The normal user journey is simple:"),
        bullets(
            [
                "The user opens the app and first sees the sign in page.",
                "If the user already has an account, they sign in and go directly to the main app.",
                "If the user is new, they click sign up.",
                "After sign up, the user goes to onboarding.",
                "Onboarding connects tools and prepares the workspace.",
                "After setup, the user lands in the Queue to review AI-created tickets.",
            ],
            ordered=True,
        ),
    ]
    story += note(
        "Current prototype behavior",
        "In the current demo build, sign in goes to the Queue, and sign up goes directly to onboarding. In a real production app, sign up can also include email verification before onboarding.",
    )

    story += [
        h1("3. Authentication Screens"),
        p("The authentication area contains the pages a normal SaaS product needs:"),
        bullets(
            [
                "Sign in: for existing users.",
                "Sign up: for new users creating a workspace.",
                "Forgot password: lets a user request a reset link.",
                "Reset password: lets the user choose a new password.",
                "Verify email: can be used when the product requires email confirmation.",
            ]
        ),
        p("The purpose of these screens is to make the product feel like a real application before the user reaches onboarding and the main dashboard."),
        h1("4. Onboarding Flow"),
        p("Onboarding teaches PM Agent where information comes from, where the code lives, and where accepted tickets should be sent."),
        h2("Step 1: Connect Ticket Source"),
        p("The ticket source is where customer requests come from. Examples include Freshdesk, Zendesk, Jira Service Management, Salesforce, Google Sheets, or a custom webhook."),
        bullets(
            [
                "Freshdesk or Zendesk can bring support tickets into PM Agent.",
                "Salesforce can bring customer or CRM-related requests.",
                "Google Sheets can be used for simple imported request lists.",
                "A webhook lets any external system send ticket data.",
            ]
        ),
        h2("Step 2: Connect Code Repository"),
        p("The repository connection tells PM Agent where the software code lives. The app supports tools such as GitHub and Bitbucket."),
        p("PM Agent uses the repository to understand structure, routes, functions, models, and files that may relate to a customer request."),
    ]
    story += note(
        "Important privacy idea",
        "The intended product behavior is to create a semantic map of the codebase. The user interface states that source code itself is not stored; instead, PM Agent keeps useful code context for matching tickets to implementation areas.",
    )
    story += [
        h2("Step 3: Connect Output Tool"),
        p("The output tool is where approved development tickets should go. Examples include Linear, Jira, Monday.com, ClickUp, and GitHub Issues."),
        p("This step matters because PM Agent should not only analyze requests. It should also push accepted work into the team's normal delivery system."),
        h2("Step 4: Upload Product Docs"),
        p("Product docs give PM Agent more context. The user can upload documentation, requirements, guides, or product notes."),
        bullets(
            [
                "Docs help the agent understand product language.",
                "Docs help reduce vague or incomplete ticket drafts.",
                "Docs make acceptance criteria more accurate.",
            ]
        ),
        h1("5. Indexing"),
        p("After onboarding, PM Agent indexes the workspace. Indexing means the app reads and organizes the connected information so it can be searched and matched later."),
        p("During indexing, the app can show progress such as:"),
        bullets(
            [
                "Reading repository structure.",
                "Parsing functions and routes.",
                "Analyzing models and schemas.",
                "Building a semantic map.",
                "Completing setup.",
            ]
        ),
        h1("6. Main App: Queue"),
        p("The Queue is the main working page. It shows draft engineering tickets created from customer requests. The team reviews these drafts before pushing them to the selected output tool."),
        p("Each queue row usually shows:"),
        bullets(
            [
                "Ticket title.",
                "Customer or source information.",
                "Classification such as bug, feature request, question, or churn signal.",
                "Scope estimate such as small, medium, or large.",
                "Related code references.",
                "Actions like accept, reject, or view.",
            ]
        ),
        h1("7. Ticket Review Page"),
        p("The ticket review page gives a detailed side-by-side view. One side shows the original customer request. The other side shows the AI-generated development ticket."),
        p("The customer side can include:"),
        bullets(
            [
                "Original subject and message.",
                "Customer name, email, and plan.",
                "Conversation history.",
                "Internal notes.",
                "Attachments.",
            ]
        ),
        p("The AI draft side can include:"),
        bullets(
            [
                "Draft title.",
                "Description.",
                "Classification and scope.",
                "Affected code references.",
                "Suggested technical approach.",
                "Acceptance criteria.",
            ]
        ),
        h1("8. Human Review Actions"),
        p("PM Agent is designed around human approval. The AI creates a draft, but the user decides what happens next."),
        bullets(
            [
                "Accept: sends or marks the ticket as approved for the output tool.",
                "Reject: removes the draft from the active review flow.",
                "Edit and accept: lets the user improve the title, description, scope, or acceptance criteria before approval.",
                "Undo: allows the user to quickly reverse a recent action.",
            ]
        ),
        h1("9. Other App Areas"),
        p("The sidebar includes other product areas that support the review workflow:"),
        bullets(
            [
                "Dashboard: shows high-level performance and recent activity.",
                "Clusters: groups related tickets or repeated customer problems.",
                "Analytics: helps understand ticket trends and product demand.",
                "Connections: shows connected tools and integration status.",
                "Settings: manages preferences, team settings, and rules.",
                "Logout: returns the user to the sign in page.",
            ]
        ),
        h1("10. Example Scenario"),
        p("Imagine a customer writes to support: 'Users are being charged twice during checkout.' PM Agent can process that request and create a draft engineering ticket."),
        bullets(
            [
                "The request enters from Freshdesk or Zendesk.",
                "PM Agent checks the connected repository for payment-related files.",
                "It finds likely code areas such as webhook handlers or payment services.",
                "It creates a ticket title, description, suggested approach, and acceptance criteria.",
                "The product or engineering team reviews the draft in the Queue.",
                "If the draft looks correct, the team accepts it and sends it to Linear, Jira, or another output tool.",
            ],
            ordered=True,
        ),
        h1("11. What Makes the Tool Useful"),
        bullets(
            [
                "It saves time by turning raw support messages into structured dev tickets.",
                "It gives engineers better starting context.",
                "It helps product teams identify repeated pain points.",
                "It keeps the final decision with a human reviewer.",
                "It connects customer evidence to delivery work.",
            ]
        ),
        h1("12. Simple Mental Model"),
        p("You can understand PM Agent with this simple flow:"),
    ]
    story += note(
        "Input -> Context -> AI Draft -> Human Review -> Delivery Tool",
        "Customer tickets come in, PM Agent adds product and code context, AI prepares a draft, a human reviews it, and accepted work goes to the team's project management tool.",
    )
    story += [
        h1("13. Notes for Real Production Use"),
        p("The current app is a polished product prototype. For a production version, the following backend features would normally be needed:"),
        bullets(
            [
                "Real authentication and secure sessions.",
                "Real OAuth connections to ticket sources, repositories, and output tools.",
                "Secure storage for integration tokens.",
                "Background jobs for indexing and AI analysis.",
                "Database persistence for users, workspaces, tickets, and actions.",
                "Audit logs and permission controls.",
            ]
        ),
        h1("14. Final Summary"),
        p("PM Agent is a workflow tool for software teams. It starts with sign in or sign up, guides the user through onboarding, connects support tools and repositories, creates AI-assisted ticket drafts, and lets the team review everything before sending work into delivery tools."),
        p("The main value is not only AI writing. The value is combining customer context, code context, product documentation, and human approval in one clear workflow."),
    ]
    return story


def build_pdf():
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.65 * inch,
        title=TITLE,
        author="PM Agent",
    )
    doc.build(build_story(), onFirstPage=footer, onLaterPages=footer)
    return PDF_PATH


if __name__ == "__main__":
    print(build_pdf())
