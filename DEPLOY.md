# Deploy guide — GitHub → Cloudflare Pages → golkar.ai

This project is a static Vite build. The whole thing deploys as static files,
so Cloudflare Pages is a clean fit. Below are the exact steps. You run the
commands locally (they need your GitHub/Cloudflare credentials, which this
environment does not have).

---

## 1. Create the GitHub repo and push

From the project folder. **First remove the stale `.git` folder** left by the
scaffolding step (the build environment could not finish or delete it on the
mounted drive — your Mac can):

```bash
rm -rf .git    # clears the half-initialized repo from scaffolding
git init
git add .
git commit -m "Initial commit: interactive AI demand & space data center model"
git branch -M main
```

Create an empty repo on GitHub (no README/license, to avoid conflicts), then:

```bash
git remote add origin https://github.com/<your-username>/ai-demand-model.git
git push -u origin main
```

> Tip: with the GitHub CLI you can do it in one shot:
> `gh repo create ai-demand-model --public --source=. --remote=origin --push`

---

## 2. Deploy on Cloudflare Pages

There are two paths. **Git integration** (recommended) gives you automatic
deploys on every push.

### Option A — Git integration (recommended)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorize GitHub and pick the `ai-demand-model` repo.
3. Build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variable:** add `NODE_VERSION` = `20` (Settings → Environment
     variables) so the build uses a modern Node.
4. **Save and Deploy.** You get a `https://ai-demand-model.pages.dev` URL.
   Every push to `main` redeploys automatically.

### Option B — Direct upload with Wrangler

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name ai-demand-model
```

---

## 3. Attach the custom domain `golkar.ai`

You said the domain is yours. Easiest if its DNS is on Cloudflare.

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `golkar.ai` (and/or `www.golkar.ai`).
3. **If `golkar.ai` is already on Cloudflare DNS:** Pages adds the records
   automatically — just confirm. SSL provisions in a few minutes.
4. **If the domain is registered elsewhere:** either
   - move the domain's nameservers to Cloudflare (add the site to your
     Cloudflare account first, then update nameservers at your registrar), or
   - add the CNAME Cloudflare shows you at your current DNS host:
     `golkar.ai  CNAME  ai-demand-model.pages.dev` (apex CNAME flattening
     supported on Cloudflare; some registrars need an ALIAS/ANAME record).
5. Wait for the certificate to go active (usually minutes, up to ~an hour).

To redirect `www` → apex (or vice versa), add the second custom domain and set
a redirect rule, or just point both at the Pages project.

---

## 4. Future updates

```bash
# edit code, then:
git add -A
git commit -m "Tune agent intensity assumptions"
git push
```

With Git integration, the push triggers a fresh Pages build and deploy. No
other steps.

---

## Notes

- The `public/_redirects` file routes everything to `index.html` (harmless for a
  single-page app; future-proofs client-side routing if you add it).
- If a build ever fails on Cloudflare with a Node error, bump `NODE_VERSION`.
- Nothing here needs a server or environment secrets; it is fully static.
