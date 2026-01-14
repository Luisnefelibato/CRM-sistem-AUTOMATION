# 📁 Workflows de Ejemplo

Esta carpeta contiene workflows de ejemplo listos para importar en Nexus AI Automation Builder.

## 🚀 Cómo usar estos ejemplos

1. **Descargar el archivo JSON** que desees probar
2. Abrir Nexus AI Automation Builder en tu navegador
3. Click en el botón **"Importar"** (📤) en el header
4. Seleccionar el archivo JSON descargado
5. ¡El workflow se cargará automáticamente!

## 📋 Workflows Disponibles

### 1. 🎯 Calificación Automática de Leads
**Archivo**: `lead-qualification.json`

**Descripción**: Sistema automático para calificar leads de formularios web usando IA.

**Flujo**:
```
Formulario Web → ChatGPT (Calificación) → Filtro (Score ≥8) → Slack (Hot Leads)
                                        ↓
                                       CRM → Email Bienvenida
```

**Nodos**: 6  
**Conexiones**: 5  
**Categorías**: Input, Processing, Integration, Output  

**Características**:
- ✅ Captura de leads desde formulario
- ✅ Análisis con IA (GPT-4)
- ✅ Calificación automática (1-10)
- ✅ Notificación a equipo de ventas (Slack)
- ✅ Creación automática en CRM
- ✅ Email de bienvenida automatizado

**Ideal para**:
- Equipos de ventas
- Marketing automation
- Lead generation
- Calificación de prospectos

---

### 2. 🛒 Sistema de Notificaciones E-commerce
**Archivo**: `ecommerce-notifications.json`

**Descripción**: Sistema completo de notificaciones multi-canal para ventas online.

**Flujo**:
```
Stripe Webhook → Transform → Firebase
                           ↓
                          Email → Slack
                           ↓
                        WhatsApp → Google Sheets → Analytics
```

**Nodos**: 8  
**Conexiones**: 7  
**Categorías**: Integration, Processing, Communication, Output  

**Características**:
- ✅ Detección de pagos (Stripe)
- ✅ Almacenamiento en Firebase
- ✅ Email de confirmación
- ✅ Notificación WhatsApp al cliente
- ✅ Alerta a equipo (Slack)
- ✅ Registro en Google Sheets
- ✅ Tracking en Analytics

**Ideal para**:
- Tiendas online
- E-commerce
- SaaS con pagos
- Negocios digitales

---

## 🔧 Configuración Requerida

### Variables de Entorno

Estos workflows usan variables de entorno para credenciales. Reemplaza los placeholders con tus valores reales:

```javascript
// Stripe
{{env.STRIPE_WEBHOOK_SECRET}}
{{env.STRIPE_API_KEY}}

// Firebase
{{env.FIREBASE_PROJECT_ID}}
{{env.FIREBASE_CREDENTIALS}}

// WhatsApp Business
{{env.WHATSAPP_PHONE_ID}}
{{env.WHATSAPP_ACCESS_TOKEN}}

// Google Services
{{env.GOOGLE_CREDENTIALS}}
{{env.GSHEETS_SALES_ID}}
{{env.GA_MEASUREMENT_ID}}
{{env.GA_API_SECRET}}

// OpenAI
{{env.OPENAI_API_KEY}}
```

### Cómo configurar

1. **Importar el workflow**
2. **Seleccionar cada nodo** que use variables de entorno
3. **Reemplazar** `{{env.VARIABLE}}` con tu valor real
4. **Guardar** el workflow modificado

## 📝 Personalización

### Modificar un workflow existente

1. Importar el workflow
2. Agregar, eliminar o modificar nodos
3. Ajustar conexiones
4. Configurar propiedades específicas
5. Guardar con nuevo nombre
6. (Opcional) Exportar para compartir

### Crear workflow desde template

1. Importar un workflow similar
2. Eliminar nodos no necesarios
3. Agregar nodos específicos
4. Configurar desde cero
5. Guardar como nuevo workflow

## 🎨 Próximos Ejemplos

Workflows planeados para agregar:

- [ ] **Customer Support Bot** - WhatsApp + IA
- [ ] **Content Generation** - Programador + IA + Redes Sociales
- [ ] **Data Pipeline** - API → Transform → Database + Analytics
- [ ] **Monitoring Alerts** - Schedule → API → Telegram + Discord
- [ ] **Invoice Automation** - Form → PDF → Email + Storage
- [ ] **Social Media Manager** - Schedule → IA → Multi-platform posting
- [ ] **Survey Analysis** - Form → IA → Sheets + Visualization
- [ ] **Payment Reminders** - Schedule → Database → Email + SMS

## 🤝 Contribuir

¿Tienes un workflow útil? ¡Compártelo!

1. Exportar tu workflow a JSON
2. Limpiar credenciales sensibles
3. Reemplazar con variables de entorno
4. Agregar descripción
5. Enviar PR al repositorio

## 📚 Recursos

- **Documentación completa**: `../EXPORT_IMPORT_GUIDE.md`
- **Guía de nodos**: `../README.md`
- **Mejoras planeadas**: `../MEJORAS.md`

## ⚠️ Notas de Seguridad

- ❌ **NO incluir** API keys reales en los ejemplos
- ✅ **SÍ usar** variables de entorno: `{{env.VARIABLE}}`
- ✅ **SÍ limpiar** datos sensibles antes de exportar
- ✅ **SÍ documentar** qué credenciales se necesitan

## 🎯 Casos de Uso

### Para Aprender
- Estudiar estructura de workflows
- Entender conexiones entre nodos
- Ver configuraciones reales
- Experimentar sin empezar de cero

### Para Producción
- Template base para proyectos
- Acelerar desarrollo
- Best practices incorporadas
- Patrones probados

### Para Compartir
- Documentar procesos
- Estandarizar workflows en equipo
- Crear biblioteca interna
- Onboarding de nuevos usuarios

---

**¿Preguntas o problemas?**

Abre un issue en GitHub o consulta la documentación completa.

**Última actualización**: 2026-01-14  
**Workflows incluidos**: 2  
**Más ejemplos**: Próximamente
