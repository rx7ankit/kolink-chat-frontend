EC2 Chat staging: http://43.199.33.177:3100 (API http://43.199.33.177:8100).

UGC stays on :3000 / :8000. Production Chat stays on Vercel + Render (`main`).

This `dev` branch deploys only to the EC2 Compose project `kolink-chat`. See `kolink-chat-backend/deploy/README.md`.
