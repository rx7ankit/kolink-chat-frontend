EC2 Chat staging: http://43.199.33.177:3100 (API http://43.199.33.177:8100).

UGC stays on :3000 / :8000. Production Chat stays on Vercel + Render (`main`).

This `dev` branch rsyncs frontend source and restarts the staging web container (`next dev`). See `kolink-chat-backend/deploy/README.md`. GitHub secrets `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` must be set or the Action cannot SSH.
