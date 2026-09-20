# Notification Apocalypse — Cloudflare deployment and CI/CD specification

## Status and purpose

This is a follow-on implementation specification for the existing Notification Apocalypse Nuxt application. Implement it after the original game is working. Inspect the repository before changing configuration: preserve the existing package manager, scripts, Nuxt mode, tests, and application behavior.

The outcome must be:

- A public production deployment on Cloudflare Pages.
- A custom subdomain owned by the user.
- Continuous integration for every pull request.
- Automatic production deployment after changes are merged to `main`.
- Safe secret handling and a documented manual setup procedure.
- Previewable local production builds and a reliable rollback path.

Do not ask the user routine implementation questions. Use the defaults in this document. Stop only for values only the user can supply: Cloudflare account access, the actual domain name, GitHub repository access, or secrets.

## 1. Deployment architecture

Deploy the current game as a statically generated Nuxt application to Cloudflare Pages.

```text
Developer branch
      ↓ pull request
GitHub Actions CI
      ↓ merge after checks pass
main branch
      ↓ GitHub Actions deployment
Cloudflare Pages
      ↓
game.<USER_DOMAIN>
```

Defaults:

- Pages project name: `notification-apocalypse`
- Production branch: `main`
- Suggested custom hostname: `apocalypse.<USER_DOMAIN>`
- Cloudflare fallback URL: `notification-apocalypse.pages.dev`
- Node version: current active LTS supported by the repository and Cloudflare; pin it in `.nvmrc` and Actions.
- Package manager: retain the lockfile already present. Use `npm ci` if `package-lock.json` exists.

The deployment must not require a server for the current deterministic game. The later AI extension will add a separate Cloudflare Worker API and must not force the static frontend to expose secrets.

## 2. Repository changes

Add or update:

```text
.github/
  dependabot.yml
  workflows/
    ci.yml
    deploy-production.yml
.nvmrc
public/
  _headers
  _redirects
scripts/
  smoke-test.mjs
DEPLOYMENT.md
wrangler.toml or wrangler.jsonc
```

Do not commit API tokens, account IDs, generated build output, `.env` files, or Wrangler state.

## 3. Nuxt production output

Inspect the current Nuxt configuration and confirm the site has no required server routes. Configure static generation without changing the game runtime behavior.

Required behavior:

- `npm run generate` creates a deployable static directory.
- Prefer Nuxt's standard `.output/public` output when using `nuxt generate`.
- The deployment workflow must verify that `index.html` exists in the selected output directory before uploading.
- All assets use root-safe paths compatible with the custom subdomain.
- Client-side navigation survives a direct page load.
- Source maps are excluded from production unless explicitly needed.
- The game continues to work offline after initial load if PWA support already exists; do not add PWA scope to this task.

Add the script if missing:

```json
{
  "generate": "nuxt generate"
}
```

If the existing app genuinely requires SSR, do not force static generation. Document the finding and adapt it to a Cloudflare Worker deployment. The expected baseline game should be static.

## 4. Continuous-integration workflow

Create `.github/workflows/ci.yml`.

Triggers:

- Every pull request targeting `main`.
- Every push to `main`.
- Manual `workflow_dispatch`.

Requirements:

- Minimal permissions: `contents: read`.
- Cancel superseded runs for the same branch or pull request.
- Set a reasonable timeout, such as 15 minutes.
- Install the pinned Node version.
- Cache dependencies using the package-manager integration built into `actions/setup-node`.
- Use the lockfile-enforcing install command.
- Run the following in this order:

```bash
npm run lint
npm run typecheck
npm run test
npm run generate
npm run test:e2e
```

Adapt only if the repository uses different existing script names. Do not silently skip a quality gate. Configure Playwright to start the generated production preview instead of the development server in CI.

Upload Playwright traces/screenshots only when E2E tests fail. Retain them for seven days.

Add a build-artifact integrity step that fails if:

- The static output directory is missing.
- `index.html` is missing.
- Any single asset unexpectedly exceeds 5 MiB.
- The generated site contains a literal OpenAI or Cloudflare secret prefix.

## 5. Production deployment workflow

Create `.github/workflows/deploy-production.yml`.

Trigger:

- Push to `main`.
- Manual `workflow_dispatch`.

The workflow may repeat the quality gates rather than trusting a separate workflow run. Reliability is more important than saving a few CI minutes.

Required steps:

1. Check out the exact commit.
2. Set up the pinned Node version and dependency cache.
3. Install from the lockfile.
4. Run lint, typecheck, unit tests, and production generation.
5. Deploy the static output with the official `cloudflare/wrangler-action` and `wrangler pages deploy`.
6. Associate the deployment with GitHub deployments using `GITHUB_TOKEN`.
7. Run a smoke test against the returned deployment URL.
8. Write the production URL and deployed commit SHA to the GitHub job summary.

Workflow permissions:

```yaml
permissions:
  contents: read
  deployments: write
```

Use GitHub's `production` environment. Add concurrency so only one production deployment runs at a time and a newer deployment supersedes an older queued deployment.

The conceptual deploy command is:

```bash
wrangler pages deploy .output/public \
  --project-name=notification-apocalypse \
  --branch=main \
  --commit-hash="$GITHUB_SHA" \
  --commit-dirty=false
```

Use the current supported syntax exposed by the installed Wrangler version. Pin Wrangler and the GitHub actions to stable versions; preferably pin third-party actions by full commit SHA and add an inline comment with the human-readable release.

Do not deploy pull requests with production secrets. Pull requests run CI only. Cloudflare Pages creates immutable deployments, so production rollback remains available without inventing a custom rollback mechanism.

## 6. Smoke test

Create `scripts/smoke-test.mjs` using Node's built-in `fetch`.

It accepts a URL argument and retries for up to 60 seconds with bounded backoff. Verify:

- `/` returns HTTP 200.
- The response is HTML.
- The page contains `Notification Apocalypse`.
- The main JavaScript asset referenced by the page returns HTTP 200.
- Security headers expected from `_headers` are present where Cloudflare supports them.

Never print secret values in failure logs.

## 7. Cloudflare project setup — user steps

Document these exact steps in `DEPLOYMENT.md`.

### 7.1 Create the Pages project

The user performs this once:

1. Log in to Cloudflare.
2. Open **Workers & Pages**.
3. Create a Pages application using **Direct Upload**.
4. Use project name `notification-apocalypse`.
5. Perform the first upload either with the completed GitHub Action or locally with Wrangler.

Do not additionally enable Cloudflare's built-in Git integration for the same project; GitHub Actions is the deployment owner in this design.

### 7.2 Create a least-privilege API token

The user performs this once:

1. Open **My Profile → API Tokens → Create Token → Custom Token**.
2. Name it `github-notification-apocalypse-deploy`.
3. Grant `Account → Cloudflare Pages → Edit` for the specific account.
4. Restrict account resources to the intended account.
5. Create the token and copy it once.

Do not use the Global API Key.

### 7.3 Add GitHub secrets and variables

In GitHub repository **Settings → Secrets and variables → Actions**, add:

Secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Repository variables:

- `CLOUDFLARE_PAGES_PROJECT=notification-apocalypse`
- `PRODUCTION_URL=https://apocalypse.<USER_DOMAIN>` after the domain is attached

Use a GitHub `production` environment for the two secrets if possible. Never store either credential as a repository variable.

### 7.4 Attach the custom subdomain

The user replaces `<USER_DOMAIN>` with their domain:

1. In Cloudflare, open **Workers & Pages → notification-apocalypse → Custom domains**.
2. Select **Set up a domain**.
3. Enter `apocalypse.<USER_DOMAIN>`.
4. Confirm the DNS change.
5. Wait until the custom domain shows active and its TLS certificate is issued.
6. Open the HTTPS URL in a private browser window.

If the domain's DNS zone is already managed by the same Cloudflare account, Cloudflare should create the CNAME automatically. Otherwise create a CNAME from `apocalypse.<USER_DOMAIN>` to `notification-apocalypse.pages.dev`, but only after associating the hostname through the Pages project's Custom domains screen.

### 7.5 Protect the main branch

Enable a GitHub branch ruleset for `main`:

- Require pull requests before merging.
- Require the CI workflow checks.
- Require branches to be up to date before merging when practical.
- Block force pushes and deletion.
- Do not require a manual production approval during the hackathon unless the team explicitly wants it.

## 8. Feature delivery lifecycle

Every new feature follows:

1. Create a feature branch.
2. Implement and test locally.
3. Open a pull request.
4. CI runs all quality gates.
5. Review and merge to `main`.
6. Production workflow rebuilds from the merge commit.
7. Cloudflare receives an immutable deployment.
8. Smoke test verifies the new deployment.
9. The custom subdomain serves the new production version.

Never build locally and upload an uncommitted directory for production.

## 9. Rollback

Document two rollback choices:

### Preferred: revert through Git

Create a revert commit for the faulty change and merge it. This preserves source/deployment consistency and triggers a new production deployment.

### Emergency: Cloudflare deployment rollback

In the Pages project's deployment history, select the last known-good deployment and roll production back to it. Immediately follow up with a Git revert so `main` again represents production.

Do not delete failed deployment history.

## 10. Security headers

Add a conservative `public/_headers` file compatible with the current app. At minimum:

```text
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Add a Content Security Policy only after inspecting all assets and runtime needs. It must permit the app's own scripts/styles/audio while avoiding `*`. The later AI Worker origin must be explicitly added to `connect-src` when that feature is implemented.

Configure immutable caching for hashed assets and no-cache/revalidation for HTML. Do not cache `index.html` for a year.

## 11. Dependency maintenance

Configure Dependabot for:

- npm dependencies weekly.
- GitHub Actions weekly.
- A maximum of five open pull requests per ecosystem.
- Group non-major development-dependency updates where safe.

Dependency update pull requests must pass the same CI checks and never auto-merge major versions.

## 12. Acceptance criteria

- A pull request cannot be merged cleanly when lint, types, unit tests, build, or E2E tests fail.
- A merge to `main` automatically deploys the exact merge commit.
- Production secrets never reach the client bundle or repository.
- The game loads successfully at both the Pages URL and custom subdomain.
- HTTPS is active on the custom subdomain.
- A failed deployment does not replace the last working production build.
- Deployment status and URL appear in GitHub.
- The smoke test checks the deployed site.
- A rollback procedure is documented and has been rehearsed once.
- `DEPLOYMENT.md` tells a non-expert exactly which dashboard values to create and where to paste them.
- The application remains fully playable after deployment.

## 13. Final instruction to Codex

Implement all repository-controlled parts autonomously. Validate the generated output and workflows locally where possible. Do not fabricate account IDs, tokens, domain names, deployment URLs, or successful cloud operations. When cloud credentials or the domain are required, finish every local change first and present the user with the shortest exact checklist of remaining manual actions.

## Authoritative references checked for this specification

- Cloudflare's Nuxt guide documents Pages deployment and automatic deployments from Git repositories: https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/
- Cloudflare's CI guide documents `wrangler-action`, the Pages deploy command, account ID, and API-token secrets: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- Cloudflare's custom-domain guide documents Pages domain association and CNAME setup: https://developers.cloudflare.com/pages/configuration/custom-domains/

