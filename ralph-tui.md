# Ralph TUI - Documentación Completa y Análisis

## 1. Overview

**Ralph TUI** es un **AI Agent Loop Orchestrator** - una interfaz de terminal para ejecutar agentes de IA de codificación de forma autónoma a través de gestión inteligente de tareas.

### Ciclo Principal de 5 Pasos

```
1. TASK SELECTION    → Selecciona la tarea de mayor prioridad no bloqueada
2. PROMPT BUILDING   → Construye prompts con Handlebars templates + contexto
3. AGENT EXECUTION   → Spawns del agente configurado (Claude, OpenCode, Droid)
4. COMPLETION DETECT → Monitorea token `<promise>COMPLETE</promise>`
5. NEXT ITERATION    → Marca completo y repite hasta terminar
```

### Estadísticas del Proyecto

| Dato | Valor |
|------|-------|
| Versión Actual | v0.1.7 (15 Enero 2026) |
| Repositorio | https://github.com/subsy/ralph-tui |
| Documentación | https://ralph-tui.com |
| Lenguajes | TypeScript (90.5%), MDX (8.6%) |
| Runtime | Bun >= 1.0.0 |
| Licencia | MIT |
| Stars | 815 | Forks | 83 |

---

## 2. Instalación

### Prerequisitos

```bash
# Instalar Bun (requerido)
curl -fsSL https://bun.sh/install | bash

# Al menos un agente de IA:
npm install -g @anthropic-ai/claude-code  # Claude Code
# o
curl -fsSL https://opencode.ai/install | bash  # OpenCode
```

### Métodos de Instalación

```bash
# Recomendado (Bun)
bun install -g ralph-tui

# Alternativas
npm install -g ralph-tui
pnpm add -g ralph-tui
bunx ralph-tui [command]  # Sin instalación global
```

### Verificación

```bash
ralph-tui --version
ralph-tui plugins agents    # Lista agentes detectados
ralph-tui plugins trackers  # Lista trackers detectados
ralph-tui config show       # Muestra configuración
```

---

## 3. Quick Start (4 Pasos)

### Paso 1: Inicializar Proyecto

```bash
cd your-project
ralph-tui setup  # o ralph-tui init
```

El wizard:
- Detecta agentes instalados (Claude, OpenCode, Droid)
- Crea `.ralph-tui/config.toml`
- Instala 3 skills bundled:
  - `ralph-tui-prd` - Creación de PRD con IA
  - `ralph-tui-create-json` - Convierte PRD a prd.json
  - `ralph-tui-create-beads` - Convierte PRD a Beads issues

### Paso 2: Crear PRD

```bash
ralph-tui create-prd --chat
```

Workflow interactivo guía por:
1. **Feature Goal** - Problema y objetivos
2. **Target Users** - Persona y necesidades
3. **Scope Definition** - Inclusiones/exclusiones
4. **User Stories** - Tareas discretas implementables
5. **Quality Gates** - Comandos que deben pasar (npm test, etc.)
6. **Task Creation** - Formato de salida

### Paso 3: Convertir PRD a Tasks

```bash
ralph-tui convert ./tasks/prd-my-feature.md --output ./prd.json
```

### Paso 4: Ejecutar Autónomamente

```bash
ralph-tui run --prd ./prd.json
```

---

## 4. Comandos CLI

### `ralph-tui run` - Ejecución Autónoma

```bash
ralph-tui run [options]

# Opciones de fuente de tasks
--prd <path>           # Archivo PRD (auto-switch a json tracker)
--epic <id>            # Epic ID para Beads tracker

# Agente y modelo
--agent <name>         # Override agente (claude, opencode, droid)
--model <name>         # Override modelo (sonnet, opus, haiku, o provider/model)
--tracker <name>       # Override tracker (json, beads, beads-bv)

# Parámetros de ejecución
--iterations <n>       # Max iteraciones (0 = unlimited)
--delay <ms>           # Milisegundos entre iteraciones

# Output y estado
--prompt <path>        # Custom Handlebars template
--output-dir <path>    # Directorio para logs (default: .ralph-tui/iterations)
--progress-file <path> # Archivo de progreso (default: .ralph-tui/progress.md)

# Modos de display
--headless             # Sin TUI (para CI/CD)
--no-setup             # Skip setup interactivo
```

**Ejemplos:**

```bash
# Básico con JSON tracker
ralph-tui run --prd ./prd.json

# Con Beads tracker
ralph-tui run --epic my-epic --tracker beads-bv

# Override a Claude Opus
ralph-tui run --prd ./prd.json --agent claude --model opus

# OpenCode con GPT-4
ralph-tui run --prd ./prd.json --agent opencode --model openai/gpt-4o

# CI/CD (headless)
ralph-tui run --prd ./prd.json --headless --iterations 20
```

### `ralph-tui resume` - Continuar Sesión

```bash
ralph-tui resume [options]

--cwd <path>    # Working directory con session file
--headless      # Sin TUI
--force         # Override stale locks
```

**Recuperación automática:**
- Preserva iteration count
- Restaura task completion statuses
- Mantiene progress file context
- Revierte tasks "in_progress" a "open"

### `ralph-tui status` - Estado de Sesión

```bash
ralph-tui status [options]

--json          # Output machine-readable
--cwd <path>    # Working directory
```

**Valores de status:**
| Status | Significado |
|--------|-------------|
| `active` | Sesión corriendo o pausada |
| `completed` | Todas las tasks terminadas |
| `no_session` | Session file no encontrado |
| `stale` | Sesión aparentemente abandonada |

### `ralph-tui logs` - Ver Logs

```bash
ralph-tui logs [options]

# Viewing
--iteration <n>    # Iteración específica
--task <id>        # Filtrar por task
--verbose          # Output completo sin truncar

# Cleanup
--clean            # Remover logs viejos
--keep <n>         # Retener N logs recientes
--dry-run          # Preview antes de borrar
```

### Otros Comandos

```bash
ralph-tui setup           # Setup interactivo
ralph-tui create-prd      # Crear PRD interactivamente
ralph-tui convert <file>  # Convertir PRD markdown a JSON
ralph-tui config show     # Mostrar configuración
ralph-tui template show   # Mostrar template actual
ralph-tui template init   # Copiar template default para customizar
ralph-tui plugins agents  # Listar agentes
ralph-tui plugins trackers # Listar trackers
ralph-tui docs [section]  # Abrir docs en browser
ralph-tui help            # Ayuda
```

---

## 5. Sistema de Configuración

### Jerarquía de Capas (Prioridad)

1. **CLI Flags** (Mayor prioridad) - Opciones de línea de comandos
2. **Project Config** (`.ralph-tui/config.toml`) - Configuración por proyecto
3. **Global Config** (`~/.config/ralph-tui/config.toml`) - Defaults del usuario

### Configuración Completa

```toml
# Core Settings
agent = "claude"              # Agente por defecto
tracker = "json"              # Tracker por defecto
maxIterations = 0             # 0 = unlimited
iterationDelay = 0            # Milisegundos entre iteraciones
outputDir = ".ralph-tui/iterations"
progressFile = ".ralph-tui/progress.md"
autoCommit = false            # Auto-commit después de tasks completas
subagentTracingDetail = "full"  # off, minimal, moderate, full

# Plugin Configuration
[agentOptions]
model = "sonnet"              # sonnet, opus, haiku

[trackerOptions]
path = "./prd.json"           # Para JSON tracker

# Error Handling
[errorHandling]
strategy = "skip"             # "retry", "skip", o "abort"
maxRetries = 3
retryDelayMs = 5000
continueOnNonZeroExit = false

# Rate Limiting
fallbackAgents = ["opencode"]

[rateLimitHandling]
enabled = true
maxRetries = 3
baseBackoffMs = 5000
recoverPrimaryBetweenIterations = true

# Notifications
[notifications]
enabled = true
sound = "off"                 # "off", "system", o "ralph"
```

---

## 6. Agentes

### Claude Code (Default)

```toml
agent = "claude"

[agentOptions]
model = "sonnet"           # sonnet, opus, haiku
printMode = "text"         # text, json, stream
timeout = 0                # 0 = no timeout
command = "claude"         # Path al CLI
```

**Modelos:**
- **sonnet** - Balance performance/costo (default)
- **opus** - Más capaz, mayor costo (razonamiento complejo)
- **haiku** - Más rápido, menor costo (tasks simples)

**Features exclusivos:**
- Subagent tracing en tiempo real
- Visualización de tool calls anidados
- Operación autónoma con `--dangerously-skip-permissions`

### OpenCode

```toml
agent = "opencode"

[agentOptions]
provider = "anthropic"
model = "claude-3-5-sonnet"
agent = "general"          # general, build, plan
format = "default"
timeout = 0
command = "opencode"
```

**Proveedores soportados:**
| Provider | Modelos |
|----------|---------|
| Anthropic | claude-3-5-sonnet, claude-3-opus |
| OpenAI | gpt-4o, gpt-4-turbo |
| Google | gemini-pro, gemini-1.5-pro |
| xAI | grok-1 |
| Ollama (Local) | llama3, codellama |

### Factory Droid

```bash
ralph-tui run --prd ./prd.json --agent droid
```

Nueva integración en v0.1.7 con JSONL tracing.

---

## 7. Task Trackers

### JSON Tracker (Más Simple)

```toml
tracker = "json"

[trackerOptions]
path = "./prd.json"
```

**Schema:**

```json
{
  "name": "Project Name",
  "description": "...",
  "branchName": "feature/my-branch",
  "userStories": [
    {
      "id": "US-001",
      "title": "Story Title",
      "description": "Extended explanation",
      "acceptanceCriteria": ["Criterion 1", "npm test passes"],
      "priority": 1,
      "passes": false,
      "labels": ["frontend", "auth"],
      "dependsOn": [],
      "notes": "Additional context"
    }
  ]
}
```

**Algoritmo de selección:**
1. Filtra tasks incompletas (`passes: false`)
2. Excluye tasks con dependencias no resueltas
3. Ordena por prioridad (números menores primero)
4. Selecciona la primera elegible

### Beads Tracker (Git-Backed)

```toml
tracker = "beads"

[trackerOptions]
beadsDir = ".beads"
epicId = "my-epic-id"
labels = "ralph"
workingDir = "."
```

**Ventajas:**
- Sincronización Git
- Jerarquías de epic
- Colaboración en equipo
- Auto-sync de cambios

### Beads-BV Tracker (Graph-Optimized)

```toml
tracker = "beads-bv"

[trackerOptions]
beadsDir = ".beads"
epicId = "my-epic-id"
labels = "ralph"
```

**Algoritmos de scoring:**
1. **PageRank** - Importancia en grafo de dependencias
2. **Betweenness** - Frecuencia en caminos críticos
3. **Blocker Ratio** - Tasks downstream desbloqueadas
4. **Staleness** - Duración task abierta
5. **Priority Boost** - Peso de prioridad original

---

## 8. Controles de Teclado (TUI)

| Tecla | Función |
|-------|---------|
| `s` | Start execution |
| `p` | Pause/Resume |
| `+` o `=` | Añadir 10 iteraciones |
| `-` o `_` | Quitar 10 iteraciones |
| `d` | Toggle dashboard view |
| `i` | Toggle history/iteration list |
| `t` | Cycle subagent tracing levels |
| `T` | Toggle subagent tree panel |
| `u` | Toggle tracing panel |
| `q` | Quit Ralph TUI |
| `?` | Show help/shortcuts |

---

## 9. Session Management

### Archivos de Sesión

```
.ralph-tui/
├── session.json      # Estado de sesión
├── progress.md       # Log de progreso
├── tasks.json        # Estado de tasks (si se usa)
├── ralph.lock        # Lock de concurrencia
├── config.toml       # Configuración
├── prompt.hbs        # Template de prompts
└── iterations/       # Logs de cada iteración
    ├── iteration-001-US-001.log
    ├── iteration-002-US-002.log
    └── ...
```

### Recuperación de Sesiones

```bash
# Sesión interrumpida
Ctrl+C

# Reanudar después
ralph-tui resume

# Override stale lock si es necesario
ralph-tui resume --force
```

---

## 10. Arquitectura Interna

### Estructura del Código Fuente

```
src/
├── engine/               # Motor de ejecución principal
│   ├── index.ts         # ExecutionEngine, runLoop()
│   ├── rate-limit-detector.ts
│   └── types.ts
├── plugins/
│   ├── agents/          # Plugins de agentes
│   │   ├── base.ts      # BaseAgentPlugin (abstracto)
│   │   ├── builtin/     # claude.ts, opencode.ts
│   │   ├── droid/       # Droid agent
│   │   ├── tracing/     # Subagent tracing
│   │   └── registry.ts
│   └── trackers/        # Plugins de trackers
│       ├── base.ts      # BaseTracker (abstracto)
│       ├── builtin/     # JSON, Beads
│       └── registry.ts
├── templates/           # Sistema de templates
│   ├── engine.ts        # Procesador Handlebars
│   ├── builtin.ts       # Templates predefinidos
│   └── defaults/
├── session/             # Gestión de sesiones
│   ├── persistence.ts   # Almacenamiento
│   ├── lock.ts          # Control de concurrencia
│   └── types.ts
├── tui/                 # Interfaz de terminal
│   ├── components/      # 20+ componentes React
│   └── theme.ts
├── prd/                 # Generación de PRD
│   ├── wizard.ts        # Interfaz interactiva
│   ├── parser.ts
│   └── generator.ts
├── commands/            # Handlers de CLI
├── config/              # Configuración
├── logs/                # Sistema de logging
└── cli.tsx              # Entry point
```

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Runtime | Bun 1.3.6+ |
| Lenguaje | TypeScript 5.9.3 |
| UI Terminal | OpenTUI 0.1.72 |
| Componentes | React 19.2.3 |
| Templating | Handlebars 4.7.8 |
| Validación | Zod 4.3.5 |
| TOML Parser | smol-toml 1.6.0 |
| Testing | Bun test runner |

---

## 11. Best Practices

### Writing PRDs & Stories

**Keep Stories Focused:**
- Cada story debe completarse en una sesión de agente (2-3 oraciones)
- Dividir features grandes en stories separadas
- Evitar listas de acceptance criteria excesivas

**Make Criteria Testable:**
- ✓ Good: "Form displays validation errors below each invalid field"
- ✗ Bad: "Error handling works"

**Quality Gates:**
```markdown
## Quality Gates
- `npm test` — Unit and integration tests
- `npm run lint` — Code linting
- `npm run build` — Production build
- `npm run type-check` — TypeScript validation
```

### Configuration Strategy

**Development:**
```toml
agent = "claude"
maxIterations = 5           # Bajo para testing
iterationDelay = 2000       # Pausas visibles
subagentTracingDetail = "full"
```

**Production/CI:**
```toml
agent = "claude"
maxIterations = 0           # Unlimited
iterationDelay = 0
headless = true
autoCommit = true
fallbackAgents = ["opencode"]
```

### Workflow Patterns

**Iterative Refinement:**
1. Crear PRD inicial
2. Ejecutar con `--iterations 5` para testing
3. Revisar logs con `ralph-tui logs --verbose`
4. Refinar PRD basado en resultados
5. Ejecutar completo con `--iterations 0`

**CI/CD Integration:**
```bash
ralph-tui run --prd ./prd.json \
  --headless \
  --iterations 20 \
  --agent claude \
  --model opus
```

---

## 12. Issues Conocidos

| Issue | Estado | Impacto |
|-------|--------|---------|
| #97: Task ordering ignores beads dependencies | Open | CRÍTICO |
| #93: Documentation does not align | Open | ALTO |
| #91: Cannot copy text from TUI with Cmd+C | Open | MEDIO |
| #98: Add support for Codex as agent | Open | Feature |
| #88: Add task type distinction | Open | Feature |

---

## 13. Features Planeados

1. **Parallel Task Execution (#75)** - Ejecutar múltiples tasks simultáneamente
2. **Work Item Type Distinction (#95)** - Distinguir stories vs tasks
3. **Codex Agent Support (#98)** - Nuevo proveedor
4. **Parallel Execution Infrastructure (#26)** - Infraestructura para paralelismo

---

## 14. Troubleshooting

### Agent Not Found
```bash
which claude  # Verificar instalación
ralph-tui plugins agents  # Listar detectados
```

### Tasks Not Completing
- Verificar que template incluya `<promise>COMPLETE</promise>`
- Revisar acceptance criteria por ambigüedad
- Verificar timeout settings

### Session Lock Exists
```bash
ralph-tui resume --force  # Override stale lock
```

### Rate Limiting
```toml
fallbackAgents = ["opencode"]
[rateLimitHandling]
enabled = true
recoverPrimaryBetweenIterations = true
```

---

## 15. Configuración Actual de Este Proyecto

### `.ralph-tui/config.toml`

```toml
agent = "claude"
tracker = "json"
maxIterations = 0
iterationDelay = 2000
outputDir = ".ralph-tui/iterations"
autoCommit = false

[agentOptions]
model = "opus"

[errorHandling]
strategy = "skip"
maxRetries = 2
retryDelayMs = 5000

[rateLimitHandling]
enabled = true
maxRetries = 3
baseBackoffMs = 5000
```

### Hooks Configurados

| Hook | Archivo | Función |
|------|---------|---------|
| Stop | `.claude/hooks/Stop.ts` | Quality gates (typecheck, lint, tests) |
| PreToolUse | `.claude/hooks/PreToolUse.ts` | Security & conventions enforcement |
| PostToolUse | `.claude/hooks/PostToolUse.ts` | Auto-formatting & file tracking |
| UserPromptSubmit | `.claude/hooks/UserPromptSubmit.ts` | Context injection |

### Estado Actual

- **92 user stories** en **12 epics**
- **Epics 1-11**: Completados
- **Epic 12**: En progreso (3/X stories completadas)
- **46 iteraciones** ejecutadas totales

---

## 16. Gaps Identificados

### No hay code review automatizado
- El `/epic-review` skill existe pero no se ejecuta automáticamente
- No hay validación de que features funcionen end-to-end
- La app puede no correr aunque todas las stories pasen

### No hay tests generados
- Ningún test fue escrito durante el desarrollo autónomo
- Los quality gates solo verifican tests existentes, no crean nuevos
- No hay coverage enforcement

### No hay E2E testing
- No se ejecuta Playwright después de cada epic
- No hay QA automatizado que pruebe la app como usuario
- Errores de runtime no se detectan hasta revisión manual

### Hooks limitados
- `Stop.ts` solo corre quality gates existentes
- No hay validación de que la app funcione (dev server, builds)
- No hay trigger para `/epic-review` automático

---

## 17. Recomendaciones de Mejora

Ver sección de análisis detallado más adelante en este documento.
