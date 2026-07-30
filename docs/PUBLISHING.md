# Publishing `@plydot/pay-client`

This package is developed in the Plydot Pay monorepo under `plydot-pay-client-js/` and synced to the public GitHub repo [plydot/plydot-pay-client-js](https://github.com/plydot/plydot-pay-client-js).

---

## CI publish (recommended)

On every push to `main` (except commits with `[skip publish]` in the message):

1. Run `npm test`
2. Bump patch version in `package.json`
3. `npm publish --access public`
4. Commit version bump with `[skip publish]` and tag `vX.Y.Z`

### GitHub secrets

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm automation token with publish access to `@plydot` scope |

Create the token at https://www.npmjs.com/settings/plydot/tokens with **Publish** permission.

### Prerequisites

1. npm org `@plydot` exists
2. Package `@plydot/pay-client` is created (first publish may require manual `npm publish --access public`)
3. GitHub repo `plydot/plydot-pay-client-js` exists with `main` branch

---

## Manual publish

```bash
cd plydot-pay-client-js
./scripts/publish.sh
```

Credentials file (optional):

```bash
# ~/.config/plydot/npm-publish.env
NPM_TOKEN=npm_…
```

The script runs tests, builds, and publishes. Check https://www.npmjs.com/package/@plydot/pay-client after publish.

---

## Sync from monorepo

From the Plydot Pay repo root:

```bash
./scripts/sync-client-js-to-github.sh
```

This rsyncs `plydot-pay-client-js/` to a local clone of `github.com/plydot/plydot-pay-client-js` and pushes `main`.

Environment overrides:

```bash
GITHUB_REPO=git@github.com:plydot/plydot-pay-client-js.git
CLONE_DIR=/tmp/plydot-pay-client-js
```

---

## Versioning

- Initial npm release: `0.1.0`
- CI auto-bumps patch on each `main` push
- Track Kotlin client semver loosely (`0.1.x` ↔ Pay API `/v1`)

To skip CI publish for a docs-only commit, include `[skip publish]` in the commit message.

---

## Local development

```bash
cd plydot-pay-client-js
npm install
npm test
npm run build
```

Link locally:

```bash
npm link
cd ../your-app
npm link @plydot/pay-client
```
