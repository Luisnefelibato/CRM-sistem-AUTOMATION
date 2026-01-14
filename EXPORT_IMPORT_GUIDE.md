# 📤📥 Guía de Exportación e Importación de Workflows

## 🎯 Resumen

Nexus AI Automation Builder incluye funcionalidad completa de **exportar/importar workflows** en formato JSON. Esto permite:

- ✅ Compartir workflows entre usuarios
- ✅ Hacer backup de workflows importantes
- ✅ Migrar workflows entre navegadores/dispositivos
- ✅ Versionar workflows con control de cambios
- ✅ Editar workflows manualmente (avanzado)

---

## 📤 EXPORTAR WORKFLOWS

### Método 1: Desde el Header (Recomendado)

1. **Crear o cargar un workflow** con nodos y conexiones
2. Hacer click en el botón **"Exportar"** (icono 📥) en el header
3. El archivo JSON se descarga automáticamente con formato:
   ```
   Nombre_del_Workflow_1736872200000.json
   ```

### Método 2: Desde localStorage (Manual)

Si quieres acceder a workflows guardados sin exportarlos:

```javascript
// Abrir consola del navegador (F12)
const workflows = JSON.parse(localStorage.getItem('nexus_automation_workflows'));
console.log(workflows);
```

### Características del Archivo Exportado

El archivo JSON contiene la **estructura completa** del workflow:

```json
{
  "id": "workflow_1736872200000_abc123",
  "name": "Mi Workflow de Prueba",
  "version": "1.0",
  "createdAt": "2026-01-14T16:30:00.000Z",
  "updatedAt": "2026-01-14T16:45:00.000Z",
  "nodes": [
    {
      "id": "node_1",
      "type": "webhook",
      "position": {
        "x": 100,
        "y": 150
      },
      "properties": {
        "url": "/webhook/nexus-ai",
        "method": "POST",
        "authentication": false
      },
      "config": {
        "subtitle": "Recibe datos HTTP",
        "category": "input",
        "hasInput": false,
        "hasOutput": true,
        "color": "#3b82f6"
      }
    },
    {
      "id": "node_2",
      "type": "chatgpt",
      "position": {
        "x": 350,
        "y": 150
      },
      "properties": {
        "model": "gpt-4",
        "temperature": 0.7,
        "maxTokens": 1000,
        "systemPrompt": "Eres un asistente útil de Nexus AI"
      },
      "config": {
        "subtitle": "Procesamiento IA",
        "category": "processing",
        "hasInput": true,
        "hasOutput": true,
        "color": "#10b981"
      }
    }
  ],
  "connections": [
    {
      "id": "conn_1",
      "from": "node_1",
      "to": "node_2"
    }
  ],
  "settings": {
    "zoom": 1,
    "pan": {
      "x": 0,
      "y": 0
    },
    "nodeIdCounter": 2
  }
}
```

### ¿Qué se exporta?

| Elemento | ¿Se exporta? | Descripción |
|----------|--------------|-------------|
| **Nodos** | ✅ Sí | Todos los nodos con su tipo, posición y propiedades |
| **Conexiones** | ✅ Sí | Todas las conexiones entre nodos |
| **Propiedades** | ✅ Sí | Configuración completa de cada nodo |
| **Posiciones** | ✅ Sí | Coordenadas X,Y de cada nodo |
| **Zoom/Pan** | ✅ Sí | Estado de la vista del canvas |
| **Metadata** | ✅ Sí | ID, nombre, versión, fechas |

---

## 📥 IMPORTAR WORKFLOWS

### Método 1: Desde el Header (Recomendado)

1. Hacer click en el botón **"Importar"** (icono 📤) en el header
2. Seleccionar un archivo JSON válido
3. El workflow se carga automáticamente con el sufijo "(Importado)"

### Método 2: Drag & Drop (Futuro)

*Esta funcionalidad podría agregarse en futuras versiones*

### Validación Automática

Al importar, el sistema valida:

```javascript
// Validaciones realizadas:
1. ✅ Archivo JSON válido
2. ✅ Estructura de workflow correcta
3. ✅ Array de nodos existe
4. ✅ Array de conexiones existe
5. ✅ Propiedades requeridas presentes
```

### ¿Qué pasa al importar?

1. **Limpia el canvas actual** (sin confirmación)
2. **Genera nuevo ID único** para evitar conflictos
3. **Agrega sufijo "(Importado)"** al nombre
4. **Restaura todos los nodos** en sus posiciones
5. **Re-crea todas las conexiones**
6. **Restaura zoom y pan** al estado guardado
7. **Muestra toast de éxito** con el nombre

### Ejemplo de Importación

```javascript
// Resultado después de importar "Mi Workflow.json":
{
  id: "workflow_1736873000000_xyz789",  // ← Nuevo ID generado
  name: "Mi Workflow (Importado)",      // ← Sufijo agregado
  // ... resto de datos idénticos
}
```

---

## 🔧 CASOS DE USO

### 1. **Compartir Workflows con el Equipo**

```bash
# Usuario A exporta
1. Crear workflow en Nexus AI
2. Click en "Exportar"
3. Enviar archivo por email/Slack

# Usuario B importa
1. Recibir archivo JSON
2. Click en "Importar"
3. Seleccionar archivo
4. ✅ Workflow listo para usar
```

### 2. **Backup Manual de Workflows**

```bash
# Crear backup
1. Exportar workflow importante
2. Guardar en carpeta de backups
3. Opcional: Renombrar con fecha
   "CalificacionLeads_2026-01-14.json"

# Restaurar backup
1. Importar archivo JSON
2. Guardar con nombre original
```

### 3. **Versionado Manual**

```bash
# Sistema de versiones
workflows/
├── email-automation-v1.0.json
├── email-automation-v1.1.json
├── email-automation-v2.0.json
└── email-automation-latest.json

# Comparar versiones con diff
git diff v1.0.json v2.0.json
```

### 4. **Migración Entre Navegadores**

```bash
# Navegador A (Chrome)
1. Exportar todos los workflows
2. Guardar en carpeta

# Navegador B (Firefox)
1. Abrir Nexus AI
2. Importar cada workflow
3. Guardar con Ctrl+S
```

### 5. **Edición Manual Avanzada**

```javascript
// Editar JSON manualmente para:
- Cambiar posiciones masivamente
- Actualizar propiedades en lote
- Agregar configuraciones avanzadas
- Modificar conexiones

// Ejemplo: Mover todos los nodos 100px a la derecha
nodes.forEach(node => {
    node.position.x += 100;
});
```

---

## 🎨 FORMATO JSON DETALLADO

### Estructura Completa

```javascript
{
  // ==========================================
  // METADATA
  // ==========================================
  "id": "string",              // ID único del workflow
  "name": "string",            // Nombre descriptivo
  "version": "string",         // Versión del formato (actualmente "1.0")
  "createdAt": "ISO8601",      // Fecha de creación
  "updatedAt": "ISO8601",      // Fecha de última actualización
  
  // ==========================================
  // NODOS
  // ==========================================
  "nodes": [
    {
      "id": "string",          // ID único del nodo
      "type": "string",        // Tipo: webhook, chatgpt, slack, etc.
      "position": {
        "x": number,           // Posición X en canvas
        "y": number            // Posición Y en canvas
      },
      "properties": {          // Propiedades específicas del tipo
        // Varía según el tipo de nodo
      },
      "config": {              // Configuración del nodo
        "subtitle": "string",
        "category": "string",  // input, processing, output, integration
        "hasInput": boolean,
        "hasOutput": boolean,
        "color": "string"      // Color hex
      }
    }
  ],
  
  // ==========================================
  // CONEXIONES
  // ==========================================
  "connections": [
    {
      "id": "string",          // ID único de la conexión
      "from": "string",        // ID del nodo origen
      "to": "string"           // ID del nodo destino
    }
  ],
  
  // ==========================================
  // CONFIGURACIÓN DEL CANVAS
  // ==========================================
  "settings": {
    "zoom": number,            // Nivel de zoom (0.1 - 3.0)
    "pan": {
      "x": number,             // Desplazamiento horizontal
      "y": number              // Desplazamiento vertical
    },
    "nodeIdCounter": number    // Contador para generar IDs
  }
}
```

### Tipos de Nodos Soportados

```javascript
// ENTRADA (4 tipos)
"webhook"        // Recibe datos HTTP
"form"           // Captura formularios
"email-trigger"  // Detecta emails
"schedule"       // Ejecución programada

// PROCESAMIENTO (4 tipos)
"chatgpt"        // IA conversacional
"gemini"         // Google IA
"filter"         // Filtros condicionales
"transform"      // Transformación de datos

// SALIDA (4 tipos)
"email-send"     // Envío de emails
"slack"          // Mensajes Slack
"database"       // Base de datos
"api-call"       // Llamadas HTTP

// INTEGRACIONES (4 tipos)
"zapier"         // Zapier
"make"           // Make.com
"google-sheets"  // Google Sheets
"crm"            // Sistemas CRM

// COMUNICACIÓN (4 tipos)
"whatsapp"       // WhatsApp Business API
"telegram"       // Telegram Bot API
"twilio"         // Twilio SMS
"discord"        // Discord

// PAGOS (3 tipos)
"stripe"         // Stripe
"paypal"         // PayPal
"mercadopago"    // MercadoPago

// CLOUD (4 tipos)
"aws-s3"         // AWS S3
"firebase"       // Firebase
"mongodb"        // MongoDB
"supabase"       // Supabase

// ANALYTICS (3 tipos)
"google-analytics"  // Google Analytics
"mixpanel"          // Mixpanel
"segment"           // Segment
```

---

## ⚠️ LIMITACIONES Y CONSIDERACIONES

### Limitaciones Actuales

| Aspecto | Estado | Nota |
|---------|--------|------|
| **Tamaño de archivo** | ⚠️ No limitado | Navegadores pueden limitar descarga |
| **Formato** | ✅ Solo JSON | No soporta XML, YAML, etc. |
| **Compresión** | ❌ No | Archivos son texto plano |
| **Encriptación** | ❌ No | No hay encriptación de datos |
| **Validación avanzada** | ⚠️ Básica | Solo valida estructura mínima |
| **Versiones** | ⚠️ Manual | No hay gestión automática de versiones |

### Consideraciones de Seguridad

⚠️ **IMPORTANTE**: Los archivos JSON exportados contienen:
- Configuraciones de API
- Tokens y credenciales (si se guardaron)
- URLs de webhooks
- Datos sensibles en propiedades

**Recomendaciones**:
1. ✅ No compartir archivos con credenciales
2. ✅ Limpiar datos sensibles antes de exportar
3. ✅ Usar variables de entorno en producción
4. ✅ Revisar JSON antes de compartir públicamente

### Buenas Prácticas

```javascript
// ✅ BIEN: Workflow sin credenciales
{
  "properties": {
    "apiKey": "{{env.OPENAI_API_KEY}}",  // Variable de entorno
    "webhookUrl": "https://example.com/webhook"
  }
}

// ❌ MAL: Workflow con credenciales hardcoded
{
  "properties": {
    "apiKey": "sk-proj-abc123xyz...",  // ¡Cuidado!
    "password": "mi_password_secreto"  // ¡Nunca hacer esto!
  }
}
```

---

## 🧪 PRUEBAS Y VALIDACIÓN

### Test Manual de Exportación

```bash
1. Crear workflow con 3 nodos
2. Agregar 2 conexiones
3. Configurar propiedades en cada nodo
4. Click en "Exportar"
5. Verificar descarga de archivo JSON
6. Abrir archivo y verificar estructura
7. ✅ Validar que contiene todos los nodos
8. ✅ Validar que contiene todas las conexiones
```

### Test Manual de Importación

```bash
1. Exportar workflow existente
2. Limpiar canvas
3. Click en "Importar"
4. Seleccionar archivo exportado
5. ✅ Verificar que nodos aparecen en posiciones correctas
6. ✅ Verificar que conexiones se recrean
7. ✅ Verificar que propiedades se mantienen
8. ✅ Verificar que zoom/pan se restaura
```

### Validación de JSON

Puedes validar tu archivo JSON en:
- https://jsonlint.com/
- https://jsonformatter.org/
- Extensión de VS Code: "JSON Tools"

---

## 🔮 MEJORAS FUTURAS

### Próximas Características

1. **Exportación Selectiva**
   - Exportar solo nodos seleccionados
   - Exportar con/sin propiedades
   - Exportar plantillas (sin datos)

2. **Importación Inteligente**
   - Merge con workflow existente
   - Resolver conflictos de IDs
   - Preview antes de importar

3. **Formatos Adicionales**
   - Exportar como PNG/SVG (imagen)
   - Exportar como PDF (documentación)
   - Exportar como YAML
   - Exportar como código Python/JS

4. **Versionado Automático**
   - Sistema de versiones integrado
   - Historial de cambios
   - Diff visual entre versiones
   - Rollback a versión anterior

5. **Compartir Cloud**
   - Subir a cloud storage
   - Link de compartir público/privado
   - Marketplace de workflows
   - Templates comunitarios

6. **Compresión y Optimización**
   - Comprimir JSON con gzip
   - Minificar automáticamente
   - Optimizar tamaño de archivo

---

## 📚 RECURSOS ADICIONALES

### Documentación Relacionada

- `README.md` - Documentación general del proyecto
- `MEJORAS.md` - Plan de mejoras y roadmap
- `persistence-manager.js` - Código fuente de persistencia

### Ejemplos de Workflows

Próximamente se agregarán workflows de ejemplo en:
```
examples/
├── lead-qualification.json
├── customer-support.json
├── content-generation.json
└── data-pipeline.json
```

### Soporte

¿Problemas al exportar/importar?
1. Verificar que el workflow tiene nodos
2. Verificar permisos de descarga en navegador
3. Verificar formato JSON del archivo
4. Consultar consola del navegador (F12)
5. Abrir issue en GitHub

---

## ✅ CHECKLIST DE FUNCIONALIDAD

### Exportación
- [x] Botón "Exportar" visible en header
- [x] Click en botón inicia descarga
- [x] Archivo tiene nombre descriptivo con timestamp
- [x] JSON contiene estructura completa
- [x] JSON está correctamente formateado (pretty-print)
- [x] Toast de confirmación se muestra
- [x] Console log registra la acción

### Importación
- [x] Botón "Importar" visible en header
- [x] Click en botón abre selector de archivos
- [x] Input acepta solo archivos .json
- [x] Validación de estructura JSON
- [x] Nodos se recrean correctamente
- [x] Conexiones se recrean correctamente
- [x] Propiedades se mantienen
- [x] Posiciones se respetan
- [x] Nuevo ID se genera
- [x] Sufijo "(Importado)" se agrega
- [x] Toast de confirmación se muestra
- [x] Errores se manejan correctamente

---

**Última actualización**: 2026-01-14  
**Versión del documento**: 1.0  
**Autor**: Nexus AI Team
