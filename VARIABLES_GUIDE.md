# Sistema de Variables - Nexus AI

## 📋 Resumen

El sistema de variables permite **referenciar datos de otros nodos** en el flujo de trabajo usando la sintaxis `{{variable}}`. Esto habilita el flujo de datos real entre nodos.

---

## 🎯 Sintaxis Básica

### 1. **Referencia al nodo anterior**
```
{{prev.field}}
```
- Accede al output del último nodo conectado
- Útil para flujos lineales
- **Ejemplo**: `{{prev.email}}` → obtiene el campo `email` del nodo anterior

### 2. **Referencia a nodo específico**
```
{{nodeId.field}}
```
- Accede al output de un nodo específico por su ID
- Útil cuando hay múltiples conexiones
- **Ejemplo**: `{{node_abc123.response.text}}` → obtiene `response.text` del nodo con ID `node_abc123`

### 3. **Acceso anidado**
```
{{prev.data.user.name}}
```
- Navega por objetos anidados usando notación de punto
- Soporta múltiples niveles de profundidad
- **Ejemplo**: `{{prev.response.data.items[0].title}}` → accede a propiedades profundas

---

## 💡 Casos de Uso

### **Caso 1: Flujo de Email con datos de Formulario**

```
[Formulario] → [ChatGPT] → [Enviar Email]
```

**Configuración del nodo ChatGPT**:
- **System Prompt**: `"Redacta un email profesional para {{prev.nombre}} de la empresa {{prev.empresa}}"`

**Configuración del nodo Email**:
- **To**: `{{prev.email}}`
- **Subject**: `Respuesta a tu consulta - {{prev.empresa}}`
- **Body**: `{{chatgpt_node.response.text}}`

---

### **Caso 2: Filtrado condicional**

```
[Webhook] → [Filtro] → [Slack]
```

**Configuración del nodo Filtro**:
- **Condición**: El campo `{{prev.amount}}` debe ser mayor a 1000

**Configuración del nodo Slack**:
- **Message**: `🚨 Alerta: Nueva transacción de ${{prev.amount}} desde {{prev.country}}`

---

### **Caso 3: Enriquecimiento de datos con múltiples fuentes**

```
[Form] → [ChatGPT: Análisis]
      ↘ [Gemini: Traducción] → [CRM]
```

**Configuración del nodo CRM**:
- **Name**: `{{form_node.nombre}}`
- **Email**: `{{form_node.email}}`
- **Analysis**: `{{chatgpt_node.response.text}}`
- **Translation**: `{{gemini_node.response.text}}`

---

## 🔧 Resolución de Variables

### **¿Cómo funciona internamente?**

1. **Ejecución topológica**: Los nodos se ejecutan en orden correcto
2. **Contexto de ejecución**: Cada nodo guarda su output en `executionContext`
3. **Resolución antes de ejecutar**: Las variables se resuelven **antes** de ejecutar cada nodo
4. **Acceso recursivo**: Soporta objetos anidados y arrays

### **Método `resolveVariables(text, node)`**

```javascript
// Ejemplo de resolución
const text = "Email: {{prev.email}}, Score: {{chatgpt_node.response.score}}";
const resolved = engine.resolveVariables(text, currentNode);
// Resultado: "Email: juan@example.com, Score: 85"
```

---

## 📊 Estructura de Outputs por Tipo de Nodo

### **Nodo Webhook**
```javascript
{
  status: 200,
  method: "POST",
  body: {
    timestamp: "2024-01-14T10:30:00Z",
    data: "..."
  },
  headers: { ... }
}
```
**Variables**:
- `{{webhook_node.status}}`
- `{{webhook_node.body.data}}`

---

### **Nodo Formulario**
```javascript
{
  formName: "Contact Form",
  fields: {
    nombre: "Juan Pérez",
    email: "juan@example.com",
    empresa: "Acme Corp"
  },
  submittedAt: "2024-01-14T10:30:00Z"
}
```
**Variables**:
- `{{form_node.fields.nombre}}`
- `{{form_node.fields.email}}`

---

### **Nodo ChatGPT / Gemini**
```javascript
{
  model: "gpt-4",
  prompt: "...",
  response: {
    text: "Respuesta generada...",
    confidence: 0.95,
    tokens: 150
  },
  timestamp: "2024-01-14T10:30:00Z"
}
```
**Variables**:
- `{{chatgpt_node.response.text}}`
- `{{chatgpt_node.response.confidence}}`

---

### **Nodo Filtro**
```javascript
{
  passed: true,
  condition: "amount > 1000",
  input: { ... },
  timestamp: "2024-01-14T10:30:00Z"
}
```
**Variables**:
- `{{filter_node.passed}}`
- `{{filter_node.input}}`

---

### **Nodo Transform**
```javascript
{
  transformed: true,
  input: { ... },
  output: {
    // Datos transformados
  },
  mapping: { ... }
}
```
**Variables**:
- `{{transform_node.output.field}}`

---

## ⚠️ Manejo de Errores

### **Variable no encontrada**
```javascript
// Si el nodo no existe o aún no se ejecutó
"{{nonexistent_node.field}}" → "{{nonexistent_node.field}}" (sin cambios)
```
**Consola**: `⚠️ Variable {{nonexistent_node.field}}: Node nonexistent_node not found`

### **Campo no existe**
```javascript
// Si el campo no está en el output
"{{prev.nonexistent_field}}" → "{{prev.nonexistent_field}}" (sin cambios)
```

### **Sin nodos anteriores**
```javascript
// Si usas {{prev.field}} pero no hay conexiones
"{{prev.email}}" → "{{prev.email}}" (sin cambios)
```
**Consola**: `⚠️ Variable {{prev.email}}: No previous nodes connected`

---

## 🧪 Testing y Debugging

### **Ver el contexto de ejecución**

Después de ejecutar el flujo, puedes inspeccionar el contexto en la consola:

```javascript
// En DevTools Console
window.builder.executionEngine.executionContext
```

Esto muestra todos los outputs de los nodos ejecutados.

---

### **Logs de resolución**

Cada resolución de variable genera logs:

```
⚙️ Resolving variables in node chatgpt_abc123
✅ Variable {{prev.email}} resolved to: juan@example.com
⚠️ Variable {{prev.phone}} not found in previous node output
```

---

## 📝 Buenas Prácticas

### ✅ **DO's**

1. **Usa `prev` para flujos lineales**:
   ```
   {{prev.field}}
   ```

2. **Usa IDs específicos cuando hay múltiples conexiones**:
   ```
   {{form_node.email}}
   {{chatgpt_node.response.text}}
   ```

3. **Verifica que los nodos estén conectados correctamente** antes de ejecutar

4. **Usa nombres de campo consistentes** entre nodos

---

### ❌ **DON'Ts**

1. **No uses variables que aún no se ejecutaron**:
   ```
   [NodeA] → [NodeB]
   
   # ❌ En NodeA no puedes usar {{nodeB.field}}
   # ✅ En NodeB puedes usar {{nodeA.field}}
   ```

2. **No asumas estructuras de datos sin verificar**:
   ```
   # Puede fallar si response no tiene nested.field
   {{prev.response.nested.field}}
   ```

3. **No uses caracteres especiales en nombres de campo** (usa `_` en lugar de espacios)

---

## 🚀 Próximas Mejoras

- [ ] **Funciones de transformación**: `{{prev.email | lowercase}}`
- [ ] **Operaciones matemáticas**: `{{prev.amount * 1.21}}`
- [ ] **Condicionales inline**: `{{prev.status === 'active' ? 'Yes' : 'No'}}`
- [ ] **Arrays y loops**: `{{prev.items[0].name}}`
- [ ] **Variables globales**: `{{env.API_KEY}}`
- [ ] **Helper functions**: `{{formatDate(prev.timestamp)}}`

---

## 🔗 Referencias

- **Execution Engine**: `/js/execution-engine.js`
- **Variable Resolution**: Método `resolveVariables()`
- **Node Execution**: Método `runNodeLogic()`
- **Context Management**: `executionContext` Map

---

## 💬 Soporte

Para preguntas o problemas con variables:
- Revisa los logs de consola para warnings
- Verifica las conexiones entre nodos
- Usa el panel de propiedades para ver ejemplos de sintaxis

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0
