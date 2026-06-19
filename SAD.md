# Software Architecture Document (SAD)

## Telar Design System + Tejido (reference app)

| Campo           | Valor                                                   |
| --------------- | ------------------------------------------------------- |
| Proyecto        | Telar — Design System en Vue 3 + app de referencia      |
| Versión         | 1.1.0                                                   |
| Estado          | Approved for implementation                             |
| Autor           | Fabián Rubio — Full Stack / Frontend                    |
| Audiencia       | Equipo de ingeniería, UX, Product, evaluadores técnicos |
| Última revisión | 2026-06-18                                              |

> **Nota de lectura.** Este documento describe _por qué_ el sistema está construido como está, no solo _qué_ contiene. Las decisiones se registran como ADRs (Architecture Decision Records) con su contexto y trade-offs, porque en producción lo que se paga caro no es la decisión, sino la decisión sin rastro de por qué se tomó. El nombre **Telar** (el sistema que entrelaza tokens y comportamiento en UI consistente) y **Tejido** (la app que demuestra que el telar funciona) son la metáfora rectora del proyecto: los _tokens son los hilos_, los componentes son la tela. Las herramientas de terceros nombradas como ejemplo (Chromatic para visual regression, Sentry para observabilidad) sí son intercambiables.

---

## 1. Contexto y objetivos

### 1.1 Problema que resuelve

Los equipos frontend que crecen sin una capa de UI compartida terminan con N implementaciones del mismo botón, inconsistencia visual, accesibilidad parcheada al final y bugs que se reescriben en cada pantalla. El costo no es estético: es velocidad de entrega y deuda que se acumula en cada release.

Este proyecto entrega **dos artefactos acoplados a propósito**:

1. **Telar** — una librería de componentes Vue 3 + un Design System (tokens, primitivos, componentes, patrones) versionada y publicable.
2. **Tejido** — una aplicación de referencia (panel de administración/analytics) construida **enteramente** sobre el DS. No es una demo de juguete: es la prueba de que el DS resuelve flujos reales (auth, tablas con datos, formularios complejos, modales, estados de carga y error, dark mode, navegación accesible).

La app existe para una razón concreta: un Design System sin un consumidor real es un catálogo de Storybook que nadie estresó. La app es el banco de pruebas que obliga al DS a ser correcto.

### 1.2 Objetivos (qué consideramos éxito)

- **Reusabilidad demostrable:** cada pantalla de la app se compone de componentes del DS; cero CSS ad-hoc fuera de la capa de DS salvo layout de página.
- **Accesibilidad real:** WCAG 2.1 AA verificable, navegable 100% por teclado, sin violaciones críticas en axe.
- **Testing como parte del desarrollo, no una fase posterior:** un componente no se considera "hecho" sin sus tests.
- **Performance presupuestada, no asumida:** budgets explícitos y medidos en CI.
- **Mantenibilidad:** un desarrollador nuevo agrega un componente siguiendo un patrón documentado, sin leer todo el código.

### 1.3 Fuera de alcance (scope boundaries)

- Backend propio: la app consume APIs REST mockeadas (MSW) o un backend de terceros existente. El foco es frontend.
- SSR/SSG: la app es una SPA. Se documenta cómo se migraría a Nuxt si el negocio lo pidiera, pero no se implementa (ver §11, Riesgos/Roadmap).
- i18n completo: se deja la arquitectura lista (claves, no strings hardcodeados), pero se entrega un solo idioma.

---

## 2. Drivers de arquitectura y atributos de calidad

Toda arquitectura es una respuesta a prioridades. Estas son las nuestras, ordenadas. Cuando dos atributos chocan, gana el de más arriba.

| #   | Atributo de calidad               | Por qué prioriza                                                               | Cómo se mide                                                                   |
| --- | --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 1   | **Mantenibilidad / Reusabilidad** | Es la razón de existir de un DS                                                | % de UI cubierta por componentes del DS; tiempo de alta de un componente nuevo |
| 2   | **Accesibilidad**                 | Requisito no negociable de calidad de producto                                 | 0 violaciones críticas axe; navegación teclado E2E                             |
| 3   | **Testabilidad**                  | Sin tests confiables el DS no se puede evolucionar sin miedo                   | Cobertura de líneas/branches; ratio de tests por componente                    |
| 4   | **Performance**                   | UX percibida y SEO; barato si se cuida desde el día 1, carísimo de retrofitear | Core Web Vitals; bundle budget                                                 |
| 5   | **Consistencia visual**           | Es el output observable del DS                                                 | Visual regression diffs                                                        |
| 6   | **DX (Developer Experience)**     | Un DS que cuesta usar, no se usa                                               | Tiempo a "primer componente renderizado"; calidad de tipos                     |

**Decisión consciente:** _no_ optimizamos prematuramente para escala extrema de runtime (millones de nodos). La app de referencia es un panel, no un canvas de trading. Donde sí invertimos es en escala de _equipo_ (que muchos devs puedan trabajar sin pisarse).

---

## 3. Restricciones y supuestos

**Restricciones**

- Stack obligado por contexto: Vue 3 (Composition API), TypeScript estricto, Pinia, Vite.
- Testing: Vitest (unit/component) y Cypress (E2E), por requerimiento.
- El DS debe ser consumible por la app vía import normal (workspace), y publicable a un registry privado si se extrae.

**Supuestos**

- El equipo conoce Vue 3 y Composition API; no se documentan fundamentos del framework.
- Las APIs de negocio son REST/JSON; si fueran GraphQL, la capa de datos cambia pero el DS no.
- CI corre en GitHub Actions (intercambiable; los pasos son agnósticos).

---

## 4. Vista general de la arquitectura

### 4.1 Estructura: monorepo con workspaces

Un solo repositorio, dos paquetes, límites claros. El DS no sabe que la app existe; la app depende del DS por su API pública, no por rutas internas.

```
telar/
├─ packages/
│  ├─ ds/                      # Telar (librería publicable)
│  │  ├─ src/
│  │  │  ├─ tokens/            # design tokens (fuente de verdad)
│  │  │  ├─ primitives/        # Box, Stack, Text, Icon
│  │  │  ├─ components/        # Button, Input, Modal, Table, Toast...
│  │  │  ├─ composables/       # useDisclosure, useFocusTrap, useId...
│  │  │  ├─ directives/        # v-focus-trap, v-click-outside
│  │  │  └─ index.ts           # API pública explícita (barrel controlado)
│  │  ├─ stories/              # Storybook
│  │  └─ vite.config.ts        # build en modo library
│  └─ app/                     # Tejido (consumidor de referencia)
│     ├─ src/
│     │  ├─ pages/             # vistas (layout + composición de DS)
│     │  ├─ features/          # lógica de dominio por feature
│     │  ├─ stores/            # Pinia (estado de aplicación)
│     │  ├─ services/          # clientes HTTP, adapters
│     │  ├─ router/
│     │  └─ app.vue
│     └─ cypress/              # E2E
├─ .github/workflows/          # CI/CD
├─ package.json                # workspaces
└─ SAD.md
```

**Regla de dependencia (importante):** `app → ds` está permitido; `ds → app` está **prohibido** y se valida con un lint rule (`no-restricted-imports`). Romper esta regla es la primera forma en que un DS muere: empieza a conocer su consumidor.

### 4.2 Las capas del Design System

El DS no es "una carpeta de componentes". Es una jerarquía con responsabilidades distintas. Esta separación es lo que permite cambiar la marca sin tocar componentes, y cambiar un componente sin romper pantallas. Una decisión central (ADR-008) atraviesa todo: el **comportamiento accesible no se reinventa**, se hereda de una capa headless (Reka UI), y Telar pone los hilos (tokens) y la tela (estilos) encima.

```
┌──────────────────────────────────────────────────────────┐
│  5. PATTERNS   (PageHeader, DataTable, Form)               │  composición opinada
├──────────────────────────────────────────────────────────┤
│  4. COMPONENTS (Button, Input, Modal, Tabs)               │  skin + tokens sobre el headless
├──────────────────────────────────────────────────────────┤
│  3. HEADLESS BEHAVIOR (Reka UI)                           │  foco, ARIA, teclado — ya accesible
├──────────────────────────────────────────────────────────┤
│  2. PRIMITIVES (Box, Stack, Text, Icon)                   │  layout/tipografía sin marca
├──────────────────────────────────────────────────────────┤
│  1. TOKENS  primitive → semantic → component (3 niveles)  │  fuente de verdad, sin lógica
└──────────────────────────────────────────────────────────┘
```

- **Tokens (tres niveles, ADR-009):** `primitive` (`blue-500`) → `semantic/alias` (`color-action`) → `component` (`button-bg`). Los componentes consumen **solo** semánticos y de componente, nunca un primitivo ni un hex. Un rebrand toca el nivel semántico y no 200 componentes. Se generan con un pipeline (Style Dictionary) a CSS custom properties + tipos TS. El theming —incluido dark mode— es reasignar el nivel semántico.
- **Primitives:** layout y tipografía sin opinión de marca. Permiten construir patrones sin reinventar flex/grid.
- **Headless behavior (Reka UI, ADR-008):** la maquinaria accesible —focus trap, roving tabindex, ARIA, teclado, posicionamiento— vive aquí, ya resuelta y testeada. Telar no la reescribe; la consume.
- **Components:** ponen tokens y CSS sobre el comportamiento headless. La complejidad de a11y que antes vivía aquí (un `Modal` correcto = focus trap + escape + restore focus + scroll lock + aria) ahora es responsabilidad de la capa 3; el componente solo lo _estiliza_.
- **Patterns:** composiciones recurrentes y opinadas (un `DataTable` con sorting/paginación/empty/error). La _lógica_ de tabla y formularios tampoco se reinventa: viene headless (TanStack Table, vee-validate+Zod — ADR-010).

---

## 5. Decisiones de arquitectura (ADRs)

### ADR-001 — Composition API + `<script setup>` como estándar

**Contexto:** Vue 3 ofrece Options y Composition API.
**Decisión:** Composition API con `<script setup lang="ts">` en todo el código nuevo.
**Razón:** mejor inferencia de tipos, lógica reutilizable vía composables, y co-locación de estado/efectos. La Options API dispersa la lógica de una feature en varias opciones.
**Trade-off:** curva para quien viene de Vue 2; se mitiga con convenciones documentadas.

### ADR-002 — Design tokens tipados como fuente de verdad _(refinada por ADR-009)_

**Contexto:** los tokens podrían vivir solo en CSS, en JSON, o en TS.
**Decisión:** los tokens son la fuente de verdad tipada y generan las CSS custom properties.
**Razón:** un token mal escrito falla en compile-time, no en runtime; el autocompletado guía al dev; y el theming en runtime sigue siendo posible vía variables CSS.
**Trade-off:** un paso de build extra para generar el CSS. Aceptable.
**Estado:** refinada por **ADR-009**, que define el pipeline (Style Dictionary) y la arquitectura de tres niveles.

### ADR-003 — Theming vía CSS custom properties, no por build

**Contexto:** dark/light y marcas alternativas.
**Decisión:** un único bundle; el tema se cambia con un atributo `data-theme` en `<html>` que reescribe variables CSS.
**Razón:** cero re-build por tema, cero flash, cambio en runtime, y testeable. Generar un CSS por tema multiplica el bundle y el pipeline.
**Trade-off:** todos los colores deben pasar por variables (disciplina), validado por lint.

### ADR-004 — Pinia para estado de aplicación; el DS es stateless de negocio

**Contexto:** ¿dónde vive el estado?
**Decisión:** Pinia vive en la **app**. El DS no tiene stores; su estado es local al componente o entra por props.
**Razón:** un DS con estado global es un DS que impone arquitectura al consumidor. Mantenerlo "tonto" lo hace portable. Pinia se elige sobre Vuex por su API plana, tipado nativo y menos boilerplate.
**Trade-off:** ninguno relevante para este alcance.

### ADR-005 — Estilos con CSS scoped + tokens, sin framework de utilidades

**Contexto:** Tailwind vs CSS Modules vs scoped SFC.
**Decisión:** CSS `scoped` dentro de cada SFC, consumiendo tokens.
**Razón:** un DS debe ser dueño de su CSS y publicar estilos encapsulados; acoplarlo a Tailwind obliga al consumidor a adoptar Tailwind. El scoped de Vue da aislamiento sin esa dependencia.
**Trade-off:** se escribe más CSS a mano; se compensa con primitives de layout.
**Relación:** **ADR-008** (Reka UI) es coherente con esta decisión: aporta _comportamiento_ headless, no estilos, así que Telar sigue siendo dueño de su CSS.

### ADR-006 — MSW para datos en desarrollo y tests

**Contexto:** la app necesita datos sin acoplarse a un backend.
**Decisión:** Mock Service Worker intercepta a nivel de red.
**Razón:** los mismos mocks sirven en dev, en Vitest y en Cypress; se testea el cliente HTTP real, no un stub falso.
**Trade-off:** mantener fixtures realistas. Vale la pena.

### ADR-007 — Versionado SemVer + Changesets

**Contexto:** el DS evoluciona y la app (y futuros consumidores) dependen de él.
**Decisión:** SemVer estricto gestionado con Changesets; cambios breaking → major, con nota de migración.
**Razón:** un DS sin contrato de versionado rompe a sus consumidores en silencio. Esto es lo que separa un DS de producción de un experimento.
**Trade-off:** disciplina en cada PR. Es el precio de no romper a nadie.

### ADR-008 — Comportamiento accesible sobre primitivos headless (Reka UI), no a mano

**Contexto:** la maquinaria de accesibilidad de widgets compuestos (focus trap, roving tabindex, ARIA, navegación por teclado, posicionamiento de overlays) es donde _todos_ los DS fallan, y reescribirla por componente cuesta semanas de bugs sutiles.
**Decisión:** construir los componentes interactivos (Modal, Dropdown, Tabs, Tooltip, Combobox, etc.) sobre **Reka UI** (primitivos headless, sin estilo, accesibles y testeados). Telar aporta tokens y CSS; Reka aporta el comportamiento.
**Razón:** convierte el área de mayor riesgo del proyecto en _skinning_. Mejor accesibilidad real con menos código propio y mantenible por terceros especializados.
**Trade-off:** Reka UI se vuelve una _peer dependency_ que el consumidor hereda. Es un costo real, pero al ser headless (cero estilos) respeta la portabilidad del ADR-005, a diferencia de adoptar un framework de utilidades. Mitigación: encapsular Reka detrás de la API pública de Telar para poder sustituirlo sin romper consumidores.

### ADR-009 — Tokens en tres niveles, generados con un pipeline (Style Dictionary)

**Contexto:** un set de tokens plano genera _drift_ (riesgo §11) y hace que un rebrand toque cientos de componentes.
**Decisión:** arquitectura de tres niveles — `primitive` (`blue-500`) → `semantic/alias` (`color-action`, `color-danger`) → `component` (`button-bg`). Los componentes consumen solo semánticos y de componente. El source se transforma con **Style Dictionary** a CSS custom properties + tipos TS desde una única fuente.
**Razón:** desacopla la paleta de su uso; un rebrand o un tema nuevo toca el nivel semántico y nada más. El pipeline elimina el drift entre "lo definido" y "lo usado".
**Trade-off:** más ceremonia inicial de tokens y un paso de build. Se paga una vez y rinde en cada cambio de marca o tema. Refina **ADR-002**.

### ADR-010 — Lógica headless para tablas y formularios (TanStack Table, vee-validate + Zod)

**Contexto:** un `DataTable` (sorting, paginación, filtrado, agrupación) y un sistema de formularios (validación sync/async, errores accesibles) son _mini-proyectos_ completos; reinventarlos es donde el cronograma se hunde.
**Decisión:** usar **TanStack Table** (headless) para la lógica de tabla y **vee-validate + Zod** para formularios. El schema de Zod es a la vez fuente de validación y de tipos.
**Razón:** lógica probada, sin imponer markup; Telar renderiza con sus propios componentes. Zod unifica validación y tipado, eliminando una fuente clásica de bugs (tipos y reglas que se desincronizan).
**Trade-off:** dos dependencias más de lógica (no de UI). Aceptable: son headless y de bajo riesgo de lock-in.

### ADR-011 — Cascada predecible con CSS `@layer` y estilos base con `:where()`

**Contexto:** cuando la app sobreescribe al DS, el orden de cascada y la especificidad provocan guerras de `!important`.
**Decisión:** definir capas explícitas (`@layer reset, ds, app`) y escribir los estilos base de Telar con `:where()` (especificidad cero).
**Razón:** la app siempre puede overridear al DS de forma trivial y predecible, sin hacks. Resuelve de raíz la fricción de scoped + override del ADR-005.
**Trade-off:** requiere disciplina al declarar capas; soporte de navegadores ya es universal.

### ADR-012 — Reactividad superficial y virtualización para datos grandes

**Contexto:** la reactividad profunda de Vue proxifica recursivamente; con miles de filas se paga en jank.
**Decisión:** para datasets grandes usar `shallowRef`/`markRaw`, y virtualizar listas/tablas largas con **TanStack Virtual** (renderizar solo lo visible).
**Razón:** elimina el costo de proxificar datos que no necesitan reactividad profunda y acota el DOM a lo visible.
**Trade-off:** la virtualización complica la accesibilidad (filas no presentes en el DOM) y el testing E2E; por eso se aplica **solo** donde el volumen lo justifica, no por defecto (evitar optimización prematura).

---

## 6. Estrategia de estado y datos (en la app)

Flujo unidireccional y capas con una sola responsabilidad cada una:

```
UI (DS components)
   │ eventos / props
   ▼
Pages / Features  ──►  Pinia stores  ──►  Services (HTTP)  ──►  MSW / API real
   ▲                        │
   └──────── estado ────────┘
```

- **Services:** única capa que conoce URLs, headers y forma del payload. Devuelve tipos de dominio, no DTOs crudos (mapeo en un adapter). Si el backend cambia un campo, se toca un solo archivo.
- **Stores (Pinia):** estado de aplicación, derivaciones (getters) y acciones async. No contienen lógica de presentación.
- **Pages/Features:** orquestan; componen DS + consumen stores. No hacen `fetch` directo.
- **DS components:** presentación y comportamiento de UI. No conocen stores ni HTTP.

Esta separación es lo que permite testear cada capa de forma aislada y barata (§7).

---

## 7. Estrategia de testing

Principio rector: **el test se escribe con el código, no después.** El pipeline rechaza PRs que bajan la cobertura o agregan violaciones de a11y. La pirámide, de abajo hacia arriba:

| Nivel             | Herramienta                       | Qué cubre                                | Dónde          |
| ----------------- | --------------------------------- | ---------------------------------------- | -------------- |
| Unit              | Vitest                            | composables, utils, adapters, tokens     | ambos paquetes |
| Component         | Vitest + Testing Library          | render, props, eventos, estados, ARIA    | DS             |
| Accesibilidad     | vitest-axe / cypress-axe          | violaciones WCAG automatizables          | DS + app       |
| Visual regression | Storybook test-runner / Chromatic | diffs visuales por componente            | DS             |
| E2E               | Cypress                           | flujos críticos de usuario punta a punta | app            |

**Reglas de oro**

- Se testea **comportamiento observable**, no implementación. Testing Library obliga a consultar por rol/label accesible, lo que de paso valida accesibilidad.
- Cada componente del DS entrega: render por defecto, cada variante/estado, interacción por teclado, y un check de axe.
- E2E cubre los _caminos que duelen en producción_: login, crear/editar en un formulario complejo, tabla con filtro+orden+paginación, manejo de error de red. No se busca cobertura E2E total (lenta y frágil), sino los flujos de mayor valor.
- A11y no es opcional: una violación crítica de axe rompe el build.

**Definición de "Done" de un componente**

1. Implementado con tipos estrictos y tokens (sin hex/px mágicos).
2. Story en Storybook con todas sus variantes y estados (loading/empty/error/disabled).
3. Tests unitarios/componente + check de axe en verde.
4. Navegable por teclado y con ARIA correcto.
5. Documentado (props, eventos, slots, ejemplo de uso).

---

## 8. Accesibilidad (transversal)

Tratada como atributo de primera clase, no como auditoría final.

- **Objetivo:** WCAG 2.1 AA.
- **Teclado:** todo flujo operable sin mouse; orden de foco lógico; foco visible siempre.
- **Foco gestionado:** modales/drawers con focus trap (`useFocusTrap`) y restauración del foco al cerrar.
- **Semántica:** roles y `aria-*` correctos; ids generados con `useId` para asociar labels/descripciones sin colisión.
- **Contraste:** garantizado a nivel de tokens (la paleta se diseña para cumplir AA); validado en CI.
- **Movimiento:** se respeta `prefers-reduced-motion`.
- **Validación:** automatizada (axe en unit + E2E) y manual con lector de pantalla para los componentes complejos.

---

## 9. Performance (presupuestada, no asumida)

Budgets explícitos, medidos en CI. Si un PR los excede, falla.

| Métrica                        | Budget                                        |
| ------------------------------ | --------------------------------------------- |
| LCP (app, P75)                 | < 2.5 s                                       |
| CLS                            | < 0.1                                         |
| INP                            | < 200 ms                                      |
| JS inicial (app, gzip)         | < 180 KB                                      |
| Bundle del DS (tree-shakeable) | importable por componente, sin arrastrar todo |

**Tácticas**

- **Tree-shaking real:** API pública con exports nombrados; `sideEffects` declarado (ojo: el CSS importado cuenta como side effect — declararlo explícitamente para no romper el shaking); sin barrels que impidan eliminar código muerto.
- **Code splitting** por ruta (lazy routes) y carga diferida de componentes pesados (ej. tablas con virtualización, charts).
- **Reactividad acotada (ADR-012):** `shallowRef`/`markRaw` para datasets grandes y virtualización (TanStack Virtual) en listas/tablas largas. Solo donde el volumen lo justifica.
- **Container queries:** los componentes responden al tamaño de su contenedor, no del viewport. Una `Card` se adapta esté en un sidebar angosto o en un grid ancho, sin props de tamaño impuestas al consumidor.
- **Anti-FOUC:** un script inline mínimo en `<head>` setea `data-theme` antes del primer paint (lee localStorage o `prefers-color-scheme`), eliminando el flash de tema.
- **Imágenes/íconos:** íconos como componentes SVG tree-shakeables, no un sprite gigante.
- **Medición continua:** Lighthouse CI sobre la app en cada PR; reporte de tamaño de bundle (`size-limit`) como check de estado.

---

## 10. Build, CI/CD y observabilidad

### 10.1 Pipeline (cada PR)

```
install → typecheck → lint → unit+component (Vitest) → build DS → build app
        → Storybook build + visual regression → E2E (Cypress) → Lighthouse CI
        → size report → (en main) Changesets version + publish
```

Ningún paso es saltable. El orden pone lo barato y rápido primero (typecheck/lint) para fallar temprano. El monorepo corre con **caché de tareas afectadas** (Turborepo): un PR solo rebuildea/testea los paquetes que tocó, lo que mantiene el pipeline en minutos y no en cuartos de hora. Las _stories_ de Storybook se reutilizan como tests de interacción (story-as-test): un solo artefacto sirve como documentación, test y base de visual regression.

### 10.2 Estrategia de branching

Trunk-based con PRs cortas, feature flags para lo incompleto, y `main` siempre desplegable. Releases del DS por Changesets; la app despliega desde `main`.

### 10.3 Observabilidad en producción (app)

Un frontend sin telemetría es una caja negra el día que algo se rompe.

- **Errores:** captura global (Sentry o equivalente) con source maps subidos en el build.
- **Web Vitals reales:** RUM enviando LCP/CLS/INP del usuario real, no solo lab.
- **Trazabilidad:** versión del DS y de la app embebidas en cada evento, para correlacionar regresiones con releases.

---

## 11. Riesgos y mitigaciones

| Riesgo                                                                           | Impacto    | Mitigación                                                                                                  |
| -------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| El DS se acopla a la app y deja de ser reutilizable                              | Alto       | Regla de dependencia validada por lint (ADR-001/§4.1); revisión en PR                                       |
| "Componente nuevo" sin tests/a11y por presión de tiempo                          | Alto       | DoD bloqueante en CI; no hay merge sin verde                                                                |
| Drift entre tokens y diseño                                                      | Medio      | Tokens en tres niveles generados por pipeline (ADR-009); Storybook como contrato visual                     |
| Tests E2E frágiles que el equipo empieza a ignorar                               | Medio      | Selección por roles/labels accesibles, no por CSS; cubrir solo flujos críticos                              |
| Crecimiento del bundle sin que nadie lo note                                     | Medio      | Size budgets que rompen el build                                                                            |
| Dependencia de Reka UI como peer dependency (lock-in, breaking changes upstream) | Medio      | Encapsular Reka detrás de la API pública de Telar (ADR-008); fijar versión y validar upgrades en CI         |
| Virtualización rompe accesibilidad/E2E de filas no renderizadas                  | Medio      | Aplicarla solo donde el volumen lo exige (ADR-012); tests específicos de teclado/lector en esos componentes |
| Necesidad futura de SSR/SEO                                                      | Bajo (hoy) | Capas separadas; migración a Nuxt documentada como evolución, no rewrite                                    |

---

## 12. Roadmap por fases

**Fase 0 — Cimientos (semana 1).** Monorepo + Turborepo, Vite x2, TS estricto, lint/format (incluida la regla de dependencia `ds ✗→ app`), CI esqueleto. **Fundación que se decide antes de codear (ADR-008/009/010):** pipeline de tokens en tres niveles con Style Dictionary + theming dark/light, integración de Reka UI como capa de comportamiento, y elección de TanStack Table / vee-validate+Zod para lógica. Primitives (Box/Stack/Text/Icon).

**Fase 1 — Núcleo del DS (semanas 2–3).** Button, Input, Select, Checkbox/Radio, Modal, Toast, Tabs, con tests + a11y + stories. Aquí se valida el patrón de "alta de componente".

**Fase 2 — Patrones + app (semanas 3–4).** DataTable, Form (validación), PageHeader; Tejido: login, listado con tabla, formulario de detalle, manejo de error/empty/loading. MSW conectado.

**Fase 3 — Endurecimiento (semana 5).** E2E de flujos críticos, Lighthouse CI, visual regression, observabilidad, documentación, primer release versionado del DS.

Cada fase termina con algo demostrable y testeado. No hay una fase "de testing al final": el testing está en todas.

---

## 13. Glosario rápido

- **DS:** Design System.
- **Token:** valor de diseño atómico (color, espaciado) como fuente de verdad.
- **ADR:** Architecture Decision Record.
- **DoD:** Definition of Done.
- **RUM:** Real User Monitoring.
- **MSW:** Mock Service Worker.
- **Headless:** componente/lógica que aporta comportamiento y accesibilidad sin imponer estilos ni markup (ej. Reka UI, TanStack Table).
- **FOUC:** Flash of Unstyled/Untyped Content — destello de tema incorrecto antes del primer paint.

---

## 14. Historial de revisiones

| Versión | Fecha      | Cambios                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0.0   | 2026-06-18 | Baseline. Arquitectura, ADR-001…007, vistas, testing, performance, riesgos, roadmap.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.1.0   | 2026-06-18 | Nombre del proyecto definido (Telar / Tejido). Nuevas decisiones de fundación: ADR-008 (Reka UI headless), ADR-009 (tokens en tres niveles + Style Dictionary, refina ADR-002), ADR-010 (TanStack Table + vee-validate/Zod), ADR-011 (CSS @layer + `:where()`), ADR-012 (shallowRef + virtualización). Capa headless agregada al modelo de capas (§4.2). Tácticas de performance ampliadas (container queries, anti-FOUC). CI con caché de tareas afectadas (Turborepo) y story-as-test. Riesgos de dependencia (Reka) y virtualización añadidos. |

---

_Fin del documento. Este SAD es un artefacto vivo: cada decisión relevante futura se agrega como un nuevo ADR con su contexto y trade-offs. Una arquitectura no se documenta una vez; se mantiene._
