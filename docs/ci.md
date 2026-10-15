# CI

Every push and pull request runs `npm test` through `.github/workflows/ci.yml`.

The suite in `test/aplsi.test.mjs` is the source of truth for the frozen core.
If a glyph ever changes meaning, a test fails and the repo turns red. The
language can grow; it cannot silently change.

The repo is public, so these runs use the free, unlimited Actions minutes.
