# DEPLOY.md — Build, publicación y despliegue

> Cómo se construye, versiona, publica el DS y se despliega la app. Se completa conforme las fases lo habiliten (la publicación real y el despliegue se cierran en Fase 3, SAD §12).

---

## 1. Build local

```bash
pnpm install
pnpm tokens        # genera tokens antes de compilar (CSS vars + tipos TS)
pnpm build         # build de todo el workspace (Turborepo respeta el grafo)
```

- **DS (`packages/ds`)** compila en **library mode** (Vite): ESM + tipos, con `sideEffects` declarado para preservar tree-shaking (el CSS importado cuenta como side effect — SAD §9).
- **App (`packages/app`)** compila como **SPA** estática (HTML + JS + CSS) lista para servir desde cualquier hosting de estáticos/CDN.

El orden importa: `tokens` → `ds` → `app`. Turborepo lo encadena por el grafo de dependencias.

---

## 2. Versionado y publicación del DS (Changesets — ADR-007)

SemVer estricto. Cada PR que cambie el DS debe incluir un changeset.

```bash
pnpm changeset             # describe el cambio (patch/minor/major) + nota de migración si es breaking
pnpm changeset version     # aplica los bumps y actualiza CHANGELOG
pnpm -C packages/ds build  # build de la librería
# pnpm -C packages/ds publish   # publica al registry (privado) — habilitado en Fase 3
```

- **Breaking change → major**, siempre con nota de migración (SAD §5, ADR-007).
- El registry de publicación (privado) se configura cuando se extraiga el DS. Hasta entonces, la app lo consume vía workspace (`workspace:*`).

---

## 3. CI/CD (SAD §10)

Pipeline por PR (ningún paso es saltable, lo barato primero):

```
install → typecheck → lint → unit+component → build DS → build app
        → Storybook + visual regression → E2E (Cypress) → Lighthouse CI
        → size report → (en main) Changesets version + publish
```

- **Fase 0:** CI esqueleto = install → typecheck → lint → test → build.
- **Fases 1–3:** se suman a11y, visual regression, E2E, Lighthouse y size budgets.
- Branching: **trunk-based**, `main` siempre desplegable (SAD §10.2).

---

## 4. Despliegue de la app (Tejido)

> Por definir en Fase 3. La app es una SPA estática: cualquier hosting de estáticos con fallback SPA (todas las rutas → `index.html`) sirve.

Checklist de release de la app (se completará):

- [ ] Variables de entorno (endpoints reales vs MSW).
- [ ] Source maps subidos para observabilidad (Sentry o equivalente — SAD §10.3).
- [ ] Versión de DS y app embebidas en cada evento de telemetría.
- [ ] Budgets de performance verificados (Lighthouse CI, size-limit — SAD §9).

---

## 5. Observabilidad (SAD §10.3)

- Captura global de errores con source maps.
- RUM de Web Vitals reales (LCP/CLS/INP).
- Trazabilidad: versión de DS + app en cada evento, para correlacionar regresiones con releases.

_(Configuración concreta se documenta al implementarse en Fase 3.)_
