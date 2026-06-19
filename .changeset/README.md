# Changesets

El versionado del DS (`@telar/ds`) se gestiona con [Changesets](https://github.com/changesets/changesets) (SAD §5, ADR-007).

- Cada PR que cambie el DS añade un changeset: `pnpm changeset`.
- Elige `patch` / `minor` / `major` según SemVer. Un breaking change es **major** y debe incluir nota de migración.
- `@telar/app` está en `ignore`: es la app de referencia, no se publica.

Ver [DEPLOY.md](../DEPLOY.md) §2 para el flujo completo.
