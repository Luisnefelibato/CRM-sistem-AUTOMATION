# Análisis de Mejoras - Nexus AI Automation Builder

## Resumen Ejecutivo

El Automation Builder de Nexus AI es un constructor de workflows visualmente impresionante con UI moderna. Sin embargo, es fundamentalmente un **demo frontend** con funcionalidad limitada para producción.

---

## 1. Funcionalidades Críticas Faltantes

### 🔴 Prioridad Crítica

| Feature | Estado | Descripción |
|---------|--------|-------------|
| **Persistencia de datos** | ❌ Faltante | Recargar página = perder todo el trabajo |
| **Ejecución real** | ❌ Faltante | "Ejecutar" solo hace animación visual |
| **Flujo de datos** | ❌ Faltante | Nodos no pasan datos entre sí |
| **Validación** | ❌ Faltante | Campos requeridos no se verifican |
| **Gestión de credenciales** | ❌ Faltante | API keys en texto plano, sin vault |

### Comparación con n8n/Zapier/Make

```
NEXUS AI                          vs    N8N/ZAPIER/MAKE
─────────────────────────────────────────────────────────
❌ Sin ejecución real                   ✅ Ejecución completa
❌ Conexiones solo visuales             ✅ Flujo de datos real
❌ Sin variables/contexto               ✅ Variables dinámicas
❌ Sin autenticación OAuth              ✅ OAuth2, API Keys vault
❌ Sin retry/error handling             ✅ Retry policies
❌ Sin logs de ejecución                ✅ Historial completo
❌ Sin webhooks reales                  ✅ Webhooks en tiempo real
❌ Sin condiciones IF/ELSE              ✅ Lógica condicional
❌ Sin loops                            ✅ Iteradores y loops
❌ Sin código custom                    ✅ JavaScript/Python nodes
```

---

## 2. Features Específicas Faltantes

### A. Modelo de Ejecución y Flujo de Datos

```javascript
// ACTUAL: Solo animación visual
runFlow() {
    this.nodes.forEach((node, index) => {
        setTimeout(() => {
            node.style.boxShadow = '0 0 20px purple'; // Solo efecto visual
        }, index * 500);
    });
}

// IDEAL: Ejecución real con paso de datos
async runFlow() {
    const sortedNodes = this.topologicalSort();
    const context = {};

    for (const node of sortedNodes) {
        const inputs = this.getNodeInputs(node, context);
        const result = await this.executeNode(node, inputs);
        context[node.id] = result;
    }
}
```

### B. Sistema de Variables

```javascript
// FALTANTE: Interpolación de datos entre nodos
// Ejemplo de sintaxis que debería soportar:

"Hola {{nodes.form.data.nombre}}, tu pedido #{{nodes.webhook.orderId}} está listo"

// Mapeo de campos entre nodos:
{
    "destinatario": "{{nodes.chatgpt.response.email}}",
    "mensaje": "{{nodes.transform.output.body}}"
}
```

### C. Constructor de Condiciones (Filter Node)

```
ACTUAL:
┌─────────────────────────────┐
│ Filter                      │
│ [input de texto genérico]   │
└─────────────────────────────┘

IDEAL:
┌─────────────────────────────────────────────┐
│ Filter - Condiciones                        │
├─────────────────────────────────────────────┤
│ SI  [campo ▼] [operador ▼] [valor    ]      │
│     └─ email    └─ contiene  └─ @gmail.com  │
│                                             │
│ [+ Agregar condición]                       │
│                                             │
│ Operador: (○) AND  (●) OR                   │
│                                             │
│ Salida TRUE →  [nodo destino ▼]             │
│ Salida FALSE → [nodo destino ▼]             │
└─────────────────────────────────────────────┘
```

### D. Mapeo de Transformación (Transform Node)

```
ACTUAL:
┌─────────────────────────────┐
│ Transform                   │
│ [textarea genérico]         │
└─────────────────────────────┘

IDEAL:
┌─────────────────────────────────────────────────────────┐
│ Transform - Mapeo de Campos                             │
├─────────────────────────────────────────────────────────┤
│ Entrada (desde nodo anterior)    →    Salida            │
│ ─────────────────────────────────────────────────       │
│ [user.firstName]                 →    [nombre]          │
│ [user.lastName]                  →    [apellido]        │
│ [user.email]                     →    [correo]          │
│ [concat(firstName, lastName)]    →    [nombreCompleto]  │
│                                                         │
│ [+ Agregar mapeo]                                       │
│                                                         │
│ Preview de salida:                                      │
│ { "nombre": "Juan", "apellido": "García", ... }         │
└─────────────────────────────────────────────────────────┘
```

### E. Gestión de Errores

```javascript
// FALTANTE: Sistema de retry y manejo de errores

const errorHandling = {
    retryPolicy: {
        maxAttempts: 3,
        backoffType: 'exponential', // linear, exponential, fixed
        initialDelay: 1000,
        maxDelay: 30000
    },
    onError: {
        action: 'route_to_node', // stop, continue, route_to_node
        targetNode: 'error_handler_node'
    },
    logging: {
        logLevel: 'error',
        includeStackTrace: true
    }
};
```

### F. Webhooks Reales

```javascript
// FALTANTE: Servidor de webhooks

// Configuración ideal:
{
    webhook: {
        url: 'https://nexus-ai.com/webhook/abc123',
        method: 'POST',
        authentication: {
            type: 'bearer',
            token: '{{env.WEBHOOK_SECRET}}'
        },
        headers: {
            'Content-Type': 'application/json'
        },
        responseMapping: {
            status: 200,
            body: '{"received": true}'
        }
    }
}
```

---

## 3. Problemas de UI/UX

### A. Toolbar de Nodos

| Problema | Impacto | Solución |
|----------|---------|----------|
| 30+ nodos sin buscador | Alto | Agregar search bar con filtrado |
| Scroll excesivo | Medio | Secciones colapsables |
| Sin favoritos | Bajo | Sistema de nodos frecuentes |
| Sin recientes | Bajo | Historial de nodos usados |

```html
<!-- AGREGAR: Buscador de nodos -->
<div class="toolbar-search">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Buscar nodos..." id="nodeSearch">
    <kbd>⌘K</kbd>
</div>
```

### B. Puertos de Conexión

```css
/* ACTUAL: Puertos pequeños y difíciles de clickear */
.node-port {
    width: 12px;
    height: 12px;
}

/* IDEAL: Puertos más grandes con mejor feedback */
.node-port {
    width: 16px;
    height: 16px;
    /* Área de click expandida */
    &::before {
        content: '';
        position: absolute;
        width: 28px;
        height: 28px;
        /* Invisible pero clickeable */
    }
}

/* Diferenciación visual entrada/salida */
.node-port.input {
    background: #3b82f6; /* Azul */
    border-color: #2563eb;
}
.node-port.output {
    background: #22c55e; /* Verde */
    border-color: #16a34a;
}
```

### C. Preview de Conexión

```javascript
// FALTANTE: Línea preview mientras arrastras

canvas.addEventListener('mousemove', (e) => {
    if (this.isConnecting && this.connectionStart) {
        // Dibujar línea temporal desde puerto origen hasta cursor
        this.drawPreviewConnection(
            this.connectionStart.position,
            { x: e.clientX, y: e.clientY }
        );

        // Resaltar puertos compatibles
        this.highlightCompatiblePorts(this.connectionStart.type);
    }
});
```

### D. Panel de Propiedades

```
ACTUAL:
┌─────────────────────────┐
│ Propiedades             │
├─────────────────────────┤
│ URL: [___________]      │  ← Todo es input de texto
│ Method: [___________]   │
│ Headers: [___________]  │
│ Token: [___________]    │
└─────────────────────────┘

IDEAL:
┌─────────────────────────────────────┐
│ API Call - Configuración            │
├─────────────────────────────────────┤
│ URL *                               │
│ [https://api.example.com/v1]        │
│                                     │
│ Método                              │
│ [GET ▼] POST | PUT | DELETE         │
│                                     │
│ Headers                             │
│ ┌─────────────┬─────────────┬───┐   │
│ │ Key         │ Value       │ ✕ │   │
│ ├─────────────┼─────────────┼───┤   │
│ │ Auth        │ Bearer {{}} │ ✕ │   │
│ └─────────────┴─────────────┴───┘   │
│ [+ Agregar header]                  │
│                                     │
│ Body (JSON)                         │
│ ┌─────────────────────────────────┐ │
│ │ {                               │ │
│ │   "data": "{{input}}"           │ │
│ │ }                               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ Campo requerido                  │
└─────────────────────────────────────┘
```

### E. Canvas y Navegación

| Feature | Estado | Prioridad |
|---------|--------|-----------|
| Minimap | ❌ Faltante | Alta |
| Auto-layout | ❌ Faltante | Media |
| Snap-to-grid | ❌ Faltante | Baja |
| Alinear/Distribuir | ❌ Faltante | Baja |
| Zoom con scroll | ✅ Existe | - |
| Pan con drag | ⚠️ Parcial | Media |

---

## 4. Problemas de Responsive

### Breakpoints Actuales vs Recomendados

```css
/* ACTUAL: Breakpoint muy agresivo */
@media (max-width: 1024px) {
    .main-container {
        grid-template-columns: 1fr; /* Colapsa todo */
    }
}

/* RECOMENDADO: Breakpoints graduales */
@media (max-width: 1400px) {
    /* Desktop pequeño: sidebar más angosto */
    .toolbar { width: 200px; }
}

@media (max-width: 1100px) {
    /* Laptop: toolbar colapsable */
    .toolbar {
        position: absolute;
        transform: translateX(-100%);
    }
    .toolbar.open { transform: translateX(0); }
}

@media (max-width: 768px) {
    /* Tablet: layout vertical */
    .main-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto;
    }
    .properties-panel {
        position: fixed;
        bottom: 0;
        height: 50vh;
    }
}

@media (max-width: 480px) {
    /* Mobile: modal para propiedades */
    .properties-panel {
        height: 100vh;
        z-index: 1000;
    }
}
```

### Touch Events

```javascript
// FALTANTE: Soporte táctil para conexiones

setupTouchEvents() {
    // Touch en puerto para iniciar conexión
    port.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startConnection(node, port);
    });

    // Touch move para preview
    canvas.addEventListener('touchmove', (e) => {
        if (this.isConnecting) {
            const touch = e.touches[0];
            this.updateConnectionPreview(touch.clientX, touch.clientY);
        }
    });

    // Touch end para completar conexión
    port.addEventListener('touchend', (e) => {
        if (this.isConnecting) {
            this.endConnection(node, port);
        }
    });
}
```

---

## 5. Problemas de Accesibilidad (WCAG 2.1)

### Nivel A (Crítico)

| Criterio | Estado | Solución |
|----------|--------|----------|
| 1.1.1 Texto alternativo | ❌ | Agregar `aria-label` a iconos |
| 2.1.1 Teclado | ⚠️ | Agregar `tabindex` a nodos/puertos |
| 2.4.1 Bypass blocks | ❌ | Agregar skip links |
| 4.1.2 Nombre, rol, valor | ❌ | Agregar roles ARIA |

### Código de Ejemplo

```html
<!-- ACTUAL: Sin accesibilidad -->
<div class="flow-node" data-node-id="node_1">
    <div class="flow-node-icon">
        <i class="fas fa-globe"></i>
    </div>
    <div class="node-port input"></div>
</div>

<!-- IDEAL: Con accesibilidad -->
<div
    class="flow-node"
    data-node-id="node_1"
    role="button"
    tabindex="0"
    aria-label="Nodo Webhook - Recibe datos HTTP"
    aria-describedby="node_1_description"
>
    <div class="flow-node-icon" aria-hidden="true">
        <i class="fas fa-globe"></i>
    </div>
    <div
        class="node-port input"
        role="button"
        tabindex="0"
        aria-label="Puerto de entrada - Presiona Enter para conectar"
    ></div>
    <span id="node_1_description" class="sr-only">
        Este nodo recibe webhooks HTTP. Tiene 1 conexión de salida.
    </span>
</div>
```

### Navegación por Teclado

```javascript
// AGREGAR: Navegación completa por teclado

setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const focusedNode = document.activeElement.closest('.flow-node');

        switch(e.key) {
            case 'Tab':
                // Navegar entre nodos
                break;
            case 'Enter':
            case ' ':
                // Seleccionar nodo o iniciar conexión
                if (focusedNode) {
                    this.selectNode(focusedNode);
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                // Mover nodo seleccionado
                if (this.selectedNode) {
                    e.preventDefault();
                    this.moveNode(this.selectedNode, e.key);
                }
                break;
            case 'c':
                if (e.ctrlKey && this.selectedNode) {
                    // Copiar nodo
                    this.copyNode(this.selectedNode);
                }
                break;
            case 'v':
                if (e.ctrlKey) {
                    // Pegar nodo
                    this.pasteNode();
                }
                break;
            case 'z':
                if (e.ctrlKey) {
                    // Undo
                    this.undo();
                }
                break;
        }
    });
}
```

---

## 6. Problemas de Código

### A. Vulnerabilidad XSS

```javascript
// ❌ PELIGROSO: innerHTML con datos de usuario
nodeElement.innerHTML = `
    <div class="flow-node-title">${nodeData.title}</div>
`;

// ✅ SEGURO: Usar textContent o sanitizar
const title = document.createElement('div');
title.className = 'flow-node-title';
title.textContent = nodeData.title; // Escapa automáticamente
```

### B. Memory Leaks

```javascript
// ❌ PROBLEMA: Listener por cada nodo, nunca se remueven
setupNodeEvents(nodeElement) {
    document.addEventListener('mousemove', (e) => {
        // Este listener NUNCA se remueve
        // 100 nodos = 100 listeners activos
    });
}

// ✅ SOLUCIÓN: Event delegation
setupNodeEvents() {
    // UN solo listener para todos los nodos
    this.canvas.addEventListener('mousemove', (e) => {
        const node = e.target.closest('.flow-node');
        if (!node || !this.isDragging) return;
        this.handleNodeDrag(node, e);
    });
}
```

### C. Clase Monolítica

```
ACTUAL: 1 archivo, 1 clase, 1,736 líneas

automation-builder.js (1,736 líneas)
└── class AutomationBuilder
    ├── constructor
    ├── init
    ├── setupEventListeners
    ├── createNode
    ├── drawConnection
    ├── ... (50+ métodos)
    └── showToast

IDEAL: Módulos separados

/js
├── AutomationBuilder.js      (clase principal, ~200 líneas)
├── modules/
│   ├── NodeManager.js        (crear, eliminar, duplicar nodos)
│   ├── ConnectionManager.js  (crear, dibujar, eliminar conexiones)
│   ├── CanvasManager.js      (zoom, pan, resize)
│   ├── PropertiesPanel.js    (mostrar, editar propiedades)
│   ├── UIController.js       (toasts, modales, estados)
│   └── PersistenceManager.js (guardar, cargar, exportar)
├── nodes/
│   ├── BaseNode.js
│   ├── TriggerNode.js
│   ├── ActionNode.js
│   └── ...
└── utils/
    ├── sanitize.js
    ├── debounce.js
    └── validation.js
```

### D. Magic Numbers

```javascript
// ❌ MAL: Números sin explicación
nodeElement.style.left = `${x - 80}px`;
nodeElement.style.top = `${y - 50}px`;

// ✅ BIEN: Constantes con nombres descriptivos
const NODE_WIDTH = 160;
const NODE_HEIGHT = 100;
const NODE_CENTER_OFFSET_X = NODE_WIDTH / 2;  // 80
const NODE_CENTER_OFFSET_Y = NODE_HEIGHT / 2; // 50

nodeElement.style.left = `${x - NODE_CENTER_OFFSET_X}px`;
nodeElement.style.top = `${y - NODE_CENTER_OFFSET_Y}px`;
```

---

## 7. Sistema de Persistencia (Faltante)

### Implementación Recomendada

```javascript
class PersistenceManager {
    constructor(builder) {
        this.builder = builder;
        this.storageKey = 'nexus_automation_workflows';
        this.autoSaveInterval = 30000; // 30 segundos
    }

    // Serializar workflow actual
    serialize() {
        return {
            id: this.builder.workflowId || crypto.randomUUID(),
            name: this.builder.workflowName || 'Sin título',
            version: '1.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: Array.from(this.builder.nodes.entries()).map(([id, node]) => ({
                id,
                type: node.type,
                position: node.position,
                properties: node.properties
            })),
            connections: Array.from(this.builder.connections.entries()).map(([id, conn]) => ({
                id,
                from: conn.from,
                to: conn.to
            })),
            settings: {
                zoom: this.builder.zoom,
                pan: this.builder.pan
            }
        };
    }

    // Guardar en localStorage
    saveToLocal() {
        try {
            const workflow = this.serialize();
            const workflows = this.getAllWorkflows();
            workflows[workflow.id] = workflow;
            localStorage.setItem(this.storageKey, JSON.stringify(workflows));
            return { success: true, id: workflow.id };
        } catch (error) {
            console.error('Error guardando workflow:', error);
            return { success: false, error: error.message };
        }
    }

    // Cargar desde localStorage
    loadFromLocal(workflowId) {
        try {
            const workflows = this.getAllWorkflows();
            const workflow = workflows[workflowId];
            if (!workflow) throw new Error('Workflow no encontrado');

            this.builder.clearCanvas();
            this.deserialize(workflow);
            return { success: true };
        } catch (error) {
            console.error('Error cargando workflow:', error);
            return { success: false, error: error.message };
        }
    }

    // Exportar como JSON
    exportToFile() {
        const workflow = this.serialize();
        const blob = new Blob([JSON.stringify(workflow, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Importar desde archivo
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workflow = JSON.parse(e.target.result);
                    this.deserialize(workflow);
                    resolve({ success: true });
                } catch (error) {
                    reject({ success: false, error: 'Archivo inválido' });
                }
            };
            reader.readAsText(file);
        });
    }

    // Auto-guardado
    startAutoSave() {
        setInterval(() => {
            if (this.builder.hasChanges) {
                this.saveToLocal();
                this.builder.hasChanges = false;
                this.builder.showToast('Auto-guardado', 'info');
            }
        }, this.autoSaveInterval);
    }
}
```

---

## 8. Plan de Implementación

### Fase 1: Crítico (Semana 1)

- [ ] Arreglar vulnerabilidad XSS (usar `textContent`)
- [ ] Implementar localStorage save/load
- [ ] Agregar botones Guardar/Cargar en header
- [ ] Agregar exportar/importar JSON
- [ ] Agregar buscador de nodos

### Fase 2: Core Features (Semanas 2-3)

- [ ] Implementar flujo de datos básico entre nodos
- [ ] Crear UI de condiciones para Filter
- [ ] Crear UI de mapeo para Transform
- [ ] Agregar validación de campos requeridos
- [ ] Implementar Undo/Redo (Ctrl+Z, Ctrl+Y)

### Fase 3: UX/UI (Semana 4)

- [ ] Mejorar tamaño de puertos (16px)
- [ ] Agregar preview de conexión mientras arrastras
- [ ] Diferenciar colores input/output
- [ ] Agregar minimap para workflows grandes
- [ ] Mejorar responsive para tablet

### Fase 4: Accesibilidad (Semana 5)

- [ ] Agregar aria-labels a todos los elementos interactivos
- [ ] Implementar navegación completa por teclado
- [ ] Agregar roles ARIA apropiados
- [ ] Verificar contraste de colores
- [ ] Probar con screen reader

### Fase 5: Código (Semana 6)

- [ ] Dividir clase en módulos
- [ ] Arreglar memory leaks de event listeners
- [ ] Reemplazar magic numbers con constantes
- [ ] Agregar error handling con try/catch
- [ ] Agregar JSDoc a funciones públicas

### Fase 6: Backend (Futuro)

- [ ] API REST para guardar workflows
- [ ] Servidor de webhooks real
- [ ] Ejecución real de nodos
- [ ] Cola de tareas (Bull, Agenda)
- [ ] Logs y monitoreo

---

## Resumen de Prioridades

| Prioridad | Items | Esfuerzo |
|-----------|-------|----------|
| 🔴 P0 - Crítico | XSS, Persistencia, Validación | 1 semana |
| 🟠 P1 - Alto | Flujo de datos, Filter UI, Transform UI | 2 semanas |
| 🟡 P2 - Medio | UX mejoras, Responsive, Accesibilidad | 2 semanas |
| 🔵 P3 - Bajo | Refactor código, Minimap, Auto-layout | 1 semana |
| ⚪ Futuro | Backend, Ejecución real, Webhooks | 4+ semanas |

---

*Documento generado: Enero 2026*
*Versión: 1.0*
