This is a [Next.js](https://nextjs.org) frontend with a FastAPI backend.

## Getting Started

Run the API (from `backend/`, with `.env` configured):

```bash
.venv/bin/uvicorn main:app --reload --port 8000 --host 127.0.0.1
```

Then run the Next.js app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend talks to the API at `http://localhost:8000` by default (`NEXT_PUBLIC_API_URL`).

## Deploy the API

From `backend/`:

```bash
docker build -t pm-agent-api .
docker run --env-file .env -p 8000:8000 pm-agent-api
```

Set `APP_ENV=production`, a strong `JWT_SECRET`, Atlas `MONGODB_URI`, and `FRONTEND_ORIGIN` to the live Next.js URL. Atlas Network Access must allow the API host (or `0.0.0.0/0`). Google Cloud needs `{FRONTEND_ORIGIN}/auth/google/callback`. The container listens on `PORT` (default 8000). Health: `/health`, readiness: `/ready`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
