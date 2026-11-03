# Dependency and code security checks

GitHub Dependabot checks npm and GitHub Actions every Monday at 09:00 Asia/Tokyo.
Routine minor/patch updates and security updates use separate PR groups. Updates
still require review and passing checks before release.

The `Security checks` workflow runs `npm audit` against the lockfile and fails on
high or critical findings. Moderate and low findings remain visible in the log;
a successful workflow does not mean that every dependency advisory is resolved.
Both workflows use a read-only repository token, and checkout does not persist it.

The PWA advertising rule accepts `a8.net` and hostname suffix `.a8.net`. The
regression test also checks unrelated lookalike domains, paths and URL credentials.

## Advisories requiring an upstream-compatible update

Reviewed on 2026-11-03 against the current application and lockfile:

| Advisory | Dependency path and exposure | Follow-up |
| --- | --- | --- |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | `minimatch` is used by build/lint tooling, including Workbox, ESLint and the Sentry bundler. Application routes do not accept user-supplied glob patterns. | The published fix is 11.0.1. Older callers, including callable CommonJS consumers, cannot all be replaced with that major version without a tooling migration. Keep the alert open. |
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | Affected `glob` versions are pulled in by Sentry's bundler and Sucrase. The application does not expose glob traversal or cancellation to requests; source-map uploads are disabled. | The published fix is 14.0.2, outside those packages' declared ranges. Track compatible upstream updates rather than forcing an unreviewed global major-version override. |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | `deepmerge` is pulled in by Rollup's node-resolve plugin. It merges build configuration, not user request objects in this application. | No patched version is published. Keep the alert open and track the upstream fix. |

These exposure findings do not remove the advisories. Reassess them when the
dependency chain or the application's input paths change. Do not dismiss alerts
solely because their severity is below the CI failure threshold.
