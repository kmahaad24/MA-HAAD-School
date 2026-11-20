# Deploying to Hostinger

This site is a Next.js **Node.js app** (it has a dashboard, API routes and a database), so it needs a Hostinger plan that runs Node.js apps — **Business / Cloud web hosting (Node.js Web Apps)** or a **VPS**. A plain "static" upload of HTML files will not work.

## 1. Database — MongoDB Atlas (free)

Hostinger does not host MongoDB, so use MongoDB Atlas:

1. Create a free cluster at <https://www.mongodb.com/atlas>, add a database user.
2. **Network Access** → add the IP address of your Hostinger server (hPanel shows it), or `0.0.0.0/0` while testing.
3. Copy the connection string → `MONGO_URI=mongodb+srv://USER:PASSWORD@cluster…/mahaad`.

## 2. Email — Hostinger mailbox

1. hPanel → **Emails** → create a mailbox, e.g. `info@your-domain.com`.
2. Use its SMTP details: host `smtp.hostinger.com`, port `465` (SSL), user = full email address, password = mailbox password.
3. Set `ADMIN_EMAIL` to whoever should receive contact-form messages (several, comma-separated).

## 3. Photo folder outside the app

Uploaded photos must survive redeploys, so keep them outside the app folder. In hPanel → **File Manager**, create a folder in your home directory, e.g. `/home/u123456789/mahaad-uploads`, and set `UPLOAD_DIR` to that full path. (The `uploads/` folder inside the project is only the default for local development.) Include this folder in your backups — the database only stores the links.

## 4. Environment variables

Set these in hPanel (Node.js app → **Environment variables**) or in a `.env` file next to `package.json`:

```
MONGO_URI=mongodb+srv://…
JWT_SECRET=<a long random string — openssl rand -base64 48>
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_SITE_URL=https://your-domain.com
UPLOAD_DIR=/home/u123456789/mahaad-uploads
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@your-domain.com
SMTP_PASS=<mailbox password>
MAIL_FROM=info@your-domain.com
MAIL_FROM_NAME=MA HAAD School & College
ADMIN_EMAIL=info@your-domain.com
```

`NEXT_PUBLIC_SITE_URL` is baked in at build time — set it **before** building, with `https://` and no trailing slash.

## 5a. Hostinger Node.js Web App (hPanel)

1. hPanel → **Websites → Add website → Node.js app**; connect the GitHub repository (or upload a ZIP of the project **without** `node_modules`, `.next` and `uploads`).
2. Node.js version: **20 or 22**.
3. Build command: `npm ci && npm run build` · Start command: `npm start` · Entry/root: the project folder.
4. Add the environment variables (step 4) and deploy.
5. First time only, create the admin and starting content from the app's terminal / SSH:
   ```bash
   npm run create-admin -- admin@your-domain.com "StrongPassword123" "Admin Name"
   npm run seed-content
   ```

## 5b. Hostinger VPS (PM2 + Nginx)

```bash
# on the server (Ubuntu), once
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs nginx
sudo npm i -g pm2
git clone <your repo> mahaad && cd mahaad
cp .env.example .env && nano .env          # fill in step 4
npm ci && npm run build
npm run create-admin -- admin@your-domain.com "StrongPassword123" "Admin Name"
npm run seed-content
pm2 start npm --name mahaad -- start && pm2 save && pm2 startup
```

Nginx site (`/etc/nginx/sites-available/mahaad`), then enable HTTPS with `sudo certbot --nginx`:

```nginx
server {
  server_name your-domain.com www.your-domain.com;
  client_max_body_size 10M;            # photo uploads (limit in the app is 8 MB)
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Updating later: `git pull && npm ci && npm run build && pm2 restart mahaad`.

## 6. After going live

- Open `/login`, sign in, then **Settings → Email → Send test email**.
- **Website Content → School information**: check the name, phones, address, logo and link-preview image.
- Submit the sitemap `https://your-domain.com/sitemap.xml` in Google Search Console (paste the verification code in Website Content → School information → Search engines).
- Make sure the site opens with `https://` (Hostinger → SSL). Security headers such as HSTS assume HTTPS.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Photos disappear after a redeploy | `UPLOAD_DIR` is not set or points inside the app folder — see step 3 |
| Upload fails with "too large" | Raise the server/proxy upload limit (Nginx `client_max_body_size 10M`) |
| No emails | Settings → Email shows the error; check `SMTP_*`, try port `587` with `SMTP_SECURE=false` |
| "Server error" on every page | `MONGO_URI` wrong, or the Hostinger IP is not allowed in Atlas Network Access |
| Changes in the dashboard not visible | Saved content refreshes instantly; if the host runs several app processes, others refresh within 60 seconds |
