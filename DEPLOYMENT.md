# Cloudflare Pages deployment

Notification Apocalypse is generated as a static Nuxt site and deployed to Cloudflare Pages by GitHub Actions. GitHub Actions—not Cloudflare's Git integration—is the deployment owner.

The repository contains no Cloudflare credentials. Complete the one-time account setup below before merging the deployment workflow to `main`.

## Architecture

```text
feature branch → pull request → CI → merge to main → production workflow
                                                        ↓
                                              Cloudflare Pages
                                                        ↓
                                      apocalypse.harshdeepsingh.dev
```

- Pages project: `notification-apocalypse`
- Production branch: `main`
- Static output: `.output/public`
- Fallback URL: `https://notification-apocalypse.pages.dev`
- Custom hostname: `apocalypse.harshdeepsingh.dev`

## One-time setup

### 1. Create the Pages project

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Select **Create application**, then create a **Pages** application using **Direct Upload**.
3. Enter `notification-apocalypse` as the project name.
4. Complete the first upload with the production GitHub Action after configuring its credentials, or run the documented local Wrangler command.

Do not also enable Cloudflare's built-in Git integration for this project. Direct Upload through GitHub Actions is the sole deployment path.

### 2. Create a least-privilege Cloudflare token

1. Open **My Profile → API Tokens → Create Token → Custom Token**.
2. Name the token `github-notification-apocalypse-deploy`.
3. Grant **Account → Cloudflare Pages → Edit**.
4. Restrict account resources to the intended Cloudflare account.
5. Create the token and copy it once.

Do not use the Global API Key.

### 3. Configure GitHub

In the GitHub repository, open **Settings → Environments** and create an environment named `production`. Prefer storing both credentials as environment secrets there. Repository Actions secrets also work.

Add these **secrets** under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`: the least-privilege token from the previous step.
- `CLOUDFLARE_ACCOUNT_ID`: the account ID shown on the Cloudflare account overview.

Add these **repository variables**:

- `CLOUDFLARE_PAGES_PROJECT` = `notification-apocalypse`
- `PRODUCTION_URL` = `https://apocalypse.harshdeepsingh.dev` after the custom domain is active. Until then, use `https://notification-apocalypse.pages.dev`.

Credentials must remain secrets, never repository variables or `.env` files.

### 4. Attach the custom subdomain

1. Open **Workers & Pages → notification-apocalypse → Custom domains**.
2. Select **Set up a domain**.
3. Enter `apocalypse.harshdeepsingh.dev`.
4. Confirm the DNS change.
5. Wait until Cloudflare reports the hostname active and its TLS certificate issued.
6. Open the HTTPS URL in a private browser window and play through the first notification.

When the `harshdeepsingh.dev` DNS zone is managed by the same Cloudflare account, Cloudflare should create the DNS record automatically. Otherwise, first associate the hostname in the Pages **Custom domains** screen, then create a CNAME from `apocalypse.harshdeepsingh.dev` to `notification-apocalypse.pages.dev`.

### 5. Protect `main`

Create a GitHub branch ruleset for `main`:

1. Require a pull request before merging.
2. Require the **CI / Quality gates** check.
3. Require branches to be current before merging when practical.
4. Block force pushes and branch deletion.
5. Do not require manual production approval during the hackathon unless the team wants that extra gate.

## Delivery lifecycle

1. Create a feature branch and implement the change.
2. Run the local quality gates.
3. Open a pull request targeting `main`.
4. CI installs from `package-lock.json`, then runs lint, typecheck, unit tests, static generation, build-integrity checks, and E2E tests against the generated production preview.
5. Review and merge the pull request.
6. The production workflow rebuilds the exact merge commit and deploys `.output/public`.
7. The workflow smoke-tests the immutable Pages deployment and records its URL and commit SHA in the job summary.
8. Cloudflare serves the deployment through the Pages URL and custom domain.

Pull requests never receive production secrets and cannot deploy.

## Local production verification

Use the pinned Node version and locked dependencies:

```bash
nvm use
npm ci
npm run lint
npm run typecheck
npm run test
npm run generate
npm run check:build
CI=1 npm run test:e2e
```

Preview the generated site:

```bash
npm run preview
```

The Cloudflare `_headers` rules are applied only on Pages, so the deployment smoke test is intended for a deployed URL:

```bash
npm run smoke:test -- https://notification-apocalypse.pages.dev
```

For an intentional first upload after the Pages project exists:

```bash
npx wrangler@4.135.0 pages deploy .output/public \
  --project-name=notification-apocalypse \
  --branch=main \
  --commit-hash="$(git rev-parse HEAD)" \
  --commit-dirty=false
```

Production deployments must normally come from committed `main` builds in GitHub Actions, not an uncommitted local directory.

## Rollback

### Preferred: revert through Git

1. Revert the faulty change in a new branch.
2. Open and merge the revert pull request.
3. Confirm the production workflow deploys the revert commit.
4. Confirm the smoke test and custom hostname pass.

This keeps `main` and production synchronized.

### Emergency: Cloudflare deployment rollback

1. Open **Workers & Pages → notification-apocalypse → Deployments**.
2. Select the last known-good immutable deployment.
3. Use Cloudflare's production rollback control and confirm the custom hostname.
4. Immediately create and merge a matching Git revert so `main` again represents production.

Do not delete failed deployment history.

### Rollback rehearsal

After the first production deployment, rehearse once with a harmless documentation-only change: deploy it, use the Cloudflare deployment history to identify the prior version, and verify the rollback control without deleting history. Record the date and participants in the repository or team runbook. If the rollback is actually executed, follow it with a Git revert.

## Troubleshooting

- **Authentication failure:** confirm the token has only **Cloudflare Pages → Edit** for the correct account and that both values are GitHub secrets.
- **Project not found:** verify `CLOUDFLARE_PAGES_PROJECT` exactly matches `notification-apocalypse` and the account ID owns it.
- **Custom hostname unavailable:** verify the domain is associated in Pages before editing CNAME records, then wait for TLS issuance.
- **Smoke test fails on headers:** verify `public/_headers` exists in `.output/public/_headers` after generation and that the tested URL is a Pages deployment rather than the local preview.
- **E2E preview fails:** run `npm run generate` before `CI=1 npm run test:e2e`; CI deliberately tests generated output, not the development server.
