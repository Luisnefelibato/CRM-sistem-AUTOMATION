# 🚀 Nexus AI - Demo Constructor de Automatizaciones

Un constructor visual e interactivo de flujos de automatización estilo n8n, desarrollado con la identidad visual de Nexus AI. Permite crear, conectar y ejecutar flujos de automatización de manera intuitiva mediante drag & drop.

## ✨ Características Implementadas

### 🎨 Interfaz Visual
- **Identidad Nexus AI**: Degradados azul-púrpura (#1e3a8a → #7c3aed → #0891b2)
- **Efecto Glass**: Interfaz moderna con backdrop-filter y transparencias
- **Partículas flotantes**: Elementos animados de fondo
- **Responsive Design**: Adaptable a dispositivos móviles y tablets
- **Animaciones suaves**: Transiciones y efectos visuales fluidos

### 🔧 Constructor de Flujos
- **Drag & Drop**: Arrastra nodos desde la toolbar al canvas
- **Conexiones visuales**: Conecta nodos con curvas SVG suavizadas
- **4 Categorías de nodos**:
  - **Entrada**: Webhook, Formulario, Email, Programador
  - **Procesamiento**: ChatGPT, Gemini AI, Filtros, Transformadores
  - **Salida**: Email, Slack, Base de datos, API calls
  - **Integraciones**: Zapier, Make, Google Sheets, CRM

### 🎛️ Panel de Propiedades
- **Configuración dinámica**: Cada nodo tiene propiedades editables
- **Tipos de campo**: Text, number, boolean, arrays
- **Información del nodo**: ID, tipo, categoría
- **Acciones**: Duplicar, eliminar nodos

### 🔗 Sistema de Conexiones
- **Conexión visual**: Arrastra desde puerto de salida a entrada
- **Validaciones**: Previene conexiones inválidas
- **Curvas SVG**: Líneas conectoras con degradado Nexus AI
- **Gestión**: Click para eliminar conexiones

### 📊 Estadísticas en Tiempo Real
- **Contador de nodos**: Nodos activos en el flujo
- **Contador de conexiones**: Conexiones establecidas
- **Estado del flujo**: Vacío, Sin conexiones, Listo, Ejecutando

### 🎭 Ejemplos Predefinidos
1. **Calificación de Leads**: Formulario → IA → CRM
2. **Soporte al Cliente**: Email → ChatGPT → Respuesta automática
3. **Generación de Contenido**: Programador → IA → Redes sociales
4. **Análisis de Datos**: Webhook → Filtros → Dashboard

### 🛠️ Funcionalidades Avanzadas
- **Zoom y Pan**: Control de vista del canvas
- **Ajustar a pantalla**: Centrado automático
- **Ejecución simulada**: Animación de flujo ejecutándose
- **Teclado shortcuts**: Delete (eliminar), Escape (cancelar), Ctrl+/Ctrl-
- **Menú contextual**: Click derecho en nodos
- **Notificaciones toast**: Feedback visual de acciones

## 🚦 Rutas Funcionales

### Página Principal
- **Ruta**: `/` (index.html)
- **Función**: Constructor principal de automatizaciones
- **Componentes**:
  - Toolbar con nodos arrastrables
  - Canvas con grid pattern
  - Panel de propiedades lateral
  - Modal de ejemplos predefinidos

### Recursos
- **CSS**: `/css/style.css` - Estilos con identidad Nexus AI
- **JavaScript**: `/js/automation-builder.js` - Lógica del constructor
- **Fuentes**: Google Fonts (Inter)
- **Iconos**: Font Awesome 6.4.0

## 🎯 Tecnologías Integradas

### APIs y Servicios Soportados
- **IA Generativa**: ChatGPT, Google Gemini
- **Comunicación**: Email (SMTP), Slack
- **Almacenamiento**: Bases de datos, Google Sheets
- **Automatización**: Zapier, Make.com
- **Webhooks**: Entrada y salida de datos
- **CRM**: HubSpot, Salesforce, sistemas personalizados

### Nodos Disponibles (16 tipos)
#### Entrada (4)
- Webhook - Recibe datos HTTP
- Formulario - Captura datos web
- Email Trigger - Detecta correos
- Programador - Ejecución temporal

#### Procesamiento (4)
- ChatGPT - IA conversacional
- Gemini - Google IA
- Filtro - Condicionales
- Transformar - Mapeo de datos

#### Salida (4)
- Enviar Email - SMTP automático
- Slack - Mensajes al equipo
- Base Datos - Persistencia
- API Call - Llamadas HTTP

#### Integraciones (4)
- Zapier - Ecosistema Zapier
- Make - Plataforma Make.com
- Google Sheets - Hojas cálculo
- CRM - Gestión clientes

## 🚧 Funcionalidades No Implementadas

### Próximas Características
- **Guardado de flujos**: Persistencia en localStorage/backend
- **Exportación**: JSON, imagen, código
- **Plantillas avanzadas**: Más ejemplos predefinidos
- **Validación de flujos**: Análisis de errores
- **Logs de ejecución**: Historial y debugging
- **Autenticación**: Login de usuarios
- **Colaboración**: Edición compartida
- **Versionado**: Control de cambios

### Integraciones Pendientes
- **Más APIs**: WhatsApp, Telegram, Discord
- **Blockchain**: Web3, smart contracts
- **IoT**: Sensores, dispositivos conectados
- **ML/AI**: Modelos personalizados
- **Análisis**: Google Analytics, Mixpanel

## 🚀 Próximos Pasos Recomendados

1. **Backend API**: Crear servidor para persistencia y ejecución real
2. **Autenticación**: Sistema de usuarios y proyectos
3. **Marketplace**: Tienda de nodos y plantillas
4. **Monitoring**: Dashboard de flujos activos
5. **SDK**: Kit de desarrollo para nodos personalizados
6. **Mobile App**: Versión para dispositivos móviles
7. **AI Assistant**: Chatbot para ayuda en construcción
8. **Enterprise**: Funciones para equipos grandes

## 🎨 Identidad Visual Nexus AI

### Colores Principales
```css
--nexus-blue: #1e3a8a
--nexus-purple: #7c3aed  
--nexus-cyan: #0891b2
--nexus-gradient: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #0891b2 100%)
```

### Tipografía
- **Fuente**: Inter (Google Fonts)
- **Pesos**: 300, 400, 500, 600, 700, 800

### Efectos
- **Glass morphism**: backdrop-filter: blur(20px)
- **Sombras**: 0 25px 50px -12px rgba(0, 0, 0, 0.5)
- **Animaciones**: ease-in-out, 0.3s duration

## 🔧 Instalación y Uso

### Requisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Conexión a internet (CDNs)

### Ejecución Local
1. Abrir `index.html` en navegador
2. Arrastar nodos desde toolbar al canvas
3. Conectar puertos de salida con entrada
4. Configurar propiedades en panel lateral
5. Ejecutar flujo con botón "Ejecutar"

### Ejemplo de Flujo Básico
1. Arrastrar "Formulario" al canvas
2. Arrastrar "ChatGPT" junto al formulario
3. Conectar salida del formulario con entrada de ChatGPT
4. Configurar prompt en propiedades de ChatGPT
5. Ejecutar para ver simulación

---

**Desarrollado por**: Nexus AI Team  
**Versión**: 1.0.0  
**Fecha**: 2024  
**Licencia**: MIT  

🌟 *La Creatividad Mueve el Mundo; la Tecnología lo Acelera.*