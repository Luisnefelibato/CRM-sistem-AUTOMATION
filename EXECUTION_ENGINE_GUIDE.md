# ⚙️ Sistema de Ejecución de Workflows - Documentación

## 🎯 Descripción

El **ExecutionEngine** es el motor que ejecuta workflows con **flujo de datos real** entre nodos. Cada nodo procesa datos de nodos anteriores y pasa sus resultados a nodos siguientes.

---

## ✨ Características Implementadas

### 🔄 Flujo de Datos Real
- **Input/Output entre nodos**: Los nodos pasan datos reales
- **Contexto compartido**: Todos los outputs se almacenan en un contexto global
- **Ejecución ordenada**: Topological sort garantiza orden correcto
- **Detección de ciclos**: Detecta y previene ciclos infinitos

### 📊 Topological Sort
```javascript
// Algoritmo de Kahn para ordenar nodos
const sorted = topologicalSort();
// Garantiza que nodos padres se ejecuten antes que hijos
```

### 🎭 Estados Visuales
- **Ejecutando** (púrpura pulsante)
- **Éxito** (verde flash)
- **Error** (rojo shake)

### 📝 Logging Completo
- Logs estructurados con timestamps
- Niveles: info, success, warning, error
- Métricas: duración, tamaño de output, etc.

---

## 🏗️ Arquitectura

### Componentes Principales

```
ExecutionEngine
├── executeWorkflow()      // Punto de entrada principal
├── topologicalSort()      // Ordena nodos para ejecución
├── executeNode()          // Ejecuta un nodo individual
├── getNodeInputs()        // Obtiene datos de nodos padre
├── runNodeLogic()         // Lógica específica por tipo de nodo
└── highlightNode()        // Feedback visual
```

### Flujo de Ejecución

```
1. Usuario hace click en "Ejecutar"
   ↓
2. executeWorkflow() se llama
   ↓
3. Topological sort ordena nodos
   ↓
4. Para cada nodo (en orden):
   a. getNodeInputs() obtiene datos de nodos conectados
   b. runNodeLogic() ejecuta lógica del nodo
   c. Output se guarda en executionContext
   d. highlightNode() muestra feedback visual
   ↓
5. Retorna resultado con logs y contexto completo
```

---

## 📦 Estructura de Datos

### Execution Context
```javascript
{
  "node_1": {
    status: 200,
    body: { data: "webhook data" },
    timestamp: "2026-01-14T..."
  },
  "node_2": {
    model: "gpt-4",
    response: { text: "AI response..." },
    timestamp: "2026-01-14T..."
  }
}
```

### Execution Result
```javascript
{
  success: true,
  executionId: "exec_1736872800000",
  context: { /* todos los outputs */ },
  logs: [
    {
      timestamp: "2026-01-14T...",
      level: "info",
      message: "Workflow execution started",
      executionId: "exec_..."
    },
    // ... más logs
  ]
}
```

---

## 🔧 Tipos de Nodos Implementados

### 1. **Webhook** (Trigger)
**Input**: Ninguno (nodo inicial)  
**Output**: 
```javascript
{
  status: 200,
  method: "POST",
  url: "/webhook",
  body: {
    timestamp: "2026-01-14T...",
    data: "Sample webhook data",
    source: "webhook-trigger"
  },
  headers: {
    "Content-Type": "application/json"
  }
}
```

### 2. **Form** (Trigger)
**Input**: Ninguno (nodo inicial)  
**Output**:
```javascript
{
  formName: "Contact Form",
  fields: {
    nombre: "Juan Pérez",
    email: "juan@example.com",
    empresa: "Acme Corp",
    telefono: "+1234567890",
    mensaje: "Interesado en los servicios"
  },
  submittedAt: "2026-01-14T..."
}
```

### 3. **ChatGPT / Gemini** (AI Processing)
**Input**: Datos de nodo anterior  
**Output**:
```javascript
{
  model: "gpt-4",
  prompt: "Process this data",
  input: { /* datos del nodo anterior */ },
  response: {
    text: "Processed by AI...",
    confidence: 0.95,
    tokens: 150
  },
  timestamp: "2026-01-14T..."
}
```

### 4. **Filter** (Conditional)
**Input**: Datos de nodo anterior  
**Output**:
```javascript
{
  filtered: true,  // o false si no pasa el filtro
  input: { /* datos originales */ },
  conditions: [...],
  operator: "AND"
}
```

### 5. **Transform** (Data Transformation)
**Input**: Datos de nodo anterior  
**Output**:
```javascript
{
  transformed: true,
  input: { /* datos originales */ },
  output: {
    /* datos transformados */
    transformed_at: "2026-01-14T...",
    node_type: "transform"
  },
  mappings: {}
}
```

### 6. **Email Send** (Action)
**Input**: Datos de nodo anterior  
**Output**:
```javascript
{
  sent: true,
  provider: "SMTP",
  to: "recipient@example.com",
  subject: "Email from Nexus AI Workflow",
  timestamp: "2026-01-14T..."
}
```

### 7. **Slack** (Action)
**Input**: Datos de nodo anterior  
**Output**:
```javascript
{
  sent: true,
  channel: "#general",
  message: "{ /* datos del nodo anterior */ }",
  timestamp: "2026-01-14T..."
}
```

### 8. **API Call** (Action)
**Input**: Datos de nodo anterior  
**Output**:
```javascript
{
  status: 200,
  method: "POST",
  url: "https://api.example.com",
  response: {
    success: true,
    data: { /* datos enviados */ }
  },
  timestamp: "2026-01-14T..."
}
```

---

## 🎯 Ejemplos de Flujos

### Ejemplo 1: Lead Qualification
```
Form → ChatGPT → Filter → Slack
```

**Flujo de Datos**:
```
1. Form genera:
   { nombre: "Juan", email: "juan@example.com" }
   
2. ChatGPT recibe form data, procesa con IA:
   { score: 8, category: "hot-lead" }
   
3. Filter verifica score >= 8:
   { filtered: true, score: 8 }
   
4. Slack envía notificación:
   { sent: true, channel: "#sales" }
```

### Ejemplo 2: Data Pipeline
```
Webhook → Transform → Database → Email
```

**Flujo de Datos**:
```
1. Webhook recibe datos:
   { user_id: 123, action: "purchase" }
   
2. Transform normaliza:
   { id: 123, event: "purchase", timestamp: "..." }
   
3. Database guarda:
   { saved: true, record_id: "abc123" }
   
4. Email confirma:
   { sent: true, to: "admin@example.com" }
```

---

## 📊 Algoritmo Topological Sort

### ¿Por qué es necesario?
Los workflows pueden tener nodos en cualquier orden visual, pero la ejecución debe respetar dependencias:

```
Visual (aleatorio):    Ejecución (ordenado):
┌─────┐                1. Form
│Form │                2. ChatGPT
└─────┘                3. CRM
   ↓
┌─────┐
│ CRM │
└─────┘
   ↑
┌──────────┐
│ ChatGPT  │
└──────────┘
```

### Implementación (Algoritmo de Kahn)
```javascript
topologicalSort() {
  // 1. Construir grafo de adyacencia
  adjacencyList = { node_1: [node_2, node_3], ... }
  inDegree = { node_1: 0, node_2: 1, ... }
  
  // 2. Encontrar nodos sin dependencias (inDegree = 0)
  queue = [todos los nodos con inDegree = 0]
  
  // 3. Procesar nodos en orden
  while (queue no vacío) {
    nodo = queue.shift()
    sorted.push(nodo)
    
    // Reducir inDegree de vecinos
    for (vecino of nodo.neighbors) {
      inDegree[vecino]--
      if (inDegree[vecino] === 0) {
        queue.push(vecino)
      }
    }
  }
  
  // 4. Detectar ciclos
  if (sorted.length !== total_nodes) {
    throw Error("Ciclo detectado!")
  }
  
  return sorted
}
```

---

## 🎨 Estados Visuales de Nodos

### CSS Classes

```css
/* Nodo ejecutando (púrpura pulsante) */
.flow-node.node-executing {
  border-color: var(--nexus-purple);
  animation: executePulse 1.5s infinite;
}

/* Nodo exitoso (verde flash) */
.flow-node.node-success {
  border-color: var(--accent-green);
  animation: successFlash 0.5s ease;
}

/* Nodo con error (rojo shake) */
.flow-node.node-error {
  border-color: var(--accent-red);
  animation: errorShake 0.5s ease;
}
```

### Animaciones

**Execute Pulse**: Pulsa continuamente mientras ejecuta  
**Success Flash**: Flash verde brillante al completar  
**Error Shake**: Sacude horizontalmente en caso de error

---

## 📝 Sistema de Logging

### Estructura de Log
```javascript
{
  timestamp: "2026-01-14T16:45:30.123Z",
  level: "info" | "success" | "warning" | "error",
  message: "Descriptive message",
  executionId: "exec_1736872800000",
  // datos adicionales específicos del evento
}
```

### Niveles de Log

| Nivel | Uso | Emoji |
|-------|-----|-------|
| **info** | Información general | ℹ️ |
| **success** | Operación exitosa | ✅ |
| **warning** | Advertencia no crítica | ⚠️ |
| **error** | Error crítico | ❌ |

### Ejemplo de Logs
```
ℹ️ [ExecutionEngine] Workflow execution started
ℹ️ [ExecutionEngine] Execution order determined: 3 nodes
ℹ️ [ExecutionEngine] Executing node: form
✅ [ExecutionEngine] Node executed successfully: form (duration: 312ms)
ℹ️ [ExecutionEngine] Executing node: chatgpt
✅ [ExecutionEngine] Node executed successfully: chatgpt (duration: 487ms)
ℹ️ [ExecutionEngine] Executing node: slack
✅ [ExecutionEngine] Node executed successfully: slack (duration: 298ms)
✅ [ExecutionEngine] Workflow execution completed successfully
```

---

## 🚀 Uso

### Ejecutar Workflow

```javascript
// Automático al hacer click en botón "Ejecutar"
document.getElementById('runFlow').click();

// O programáticamente
await builder.runFlow();
```

### Ver Resultado en Console
```javascript
// Logs aparecen automáticamente en console
📊 Workflow Execution Result
  Execution ID: exec_1736872800000
  Success: true
  Nodes Executed: 3
  
  📋 Execution Context (Node Outputs):
    node_1: { formName: "Contact Form", fields: {...} }
    node_2: { model: "gpt-4", response: {...} }
    node_3: { sent: true, channel: "#general" }
    
  📝 Execution Logs:
    ℹ️ [2026-01-14T...] Workflow execution started
    ℹ️ [2026-01-14T...] Execution order determined: 3 nodes
    ...
```

### Acceder a Datos Programáticamente
```javascript
// Obtener contexto completo
const context = builder.executionEngine.getContext();

// Obtener logs
const logs = builder.executionEngine.getLogs();

// Limpiar estado
builder.executionEngine.clear();
```

---

## ⚠️ Limitaciones Actuales

### 🟡 Simulación vs Real

Actualmente los nodos **simulan** ejecución:
- ❌ No hacen llamadas HTTP reales
- ❌ No conectan con APIs externas
- ❌ No envían emails/mensajes reales
- ✅ Pero SÍ pasan datos entre nodos
- ✅ Pero SÍ mantienen contexto
- ✅ Pero SÍ ejecutan en orden correcto

### 🟡 Variables no implementadas aún

```javascript
// Futuro (no funciona aún):
properties = {
  email: "{{node_1.fields.email}}"
}

// Actual (funciona):
properties = {
  email: "hardcoded@example.com"
}
```

### 🟡 Ejecución condicional básica

Filter actualmente siempre pasa (filtered: true).  
En futuro evaluará condiciones reales.

---

## 🔮 Próximas Mejoras

### Fase 2 - Integración Real
- [ ] **HTTP requests reales**: Conectar con APIs externas
- [ ] **Email real**: Integración con SMTP/SendGrid
- [ ] **Slack real**: Webhook real de Slack
- [ ] **AI real**: Llamadas a OpenAI/Gemini APIs

### Fase 3 - Variables Dinámicas
- [ ] **Template engine**: Sistema `{{node.output.field}}`
- [ ] **Variable picker**: UI para seleccionar variables
- [ ] **Type checking**: Validar tipos de datos
- [ ] **Preview**: Vista previa de datos antes de ejecutar

### Fase 4 - Control de Flujo
- [ ] **Condicionales IF/ELSE**: Rutas alternativas
- [ ] **Loops**: Iteración sobre arrays
- [ ] **Switch**: Múltiples rutas basadas en valor
- [ ] **Try/Catch**: Manejo de errores avanzado

### Fase 5 - Debugging
- [ ] **Breakpoints**: Pausar ejecución en nodos
- [ ] **Step-through**: Ejecutar paso a paso
- [ ] **Watch variables**: Observar valores en tiempo real
- [ ] **Timeline**: Vista de ejecución en línea de tiempo

### Fase 6 - Performance
- [ ] **Ejecución paralela**: Nodos independientes en paralelo
- [ ] **Caching**: Cache de outputs de nodos
- [ ] **Retry policies**: Reintentos automáticos
- [ ] **Timeout configs**: Timeouts por nodo

---

## 🧪 Testing

### Test Manual
```
1. Agregar Form al canvas
2. Agregar ChatGPT al canvas
3. Conectar Form → ChatGPT
4. Agregar Slack al canvas
5. Conectar ChatGPT → Slack
6. Click en "Ejecutar"
7. Ver animaciones en nodos
8. Abrir Console (F12)
9. Ver logs de ejecución
10. Verificar contexto con datos reales
```

### Verificaciones
- ✅ Nodos se ejecutan en orden correcto
- ✅ Datos fluyen entre nodos
- ✅ Animaciones visuales aparecen
- ✅ Logs se muestran en console
- ✅ Toast notifications aparecen
- ✅ Estado cambia a "Ejecutando" → "Completado"

---

## 📚 API de Desarrollo

### ExecutionEngine Methods

```javascript
// Ejecutar workflow
await executionEngine.executeWorkflow()

// Obtener contexto
const context = executionEngine.getContext()

// Obtener logs
const logs = executionEngine.getLogs()

// Limpiar estado
executionEngine.clear()

// Verificar si está ejecutando
const isRunning = executionEngine.isExecuting
```

### AutomationBuilder Methods

```javascript
// Ejecutar workflow (wrapper)
await builder.runFlow()

// Ver resultado
builder.showExecutionResult(result)
```

---

## 🎓 Conceptos Clave

### Topological Sort
Ordenamiento de nodos en un grafo dirigido acíclico (DAG) donde cada nodo aparece antes que sus dependientes.

### Execution Context
Mapa global que almacena los outputs de todos los nodos ejecutados, permitiendo que nodos posteriores accedan a datos de nodos anteriores.

### In-Degree
Número de conexiones entrantes a un nodo. Nodos con in-degree = 0 son nodos iniciales (triggers).

### DAG (Directed Acyclic Graph)
Grafo dirigido sin ciclos. Los workflows deben ser DAGs para poder ejecutarse.

---

**Última actualización**: 2026-01-14  
**Versión**: 1.0  
**Autor**: Nexus AI Team
