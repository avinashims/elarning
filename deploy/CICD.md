# CI/CD (GitHub Actions → DigitalOcean)

Push to **`main`** runs tests, then SSH-deploys the droplet the same way as:

```bash
cd /opt/elarning && git pull && bash deploy/deploy-shared.sh
```

Workflow file: `.github/workflows/ci-cd.yml`

```
GitHub (push main)
  → npm test (backend) + vite build (frontend)
  → SSH root@droplet
      git fetch && git reset --hard origin/main
      bash deploy/deploy-shared.sh
```

---

## One-time setup

### 1. Deploy key (laptop)

```powershell
ssh-keygen -t ed25519 -C "github-actions-elearning" -f $env:USERPROFILE\.ssh\elearning_deploy -N '""'
```

This creates:

- **Private:** `%USERPROFILE%\.ssh\elearning_deploy` → GitHub secret (never commit)
- **Public:** `%USERPROFILE%\.ssh\elearning_deploy.pub` → droplet `authorized_keys`

### 2. Allow GitHub to SSH into the server

```bash
ssh root@165.22.209.200
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# paste the ONE line from elearning_deploy.pub
echo "ssh-ed25519 AAAA... github-actions-elearning" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Confirm the app repo on the server can pull:

```bash
cd /opt/elarning
git remote -v
git fetch origin
```

(Use the same GitHub HTTPS remote you already use. If fetch asks for a password, switch the server remote to a **GitHub deploy key** or keep using the existing working `git pull`.)

### 3. GitHub repo secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Value |
|--------|--------|
| `DROPLET_HOST` | `165.22.209.200` |
| `DROPLET_USER` | `root` |
| `DROPLET_SSH_KEY` | **Full private key** (`-----BEGIN OPENSSH PRIVATE KEY-----` …) |

The workflow `cd`s to **`/opt/elarning`** on the droplet (note the spelling). Do not set a path secret to `optelarning` without the leading `/`.

Generate the key **without** a passphrase (`-N ""`) so Actions can use it.

### 4. Push the workflow

```powershell
cd D:\elearning
git add .github/workflows/ci-cd.yml deploy/CICD.md deploy/remote-deploy.sh
git commit -m "Add GitHub Actions CI/CD deploy to DigitalOcean."
git push origin main
```

After secrets are set, that push (or **Actions → CI/CD → Run workflow**) deploys.

---

## What runs when

| Event | Tests | Deploy |
|-------|--------|--------|
| Pull request to `main` | Yes | No |
| Push to `main` | Yes | Yes (if tests pass) |
| **Run workflow** (manual) | Yes | Yes |

Deploy **fails** if `deploy/.env.production` is missing on the server (same as today). Secrets stay on the droplet, not in GitHub.

---

## Watch a deploy

GitHub → **Actions** → latest **CI/CD** run.

On the server:

```bash
docker compose -f /opt/elarning/docker-compose.prod.shared.yml ps
curl -sf http://127.0.0.1:9001/api/health
```

Live: http://165.22.209.200:9002

---

## Disable auto-deploy

GitHub → **Actions** → **CI/CD** → **…** → Disable workflow  
or remove the `deploy` job from `.github/workflows/ci-cd.yml`.
