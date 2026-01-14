/**
 * Nexus AI - Automation Builder
 * Advanced drag & drop workflow builder with visual connections
 */

class AutomationBuilder {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
        this.selectedNode = null;
        this.draggedNode = null;
        this.isConnecting = false;
        this.connectionStart = null;
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.nodeIdCounter = 0;
        
        // Canvas elements
        this.canvas = document.getElementById('flowCanvas');
        this.svg = document.getElementById('connectionsSvg');
        this.dropZoneHint = document.querySelector('.drop-zone-hint');
        
        // UI elements
        this.propertiesPanel = document.getElementById('propertiesPanel');
        this.nodeCountEl = document.getElementById('nodeCount');
        this.connectionCountEl = document.getElementById('connectionCount');
        this.flowStatusEl = document.getElementById('flowStatus');
        this.toastContainer = document.getElementById('toastContainer');
        
        // Initialize persistence manager
        this.persistence = new PersistenceManager(this);
        
        // Initialize the builder
        this.init();
    }

    init() {
        console.log('🚀 Inicializando Nexus AI Automation Builder...');
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupCanvas();
        this.setupPersistenceUI();
        this.setupNodeSearch();
        this.updateStats();
        
        // Start auto-save
        this.persistence.startAutoSave();
        
        this.showToast('¡Bienvenido a Nexus AI!', 'success');
        console.log('✅ Automation Builder inicializado correctamente');
    }

    /**
     * Sanitize icon class to prevent XSS attacks
     * Only allows Font Awesome classes (fas, fab, far, fal, fad) followed by fa-*
     */
    sanitizeIconClass(iconClass) {
        if (!iconClass || typeof iconClass !== 'string') {
            return 'fas fa-cube'; // Default safe icon
        }
        // Only allow valid Font Awesome class patterns
        const validPattern = /^(fas|fab|far|fal|fad)\s+fa-[a-z0-9-]+$/i;
        if (validPattern.test(iconClass.trim())) {
            return iconClass.trim();
        }
        return 'fas fa-cube'; // Fallback to safe default
    }

    /**
     * Sanitize text content to prevent XSS (for cases where we need HTML entities)
     */
    sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('saveWorkflow')?.addEventListener('click', () => this.showSaveModal());
        document.getElementById('loadWorkflow')?.addEventListener('click', () => this.showLoadModal());
        document.getElementById('exportWorkflow')?.addEventListener('click', () => this.exportWorkflow());
        document.getElementById('importWorkflow')?.addEventListener('click', () => this.importWorkflow());
        document.getElementById('loadExampleFlow')?.addEventListener('click', () => this.showExamples());
        document.getElementById('clearCanvas')?.addEventListener('click', () => this.clearCanvas());
        
        // Canvas controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomCanvas(1.2));
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomCanvas(0.8));
        document.getElementById('fitToScreen')?.addEventListener('click', () => this.fitToScreen());
        document.getElementById('runFlow')?.addEventListener('click', () => this.runFlow());
        
        // Modal controls
        document.getElementById('closeModal')?.addEventListener('click', () => this.hideExamples());
        document.getElementById('exampleModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'exampleModal') this.hideExamples();
        });
        
        // Properties panel
        document.getElementById('closePanel')?.addEventListener('click', () => this.hideProperties());
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Example card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.example-card')) {
                const example = e.target.closest('.example-card').dataset.example;
                this.loadExample(example);
                this.hideExamples();
            }
        });
    }

    setupDragAndDrop() {
        // Node templates drag start
        document.querySelectorAll('.node-template').forEach(template => {
            template.addEventListener('dragstart', (e) => {
                this.draggedNode = {
                    type: template.dataset.type,
                    icon: template.querySelector('i').className,
                    title: template.querySelector('span').textContent,
                    template: template
                };
                
                // Visual feedback
                template.style.opacity = '0.5';
                
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', template.dataset.type);
            });
            
            template.addEventListener('dragend', () => {
                template.style.opacity = '1';
                this.draggedNode = null;
            });
        });
        
        // Canvas drop zone
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.canvas.style.borderColor = 'var(--nexus-purple)';
        });
        
        this.canvas.addEventListener('dragleave', () => {
            this.canvas.style.borderColor = 'var(--glass-border)';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.style.borderColor = 'var(--glass-border)';
            
            if (!this.draggedNode) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.createNode(this.draggedNode, x, y);
        });
    }

    setupCanvas() {
        // Make canvas resizable
        this.resizeCanvas();
        
        // Hide drop zone hint when nodes exist
        this.updateDropZoneHint();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.svg.setAttribute('width', rect.width);
        this.svg.setAttribute('height', rect.height);
    }

    createNode(nodeData, x, y) {
        const nodeId = `node_${++this.nodeIdCounter}`;
        
        const nodeElement = document.createElement('div');
        nodeElement.className = 'flow-node';
        nodeElement.dataset.nodeId = nodeId;
        nodeElement.dataset.nodeType = nodeData.type;
        
        // Position the node
        nodeElement.style.left = `${x - 80}px`;
        nodeElement.style.top = `${y - 50}px`;
        
        // Node configuration
        const config = this.getNodeConfig(nodeData.type);

        // Build node DOM safely (XSS protection)
        const header = document.createElement('div');
        header.className = 'flow-node-header';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'flow-node-icon';
        const icon = document.createElement('i');
        // Validate icon class to prevent XSS
        const safeIconClass = this.sanitizeIconClass(nodeData.icon);
        icon.className = safeIconClass;
        iconContainer.appendChild(icon);

        const textContainer = document.createElement('div');
        const titleEl = document.createElement('div');
        titleEl.className = 'flow-node-title';
        titleEl.textContent = nodeData.title; // Safe: textContent escapes HTML
        const subtitleEl = document.createElement('div');
        subtitleEl.className = 'flow-node-subtitle';
        subtitleEl.textContent = config.subtitle; // Safe: textContent escapes HTML
        textContainer.appendChild(titleEl);
        textContainer.appendChild(subtitleEl);

        header.appendChild(iconContainer);
        header.appendChild(textContainer);

        const ports = document.createElement('div');
        ports.className = 'flow-node-ports';

        if (config.hasInput) {
            const inputPort = document.createElement('div');
            inputPort.className = 'node-port input';
            inputPort.dataset.port = 'input';
            ports.appendChild(inputPort);
        } else {
            ports.appendChild(document.createElement('div'));
        }

        if (config.hasOutput) {
            const outputPort = document.createElement('div');
            outputPort.className = 'node-port output';
            outputPort.dataset.port = 'output';
            ports.appendChild(outputPort);
        } else {
            ports.appendChild(document.createElement('div'));
        }

        nodeElement.appendChild(header);
        nodeElement.appendChild(ports);
        
        // Add event listeners
        this.setupNodeEvents(nodeElement);
        
        // Add to canvas and store
        this.canvas.appendChild(nodeElement);
        this.nodes.set(nodeId, {
            id: nodeId,
            type: nodeData.type,
            element: nodeElement,
            config: config,
            position: { x: x - 80, y: y - 50 },
            properties: { ...config.defaultProperties }
        });
        
        // Update UI
        this.updateStats();
        this.updateDropZoneHint();
        this.showToast(`Nodo "${nodeData.title}" añadido`, 'success');
        
        // Mark as changed for auto-save
        this.markAsChanged();
        
        // Auto-select new node
        this.selectNode(nodeElement);
        
        console.log(`✨ Nodo creado: ${nodeData.title} (${nodeId})`);
    }

    getNodeConfig(type) {
        const configs = {
            // Input nodes
            webhook: {
                subtitle: 'Recibe datos HTTP',
                category: 'input',
                hasInput: false,
                hasOutput: true,
                color: '#3b82f6',
                defaultProperties: {
                    url: '/webhook/nexus-ai',
                    method: 'POST',
                    authentication: false
                }
            },
            form: {
                subtitle: 'Captura formularios',
                category: 'input',
                hasInput: false,
                hasOutput: true,
                color: '#06b6d4',
                defaultProperties: {
                    formName: 'Contacto',
                    fields: ['nombre', 'email', 'mensaje'],
                    validation: true
                }
            },
            'email-trigger': {
                subtitle: 'Detecta emails',
                category: 'input',
                hasInput: false,
                hasOutput: true,
                color: '#8b5cf6',
                defaultProperties: {
                    provider: 'Gmail',
                    folder: 'Inbox',
                    filters: []
                }
            },
            schedule: {
                subtitle: 'Ejecuta por tiempo',
                category: 'input',
                hasInput: false,
                hasOutput: true,
                color: '#f59e0b',
                defaultProperties: {
                    frequency: 'daily',
                    time: '09:00',
                    timezone: 'America/Bogota'
                }
            },
            
            // Processing nodes
            chatgpt: {
                subtitle: 'Procesamiento IA',
                category: 'processing',
                hasInput: true,
                hasOutput: true,
                color: '#10b981',
                defaultProperties: {
                    model: 'gpt-4',
                    temperature: 0.7,
                    maxTokens: 1000,
                    systemPrompt: 'Eres un asistente útil de Nexus AI'
                }
            },
            gemini: {
                subtitle: 'Google Gemini IA',
                category: 'processing',
                hasInput: true,
                hasOutput: true,
                color: '#3b82f6',
                defaultProperties: {
                    model: 'gemini-pro',
                    temperature: 0.7,
                    safetySettings: 'high'
                }
            },
            filter: {
                subtitle: 'Filtra datos',
                category: 'processing',
                hasInput: true,
                hasOutput: true,
                color: '#6366f1',
                defaultProperties: {
                    conditions: [],
                    operator: 'AND',
                    action: 'continue'
                }
            },
            transform: {
                subtitle: 'Transforma datos',
                category: 'processing',
                hasInput: true,
                hasOutput: true,
                color: '#8b5cf6',
                defaultProperties: {
                    mappings: {},
                    format: 'json'
                }
            },
            
            // Output nodes
            'email-send': {
                subtitle: 'Envía emails',
                category: 'output',
                hasInput: true,
                hasOutput: false,
                color: '#ef4444',
                defaultProperties: {
                    provider: 'SMTP',
                    template: 'default',
                    bcc: false
                }
            },
            slack: {
                subtitle: 'Mensaje Slack',
                category: 'output',
                hasInput: true,
                hasOutput: false,
                color: '#4ade80',
                defaultProperties: {
                    channel: '#general',
                    username: 'Nexus AI',
                    icon: ':robot_face:'
                }
            },
            database: {
                subtitle: 'Guarda en DB',
                category: 'output',
                hasInput: true,
                hasOutput: false,
                color: '#06b6d4',
                defaultProperties: {
                    connection: 'default',
                    table: 'automation_data',
                    operation: 'insert'
                }
            },
            'api-call': {
                subtitle: 'Llamada API',
                category: 'output',
                hasInput: true,
                hasOutput: true,
                color: '#f97316',
                defaultProperties: {
                    url: '',
                    method: 'POST',
                    headers: {},
                    timeout: 30000
                }
            },
            
            // Integration nodes
            zapier: {
                subtitle: 'Conecta Zapier',
                category: 'integration',
                hasInput: true,
                hasOutput: true,
                color: '#ff6b35',
                defaultProperties: {
                    zapId: '',
                    trigger: 'webhook'
                }
            },
            make: {
                subtitle: 'Conecta Make.com',
                category: 'integration',
                hasInput: true,
                hasOutput: true,
                color: '#7c3aed',
                defaultProperties: {
                    scenarioId: '',
                    webhookUrl: ''
                }
            },
            'google-sheets': {
                subtitle: 'Google Sheets',
                category: 'integration',
                hasInput: true,
                hasOutput: true,
                color: '#22c55e',
                defaultProperties: {
                    spreadsheetId: '',
                    sheetName: 'Datos',
                    operation: 'append'
                }
            },
            crm: {
                subtitle: 'Sistema CRM',
                category: 'integration',
                hasInput: true,
                hasOutput: true,
                color: '#6366f1',
                defaultProperties: {
                    system: 'HubSpot',
                    action: 'create_contact',
                    pipeline: 'sales'
                }
            },

            // Communication APIs
            whatsapp: {
                subtitle: 'WhatsApp Business API',
                category: 'communication',
                hasInput: true,
                hasOutput: true,
                color: '#25D366',
                defaultProperties: {
                    provider: 'Meta Cloud API',
                    phoneNumberId: '',
                    accessToken: '',
                    messageType: 'text',
                    templateName: '',
                    recipientPhone: ''
                }
            },
            telegram: {
                subtitle: 'Telegram Bot API',
                category: 'communication',
                hasInput: true,
                hasOutput: true,
                color: '#0088cc',
                defaultProperties: {
                    botToken: '',
                    chatId: '',
                    parseMode: 'HTML',
                    messageType: 'text',
                    disableNotification: false
                }
            },
            twilio: {
                subtitle: 'SMS & Voice',
                category: 'communication',
                hasInput: true,
                hasOutput: true,
                color: '#F22F46',
                defaultProperties: {
                    accountSid: '',
                    authToken: '',
                    fromNumber: '',
                    toNumber: '',
                    messageType: 'sms'
                }
            },
            discord: {
                subtitle: 'Discord Webhook',
                category: 'communication',
                hasInput: true,
                hasOutput: false,
                color: '#5865F2',
                defaultProperties: {
                    webhookUrl: '',
                    username: 'Nexus AI Bot',
                    avatarUrl: '',
                    embedColor: '#7c3aed',
                    mentionRole: ''
                }
            },

            // Payment APIs
            stripe: {
                subtitle: 'Procesador de Pagos',
                category: 'payments',
                hasInput: true,
                hasOutput: true,
                color: '#635BFF',
                defaultProperties: {
                    secretKey: '',
                    webhookSecret: '',
                    action: 'create_payment_intent',
                    currency: 'usd',
                    amount: 0,
                    customerEmail: ''
                }
            },
            paypal: {
                subtitle: 'PayPal Checkout',
                category: 'payments',
                hasInput: true,
                hasOutput: true,
                color: '#003087',
                defaultProperties: {
                    clientId: '',
                    clientSecret: '',
                    environment: 'sandbox',
                    action: 'create_order',
                    currency: 'USD'
                }
            },
            mercadopago: {
                subtitle: 'MercadoPago API',
                category: 'payments',
                hasInput: true,
                hasOutput: true,
                color: '#00B1EA',
                defaultProperties: {
                    accessToken: '',
                    action: 'create_preference',
                    currency: 'COP',
                    notificationUrl: ''
                }
            },

            // Cloud & Storage APIs
            'aws-s3': {
                subtitle: 'Amazon S3 Storage',
                category: 'cloud',
                hasInput: true,
                hasOutput: true,
                color: '#FF9900',
                defaultProperties: {
                    accessKeyId: '',
                    secretAccessKey: '',
                    region: 'us-east-1',
                    bucket: '',
                    action: 'upload',
                    acl: 'private'
                }
            },
            firebase: {
                subtitle: 'Firebase/Firestore',
                category: 'cloud',
                hasInput: true,
                hasOutput: true,
                color: '#FFCA28',
                defaultProperties: {
                    projectId: '',
                    serviceAccount: '',
                    collection: '',
                    action: 'add_document',
                    documentId: ''
                }
            },
            mongodb: {
                subtitle: 'MongoDB Atlas',
                category: 'cloud',
                hasInput: true,
                hasOutput: true,
                color: '#47A248',
                defaultProperties: {
                    connectionString: '',
                    database: '',
                    collection: '',
                    action: 'insertOne',
                    query: {}
                }
            },
            supabase: {
                subtitle: 'Supabase Backend',
                category: 'cloud',
                hasInput: true,
                hasOutput: true,
                color: '#3ECF8E',
                defaultProperties: {
                    projectUrl: '',
                    anonKey: '',
                    table: '',
                    action: 'insert',
                    filters: []
                }
            },

            // Analytics APIs
            'google-analytics': {
                subtitle: 'GA4 Events',
                category: 'analytics',
                hasInput: true,
                hasOutput: false,
                color: '#E37400',
                defaultProperties: {
                    measurementId: '',
                    apiSecret: '',
                    eventName: '',
                    eventParams: {}
                }
            },
            mixpanel: {
                subtitle: 'Mixpanel Analytics',
                category: 'analytics',
                hasInput: true,
                hasOutput: false,
                color: '#7856FF',
                defaultProperties: {
                    projectToken: '',
                    eventName: '',
                    distinctId: '',
                    properties: {}
                }
            },
            segment: {
                subtitle: 'Segment CDP',
                category: 'analytics',
                hasInput: true,
                hasOutput: true,
                color: '#52BD95',
                defaultProperties: {
                    writeKey: '',
                    eventType: 'track',
                    eventName: '',
                    userId: '',
                    traits: {}
                }
            }
        };

        return configs[type] || {
            subtitle: 'Nodo personalizado',
            category: 'custom',
            hasInput: true,
            hasOutput: true,
            color: '#64748b',
            defaultProperties: {}
        };
    }

    setupNodeEvents(nodeElement) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        // Node selection
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(nodeElement);
        });
        
        // Node dragging
        nodeElement.addEventListener('mousedown', (e) => {
            if (e.target.closest('.node-port')) return;
            
            isDragging = true;
            const rect = nodeElement.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            nodeElement.style.cursor = 'grabbing';
            nodeElement.style.zIndex = '100';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const canvasRect = this.canvas.getBoundingClientRect();
            const x = e.clientX - canvasRect.left - dragOffset.x;
            const y = e.clientY - canvasRect.top - dragOffset.y;
            
            nodeElement.style.left = `${x}px`;
            nodeElement.style.top = `${y}px`;
            
            // Update stored position
            const nodeId = nodeElement.dataset.nodeId;
            const node = this.nodes.get(nodeId);
            if (node) {
                node.position = { x, y };
            }
            
            // Update connections
            this.updateConnections();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                nodeElement.style.cursor = 'move';
                nodeElement.style.zIndex = '10';
            }
        });
        
        // Port connection events
        const ports = nodeElement.querySelectorAll('.node-port');
        ports.forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startConnection(nodeElement, port);
            });
            
            port.addEventListener('mouseenter', () => {
                if (this.isConnecting) {
                    port.style.background = 'var(--nexus-cyan)';
                    port.style.borderColor = 'var(--nexus-cyan)';
                    port.style.transform = 'scale(1.3)';
                }
            });
            
            port.addEventListener('mouseleave', () => {
                if (this.isConnecting) {
                    port.style.background = '';
                    port.style.borderColor = '';
                    port.style.transform = '';
                }
            });
            
            port.addEventListener('mouseup', (e) => {
                if (this.isConnecting) {
                    e.stopPropagation();
                    this.endConnection(nodeElement, port);
                }
            });
        });
        
        // Context menu (delete node)
        nodeElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showNodeContextMenu(nodeElement, e.clientX, e.clientY);
        });
    }

    selectNode(nodeElement) {
        // Remove previous selection
        document.querySelectorAll('.flow-node.selected').forEach(node => {
            node.classList.remove('selected');
        });
        
        // Select new node
        nodeElement.classList.add('selected');
        this.selectedNode = nodeElement;
        
        // Show properties
        this.showNodeProperties(nodeElement);
    }

    showNodeProperties(nodeElement) {
        const nodeId = nodeElement.dataset.nodeId;
        const node = this.nodes.get(nodeId);

        if (!node) return;

        const panelContent = this.propertiesPanel.querySelector('.panel-content');
        panelContent.innerHTML = ''; // Clear safely

        // Build properties panel DOM safely
        const wrapper = document.createElement('div');
        wrapper.className = 'node-properties';

        // Header
        const header = document.createElement('div');
        header.className = 'property-header';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'property-icon';
        const iconEl = document.createElement('i');
        const originalIcon = nodeElement.querySelector('.flow-node-icon i');
        iconEl.className = originalIcon ? this.sanitizeIconClass(originalIcon.className) : 'fas fa-cube';
        iconDiv.appendChild(iconEl);

        const headerText = document.createElement('div');
        const titleH4 = document.createElement('h4');
        titleH4.textContent = nodeElement.querySelector('.flow-node-title')?.textContent || 'Nodo';
        const subtitleP = document.createElement('p');
        subtitleP.textContent = nodeElement.querySelector('.flow-node-subtitle')?.textContent || '';
        headerText.appendChild(titleH4);
        headerText.appendChild(subtitleP);

        header.appendChild(iconDiv);
        header.appendChild(headerText);
        wrapper.appendChild(header);

        // Sections container
        const sections = document.createElement('div');
        sections.className = 'property-sections';

        // Configuration section
        const configSection = document.createElement('div');
        configSection.className = 'property-section';
        const configTitle = document.createElement('h5');
        configTitle.innerHTML = '<i class="fas fa-cog"></i> Configuración';
        const configFields = document.createElement('div');
        configFields.className = 'property-fields';
        this.generatePropertyFieldsSafe(node, configFields);
        configSection.appendChild(configTitle);
        configSection.appendChild(configFields);
        sections.appendChild(configSection);

        // Info section
        const infoSection = document.createElement('div');
        infoSection.className = 'property-section';
        const infoTitle = document.createElement('h5');
        infoTitle.innerHTML = '<i class="fas fa-info-circle"></i> Información';
        const infoContainer = document.createElement('div');
        infoContainer.className = 'property-info';

        const infoItems = [
            { label: 'ID:', value: nodeId },
            { label: 'Tipo:', value: node.type },
            { label: 'Categoría:', value: node.config.category }
        ];

        infoItems.forEach(item => {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            const span = document.createElement('span');
            span.textContent = item.label;
            const code = document.createElement('code');
            code.textContent = item.value;
            infoItem.appendChild(span);
            infoItem.appendChild(code);
            infoContainer.appendChild(infoItem);
        });

        infoSection.appendChild(infoTitle);
        infoSection.appendChild(infoContainer);
        sections.appendChild(infoSection);

        // Actions section
        const actionsSection = document.createElement('div');
        actionsSection.className = 'property-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'property-btn danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar Nodo';
        deleteBtn.addEventListener('click', () => this.deleteNode(nodeId));

        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'property-btn';
        duplicateBtn.innerHTML = '<i class="fas fa-copy"></i> Duplicar';
        duplicateBtn.addEventListener('click', () => this.duplicateNode(nodeId));

        actionsSection.appendChild(deleteBtn);
        actionsSection.appendChild(duplicateBtn);
        sections.appendChild(actionsSection);

        wrapper.appendChild(sections);
        panelContent.appendChild(wrapper);
    }

    /**
     * Generate property fields safely using DOM methods
     */
    generatePropertyFieldsSafe(node, container) {
        for (const [key, value] of Object.entries(node.properties)) {
            const fieldId = `prop_${node.id}_${key}`;
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'property-field';

            const label = document.createElement('label');
            label.setAttribute('for', fieldId);
            label.textContent = this.formatPropertyName(key);
            fieldDiv.appendChild(label);

            if (typeof value === 'boolean') {
                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'checkbox-container';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = fieldId;
                checkbox.checked = value;
                checkbox.addEventListener('change', () => {
                    this.updateNodeProperty(node.id, key, checkbox.checked);
                });
                const checkboxCustom = document.createElement('span');
                checkboxCustom.className = 'checkbox-custom';
                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(checkboxCustom);
                fieldDiv.appendChild(checkboxContainer);
            } else if (typeof value === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.id = fieldId;
                input.value = value;
                input.addEventListener('change', () => {
                    this.updateNodeProperty(node.id, key, parseFloat(input.value));
                });
                fieldDiv.appendChild(input);
            } else if (Array.isArray(value)) {
                const textarea = document.createElement('textarea');
                textarea.id = fieldId;
                textarea.rows = 3;
                textarea.value = value.join(', ');
                textarea.addEventListener('change', () => {
                    this.updateNodeProperty(node.id, key, textarea.value.split(',').map(s => s.trim()));
                });
                const small = document.createElement('small');
                small.textContent = 'Separar elementos con comas';
                fieldDiv.appendChild(textarea);
                fieldDiv.appendChild(small);
            } else if (typeof value === 'object' && value !== null) {
                const textarea = document.createElement('textarea');
                textarea.id = fieldId;
                textarea.rows = 4;
                textarea.value = JSON.stringify(value, null, 2);
                textarea.addEventListener('change', () => {
                    try {
                        this.updateNodeProperty(node.id, key, JSON.parse(textarea.value));
                    } catch (e) {
                        console.warn('Invalid JSON:', e);
                    }
                });
                const small = document.createElement('small');
                small.textContent = 'Formato JSON';
                fieldDiv.appendChild(textarea);
                fieldDiv.appendChild(small);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = fieldId;
                input.value = value || '';
                input.addEventListener('change', () => {
                    this.updateNodeProperty(node.id, key, input.value);
                });
                fieldDiv.appendChild(input);
            }

            container.appendChild(fieldDiv);
        }
    }

    formatPropertyName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    updateNodeProperty(nodeId, key, value) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.properties[key] = value;
            console.log(`📝 Propiedad actualizada: ${nodeId}.${key} = ${value}`);
        }
    }

    hideProperties() {
        const panelContent = this.propertiesPanel.querySelector('.panel-content');
        panelContent.innerHTML = ''; // Clear safely

        // Build empty state safely
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const icon = document.createElement('i');
        icon.className = 'fas fa-mouse-pointer';
        emptyState.appendChild(icon);

        const text = document.createElement('p');
        text.textContent = 'Selecciona un nodo para ver sus propiedades';
        emptyState.appendChild(text);

        panelContent.appendChild(emptyState);

        // Remove selection
        document.querySelectorAll('.flow-node.selected').forEach(node => {
            node.classList.remove('selected');
        });
        this.selectedNode = null;
    }

    startConnection(nodeElement, port) {
        this.isConnecting = true;
        this.connectionStart = {
            nodeId: nodeElement.dataset.nodeId,
            port: port.dataset.port,
            element: port
        };
        
        // Visual feedback
        port.style.background = 'var(--nexus-purple)';
        port.style.borderColor = 'var(--nexus-purple)';
        port.style.transform = 'scale(1.2)';
        
        // Change cursor
        document.body.style.cursor = 'crosshair';
        
        console.log(`🔗 Iniciando conexión desde: ${this.connectionStart.nodeId}.${this.connectionStart.port}`);
    }

    endConnection(nodeElement, port) {
        if (!this.isConnecting || !this.connectionStart) return;
        
        const targetNodeId = nodeElement.dataset.nodeId;
        const targetPort = port.dataset.port;
        
        // Reset visual states
        document.body.style.cursor = '';
        const startPort = this.connectionStart.element;
        startPort.style.background = '';
        startPort.style.borderColor = '';
        startPort.style.transform = '';
        
        // Validate connection
        if (this.connectionStart.nodeId === targetNodeId) {
            this.showToast('No puedes conectar un nodo consigo mismo', 'warning');
            this.resetConnection();
            return;
        }
        
        if (this.connectionStart.port === targetPort) {
            this.showToast('Conecta salida con entrada', 'warning');
            this.resetConnection();
            return;
        }
        
        // Check if connection already exists
        const connectionKey = `${this.connectionStart.nodeId}_${targetNodeId}`;
        if (this.connections.has(connectionKey)) {
            this.showToast('La conexión ya existe', 'warning');
            this.resetConnection();
            return;
        }
        
        // Create connection
        this.createConnection(
            this.connectionStart.nodeId,
            this.connectionStart.port,
            targetNodeId,
            targetPort
        );
        
        this.resetConnection();
    }

    resetConnection() {
        this.isConnecting = false;
        this.connectionStart = null;
        document.body.style.cursor = '';
    }

    createConnection(fromNodeId, fromPort, toNodeId, toPort) {
        const fromNode = this.nodes.get(fromNodeId);
        const toNode = this.nodes.get(toNodeId);
        
        if (!fromNode || !toNode) return;
        
        const connectionId = `${fromNodeId}_${toNodeId}`;
        
        // Store connection
        this.connections.set(connectionId, {
            id: connectionId,
            from: { nodeId: fromNodeId, port: fromPort },
            to: { nodeId: toNodeId, port: toPort }
        });
        
        // Draw connection
        this.drawConnection(connectionId);
        this.updateStats();
        
        // Mark as changed for auto-save
        this.markAsChanged();
        
        this.showToast('Conexión creada exitosamente', 'success');
        console.log(`✨ Conexión creada: ${fromNodeId}.${fromPort} → ${toNodeId}.${toPort}`);
    }

    drawConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        const fromNode = this.nodes.get(connection.from.nodeId);
        const toNode = this.nodes.get(connection.to.nodeId);
        
        if (!fromNode || !toNode) return;
        
        // Get port positions
        const fromPort = fromNode.element.querySelector(`[data-port="${connection.from.port}"]`);
        const toPort = toNode.element.querySelector(`[data-port="${connection.to.port}"]`);
        
        const fromRect = fromPort.getBoundingClientRect();
        const toRect = toPort.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const x1 = fromRect.left + fromRect.width/2 - canvasRect.left;
        const y1 = fromRect.top + fromRect.height/2 - canvasRect.top;
        const x2 = toRect.left + toRect.width/2 - canvasRect.left;
        const y2 = toRect.top + toRect.height/2 - canvasRect.top;
        
        // Create SVG path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate control points for smooth curve
        const dx = x2 - x1;
        const controlOffset = Math.abs(dx) * 0.4;
        const cx1 = x1 + controlOffset;
        const cx2 = x2 - controlOffset;
        
        const pathData = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'url(#connectionGradient)');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('data-connection-id', connectionId);
        path.style.filter = 'drop-shadow(0 2px 4px rgba(126, 58, 237, 0.3))';
        
        // Add gradient definition if not exists
        if (!this.svg.querySelector('#connectionGradient')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', 'connectionGradient');
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color: #1e3a8a; stop-opacity: 1" />
                <stop offset="50%" style="stop-color: #7c3aed; stop-opacity: 1" />
                <stop offset="100%" style="stop-color: #0891b2; stop-opacity: 1" />
            `;
            defs.appendChild(gradient);
            this.svg.appendChild(defs);
        }
        
        // Add click handler for connection deletion
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('¿Eliminar esta conexión?')) {
                this.deleteConnection(connectionId);
            }
        });
        
        path.addEventListener('mouseenter', () => {
            path.setAttribute('stroke-width', '4');
        });
        
        path.addEventListener('mouseleave', () => {
            path.setAttribute('stroke-width', '3');
        });
        
        this.svg.appendChild(path);
    }

    updateConnections() {
        // Redraw all connections
        this.svg.querySelectorAll('path[data-connection-id]').forEach(path => {
            const connectionId = path.getAttribute('data-connection-id');
            path.remove();
            this.drawConnection(connectionId);
        });
    }

    deleteConnection(connectionId) {
        this.connections.delete(connectionId);
        
        // Remove SVG path
        const path = this.svg.querySelector(`[data-connection-id="${connectionId}"]`);
        if (path) path.remove();
        
        this.updateStats();
        
        // Mark as changed for auto-save
        this.markAsChanged();
        
        this.showToast('Conexión eliminada', 'info');
        console.log(`🗑️ Conexión eliminada: ${connectionId}`);
    }

    deleteNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // Delete all connections involving this node
        const connectionsToDelete = [];
        this.connections.forEach((connection, id) => {
            if (connection.from.nodeId === nodeId || connection.to.nodeId === nodeId) {
                connectionsToDelete.push(id);
            }
        });
        
        connectionsToDelete.forEach(id => this.deleteConnection(id));
        
        // Remove node element and data
        node.element.remove();
        this.nodes.delete(nodeId);
        
        // Clear properties if this node was selected
        if (this.selectedNode?.dataset.nodeId === nodeId) {
            this.hideProperties();
        }
        
        this.updateStats();
        this.updateDropZoneHint();
        
        // Mark as changed for auto-save
        this.markAsChanged();
        
        this.showToast('Nodo eliminado', 'info');
        console.log(`🗑️ Nodo eliminado: ${nodeId}`);
    }

    duplicateNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        const rect = node.element.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const nodeData = {
            type: node.type,
            icon: node.element.querySelector('.flow-node-icon i').className,
            title: node.element.querySelector('.flow-node-title').textContent
        };
        
        // Create duplicate with offset position
        this.createNode(nodeData, 
            rect.left - canvasRect.left + 200, 
            rect.top - canvasRect.top + 50
        );
    }

    handleCanvasClick(e) {
        if (e.target === this.canvas || e.target.closest('.canvas-grid')) {
            this.hideProperties();
        }
    }

    handleKeyboard(e) {
        if (e.key === 'Delete' && this.selectedNode) {
            this.deleteNode(this.selectedNode.dataset.nodeId);
        }
        
        if (e.key === 'Escape') {
            this.resetConnection();
            this.hideProperties();
        }
        
        // Zoom with Ctrl+/Ctrl-
        if (e.ctrlKey) {
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                this.zoomCanvas(1.2);
            } else if (e.key === '-') {
                e.preventDefault();
                this.zoomCanvas(0.8);
            }
        }
    }

    zoomCanvas(factor) {
        this.zoom = Math.max(0.3, Math.min(3, this.zoom * factor));
        this.canvas.style.transform = `scale(${this.zoom}) translate(${this.pan.x}px, ${this.pan.y}px)`;
        this.showToast(`Zoom: ${Math.round(this.zoom * 100)}%`, 'info');
    }

    fitToScreen() {
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.canvas.style.transform = 'scale(1) translate(0px, 0px)';
        this.showToast('Vista ajustada', 'info');
    }

    clearCanvas() {
        if (this.nodes.size === 0) {
            this.showToast('El lienzo ya está vacío', 'info');
            return;
        }
        
        if (!confirm('¿Estás seguro de que quieres eliminar todo el flujo?')) {
            return;
        }
        
        // Clear all nodes and connections
        this.nodes.clear();
        this.connections.clear();
        
        // Remove DOM elements
        this.canvas.querySelectorAll('.flow-node').forEach(node => node.remove());
        this.svg.querySelectorAll('path[data-connection-id]').forEach(path => path.remove());
        
        // Reset UI
        this.hideProperties();
        this.updateStats();
        this.updateDropZoneHint();
        this.showToast('Lienzo limpiado', 'success');
        
        console.log('🧹 Lienzo limpiado completamente');
    }

    runFlow() {
        if (this.nodes.size === 0) {
            this.showToast('Añade nodos para ejecutar el flujo', 'warning');
            return;
        }
        
        // Simulate flow execution
        this.flowStatusEl.textContent = 'Ejecutando';
        this.showToast('Ejecutando flujo de automatización...', 'info');
        
        // Add visual execution effects
        this.canvas.querySelectorAll('.flow-node').forEach((node, index) => {
            setTimeout(() => {
                node.style.boxShadow = '0 0 20px var(--nexus-purple)';
                setTimeout(() => {
                    node.style.boxShadow = '';
                }, 1000);
            }, index * 500);
        });
        
        // Simulate completion
        setTimeout(() => {
            this.flowStatusEl.textContent = 'Completado';
            this.showToast('¡Flujo ejecutado exitosamente! ✨', 'success');
            
            setTimeout(() => {
                this.flowStatusEl.textContent = 'Diseño';
            }, 3000);
        }, this.nodes.size * 500 + 1000);
    }

    updateStats() {
        this.nodeCountEl.textContent = this.nodes.size;
        this.connectionCountEl.textContent = this.connections.size;
        
        // Update flow status based on complexity
        if (this.nodes.size === 0) {
            this.flowStatusEl.textContent = 'Vacío';
        } else if (this.connections.size === 0) {
            this.flowStatusEl.textContent = 'Sin conexiones';
        } else {
            this.flowStatusEl.textContent = 'Listo';
        }
    }

    updateDropZoneHint() {
        this.dropZoneHint.style.display = this.nodes.size === 0 ? 'block' : 'none';
    }

    showExamples() {
        document.getElementById('exampleModal').classList.add('active');
    }

    hideExamples() {
        document.getElementById('exampleModal').classList.remove('active');
    }

    loadExample(exampleType) {
        this.clearCanvas();
        
        const examples = {
            'lead-qualification': () => {
                // Form → AI → CRM flow
                setTimeout(() => {
                    this.createNode({type: 'form', icon: 'fas fa-wpforms', title: 'Formulario'}, 100, 150);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'chatgpt', icon: 'fas fa-robot', title: 'ChatGPT'}, 350, 150);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'crm', icon: 'fas fa-users', title: 'CRM'}, 600, 150);
                }, 500);
                
                // Create connections after nodes are created
                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                }, 800);
            },
            
            'customer-support': () => {
                // Email → AI → Response flow
                setTimeout(() => {
                    this.createNode({type: 'email-trigger', icon: 'fas fa-envelope', title: 'Email'}, 100, 150);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'chatgpt', icon: 'fas fa-robot', title: 'ChatGPT'}, 350, 150);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'email-send', icon: 'fas fa-paper-plane', title: 'Enviar Email'}, 600, 150);
                }, 500);
                
                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                }, 800);
            },
            
            'content-generation': () => {
                // Schedule → AI → Social Media
                setTimeout(() => {
                    this.createNode({type: 'schedule', icon: 'fas fa-clock', title: 'Programador'}, 100, 150);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'gemini', icon: 'fas fa-brain', title: 'Gemini AI'}, 350, 150);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'api-call', icon: 'fas fa-code', title: 'API Call'}, 600, 150);
                }, 500);
                
                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                }, 800);
            },
            
            'data-analysis': () => {
                // Complex flow with multiple branches
                setTimeout(() => {
                    this.createNode({type: 'webhook', icon: 'fas fa-globe', title: 'Webhook'}, 100, 150);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'filter', icon: 'fas fa-filter', title: 'Filtro'}, 350, 100);
                }, 200);
                setTimeout(() => {
                    this.createNode({type: 'transform', icon: 'fas fa-exchange-alt', title: 'Transformar'}, 350, 200);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'google-sheets', icon: 'fab fa-google', title: 'G. Sheets'}, 600, 150);
                }, 400);

                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_1', 'output', 'node_3', 'input');
                    this.createConnection('node_2', 'output', 'node_4', 'input');
                    this.createConnection('node_3', 'output', 'node_4', 'input');
                }, 800);
            },

            'whatsapp-bot': () => {
                // WhatsApp Bot with AI - Webhook → ChatGPT → WhatsApp
                setTimeout(() => {
                    this.createNode({type: 'webhook', icon: 'fas fa-globe', title: 'Webhook'}, 100, 150);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'chatgpt', icon: 'fas fa-robot', title: 'ChatGPT'}, 350, 150);
                }, 200);
                setTimeout(() => {
                    this.createNode({type: 'whatsapp', icon: 'fab fa-whatsapp', title: 'WhatsApp'}, 600, 150);
                }, 300);

                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                }, 600);
            },

            'ecommerce-notifications': () => {
                // E-commerce: Stripe → Filter → Multi-channel notifications
                setTimeout(() => {
                    this.createNode({type: 'stripe', icon: 'fab fa-stripe-s', title: 'Stripe'}, 100, 180);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'filter', icon: 'fas fa-filter', title: 'Filtro'}, 320, 180);
                }, 200);
                setTimeout(() => {
                    this.createNode({type: 'email-send', icon: 'fas fa-paper-plane', title: 'Email'}, 550, 80);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'whatsapp', icon: 'fab fa-whatsapp', title: 'WhatsApp'}, 550, 180);
                }, 400);
                setTimeout(() => {
                    this.createNode({type: 'slack', icon: 'fab fa-slack', title: 'Slack'}, 550, 280);
                }, 500);

                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                    this.createConnection('node_2', 'output', 'node_4', 'input');
                    this.createConnection('node_2', 'output', 'node_5', 'input');
                }, 800);
            },

            'data-pipeline': () => {
                // Data Pipeline: Form → Transform → Multiple DBs
                setTimeout(() => {
                    this.createNode({type: 'form', icon: 'fas fa-wpforms', title: 'Formulario'}, 100, 180);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'transform', icon: 'fas fa-exchange-alt', title: 'Transformar'}, 320, 180);
                }, 200);
                setTimeout(() => {
                    this.createNode({type: 'firebase', icon: 'fas fa-fire', title: 'Firebase'}, 550, 100);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'mongodb', icon: 'fas fa-leaf', title: 'MongoDB'}, 550, 200);
                }, 400);
                setTimeout(() => {
                    this.createNode({type: 'google-analytics', icon: 'fas fa-chart-line', title: 'Analytics'}, 550, 300);
                }, 500);

                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                    this.createConnection('node_2', 'output', 'node_4', 'input');
                    this.createConnection('node_2', 'output', 'node_5', 'input');
                }, 800);
            },

            'telegram-alerts': () => {
                // Monitoring: Schedule → API → Telegram + Discord alerts
                setTimeout(() => {
                    this.createNode({type: 'schedule', icon: 'fas fa-clock', title: 'Programador'}, 100, 150);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'api-call', icon: 'fas fa-code', title: 'API Health'}, 320, 150);
                }, 200);
                setTimeout(() => {
                    this.createNode({type: 'filter', icon: 'fas fa-filter', title: 'Check Errors'}, 540, 150);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'telegram', icon: 'fab fa-telegram', title: 'Telegram'}, 760, 100);
                }, 400);
                setTimeout(() => {
                    this.createNode({type: 'discord', icon: 'fab fa-discord', title: 'Discord'}, 760, 200);
                }, 500);

                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                    this.createConnection('node_3', 'output', 'node_4', 'input');
                    this.createConnection('node_3', 'output', 'node_5', 'input');
                }, 800);
            },

            'payment-flow': () => {
                // Complete payment flow with multiple providers
                setTimeout(() => {
                    this.createNode({type: 'webhook', icon: 'fas fa-globe', title: 'Webhook'}, 100, 180);
                }, 100);
                setTimeout(() => {
                    this.createNode({type: 'filter', icon: 'fas fa-filter', title: 'Region?'}, 320, 180);
                }, 200);
                setTimeout(() => {
                    this.createNode({type: 'stripe', icon: 'fab fa-stripe-s', title: 'Stripe'}, 540, 80);
                }, 300);
                setTimeout(() => {
                    this.createNode({type: 'paypal', icon: 'fab fa-paypal', title: 'PayPal'}, 540, 180);
                }, 400);
                setTimeout(() => {
                    this.createNode({type: 'mercadopago', icon: 'fas fa-money-bill-wave', title: 'MercadoPago'}, 540, 280);
                }, 500);
                setTimeout(() => {
                    this.createNode({type: 'supabase', icon: 'fas fa-bolt', title: 'Supabase'}, 760, 180);
                }, 600);

                setTimeout(() => {
                    this.createConnection('node_1', 'output', 'node_2', 'input');
                    this.createConnection('node_2', 'output', 'node_3', 'input');
                    this.createConnection('node_2', 'output', 'node_4', 'input');
                    this.createConnection('node_2', 'output', 'node_5', 'input');
                    this.createConnection('node_3', 'output', 'node_6', 'input');
                    this.createConnection('node_4', 'output', 'node_6', 'input');
                    this.createConnection('node_5', 'output', 'node_6', 'input');
                }, 1000);
            }
        };

        if (examples[exampleType]) {
            // Reset counter for consistent node IDs
            this.nodeIdCounter = 0;
            examples[exampleType]();
            this.showToast(`Ejemplo "${exampleType}" cargado`, 'success');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        // Build toast safely
        const icon = document.createElement('i');
        icon.className = icons[type] || icons.info;
        toast.appendChild(icon);

        const span = document.createElement('span');
        span.textContent = message; // Safe: textContent escapes HTML
        toast.appendChild(span);

        this.toastContainer.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    showNodeContextMenu(nodeElement, x, y) {
        // Remove existing context menu
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());

        const menu = document.createElement('div');
        menu.className = 'context-menu glass-effect';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.zIndex = '1000';
        menu.style.padding = '8px 0';
        menu.style.minWidth = '150px';

        const nodeId = nodeElement.dataset.nodeId;

        // Build context menu safely
        const menuItems = [
            {
                icon: 'fas fa-copy',
                text: 'Duplicar',
                action: () => {
                    this.duplicateNode(nodeId);
                    menu.remove();
                }
            },
            {
                icon: 'fas fa-cog',
                text: 'Propiedades',
                action: () => {
                    const node = document.querySelector(`[data-node-id="${nodeId}"]`);
                    if (node) this.selectNode(node);
                    menu.remove();
                }
            },
            { divider: true },
            {
                icon: 'fas fa-trash',
                text: 'Eliminar',
                danger: true,
                action: () => {
                    this.deleteNode(nodeId);
                    menu.remove();
                }
            }
        ];

        menuItems.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'context-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = `context-item${item.danger ? ' danger' : ''}`;

                const icon = document.createElement('i');
                icon.className = item.icon;
                menuItem.appendChild(icon);

                const text = document.createTextNode(` ${item.text}`);
                menuItem.appendChild(text);

                menuItem.addEventListener('click', item.action);
                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);

        // Remove menu on click outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    /**
     * Setup Persistence UI - Event listeners for save/load modals
     */
    setupPersistenceUI() {
        // Save Modal
        document.getElementById('confirmSave')?.addEventListener('click', () => this.saveWorkflow());
        document.getElementById('cancelSave')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('closeSaveModal')?.addEventListener('click', () => this.hideSaveModal());
        
        // Load Modal
        document.getElementById('closeLoadModal')?.addEventListener('click', () => this.hideLoadModal());
        document.getElementById('loadModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'loadModal') this.hideLoadModal();
        });
        
        // Save Modal overlay click
        document.getElementById('saveModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'saveModal') this.hideSaveModal();
        });
        
        // Import file input
        document.getElementById('importFileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImportFile(file);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+S / Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.showSaveModal();
            }
        });
    }

    /**
     * Show Save Modal
     */
    showSaveModal() {
        if (this.nodes.size === 0) {
            this.showToast('No hay nodos para guardar', 'warning');
            return;
        }
        
        const modal = document.getElementById('saveModal');
        const input = document.getElementById('workflowName');
        
        // Set current workflow name if exists
        const currentName = this.persistence.getCurrentWorkflowName();
        if (currentName) {
            input.value = currentName;
        } else {
            input.value = '';
        }
        
        modal.classList.add('active');
        setTimeout(() => input.focus(), 100);
    }

    /**
     * Hide Save Modal
     */
    hideSaveModal() {
        document.getElementById('saveModal').classList.remove('active');
    }

    /**
     * Save Workflow
     */
    saveWorkflow() {
        const input = document.getElementById('workflowName');
        const name = input.value.trim();
        
        if (!name) {
            this.showToast('Ingresa un nombre para el workflow', 'warning');
            input.focus();
            return;
        }
        
        const result = this.persistence.saveWorkflow(name);
        
        if (result.success) {
            this.showToast(`Workflow "${result.name}" guardado exitosamente`, 'success');
            this.hideSaveModal();
        } else {
            this.showToast(`Error al guardar: ${result.error}`, 'error');
        }
    }

    /**
     * Show Load Modal with workflows list
     */
    showLoadModal() {
        const modal = document.getElementById('loadModal');
        const workflows = this.persistence.getAllWorkflows();
        const workflowsList = document.getElementById('workflowsList');
        
        // Clear current list
        workflowsList.innerHTML = '';
        
        const workflowsArray = Object.values(workflows);
        
        if (workflowsArray.length === 0) {
            workflowsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No hay workflows guardados</p>
                    <small>Crea y guarda tu primer workflow</small>
                </div>
            `;
        } else {
            // Sort by updated date (most recent first)
            workflowsArray.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            workflowsArray.forEach(workflow => {
                const item = document.createElement('div');
                item.className = 'workflow-item';
                if (workflow.id === this.persistence.getCurrentWorkflowId()) {
                    item.classList.add('active');
                }
                
                const date = new Date(workflow.updatedAt);
                const formattedDate = date.toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                item.innerHTML = `
                    <div class="workflow-info">
                        <h4>${this.sanitizeText(workflow.name)}</h4>
                        <div class="workflow-meta">
                            <span><i class="fas fa-project-diagram"></i> ${workflow.nodes.length} nodos</span>
                            <span><i class="fas fa-link"></i> ${workflow.connections.length} conexiones</span>
                            <span><i class="fas fa-clock"></i> ${formattedDate}</span>
                        </div>
                    </div>
                    <div class="workflow-actions">
                        <button class="workflow-action-btn load" data-workflow-id="${workflow.id}" title="Cargar">
                            <i class="fas fa-folder-open"></i>
                        </button>
                        <button class="workflow-action-btn delete" data-workflow-id="${workflow.id}" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Load workflow on click
                item.querySelector('.load').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.loadWorkflowById(workflow.id);
                });
                
                // Delete workflow
                item.querySelector('.delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteWorkflowById(workflow.id, workflow.name);
                });
                
                // Also load on item click
                item.addEventListener('click', () => {
                    this.loadWorkflowById(workflow.id);
                });
                
                workflowsList.appendChild(item);
            });
        }
        
        modal.classList.add('active');
    }

    /**
     * Hide Load Modal
     */
    hideLoadModal() {
        document.getElementById('loadModal').classList.remove('active');
    }

    /**
     * Load workflow by ID
     * @param {string} workflowId - Workflow ID to load
     */
    loadWorkflowById(workflowId) {
        const result = this.persistence.loadWorkflow(workflowId);
        
        if (result.success) {
            this.showToast(`Workflow "${result.name}" cargado exitosamente`, 'success');
            this.hideLoadModal();
        } else {
            this.showToast(`Error al cargar: ${result.error}`, 'error');
        }
    }

    /**
     * Delete workflow by ID
     * @param {string} workflowId - Workflow ID to delete
     * @param {string} workflowName - Workflow name
     */
    deleteWorkflowById(workflowId, workflowName) {
        if (!confirm(`¿Estás seguro de eliminar "${workflowName}"?`)) {
            return;
        }
        
        const result = this.persistence.deleteWorkflow(workflowId);
        
        if (result.success) {
            this.showToast(`Workflow "${result.name}" eliminado`, 'info');
            // Refresh the list
            this.showLoadModal();
        } else {
            this.showToast(`Error al eliminar: ${result.error}`, 'error');
        }
    }

    /**
     * Export workflow to JSON file
     */
    exportWorkflow() {
        if (this.nodes.size === 0) {
            this.showToast('No hay nodos para exportar', 'warning');
            return;
        }
        
        this.persistence.exportToFile();
    }

    /**
     * Import workflow from JSON file
     */
    importWorkflow() {
        const input = document.getElementById('importFileInput');
        input.click();
    }

    /**
     * Handle import file
     * @param {File} file - File to import
     */
    async handleImportFile(file) {
        try {
            await this.persistence.importFromFile(file);
            // Reset file input
            document.getElementById('importFileInput').value = '';
        } catch (error) {
            console.error('Error importing file:', error);
        }
    }

    /**
     * Mark workflow as changed (for auto-save)
     */
    markAsChanged() {
        this.persistence.markAsChanged();
    }

    /**
     * Setup Node Search functionality
     */
    setupNodeSearch() {
        const searchInput = document.getElementById('nodeSearch');
        const clearBtn = document.getElementById('clearSearch');
        const searchStats = document.getElementById('searchStats');
        const searchContainer = document.querySelector('.node-search-container');
        
        if (!searchInput) return;
        
        let searchTimeout = null;
        
        // Search input handler with debounce
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterNodes(e.target.value);
            }, 200);
        });
        
        // Clear search button
        clearBtn?.addEventListener('click', () => {
            searchInput.value = '';
            this.filterNodes('');
            searchInput.focus();
        });
        
        // Keyboard shortcut: Cmd+K or Ctrl+K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
            
            // ESC to clear search
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                this.filterNodes('');
                searchInput.blur();
            }
        });
        
        console.log('🔍 Node search initialized');
    }

    /**
     * Filter nodes based on search query
     * @param {string} query - Search query
     */
    filterNodes(query) {
        const searchInput = document.getElementById('nodeSearch');
        const clearBtn = document.getElementById('clearSearch');
        const searchStats = document.getElementById('searchStats');
        const searchContainer = document.querySelector('.node-search-container');
        
        const normalizedQuery = query.toLowerCase().trim();
        const nodeTemplates = document.querySelectorAll('.node-template');
        const toolbarSections = document.querySelectorAll('.toolbar-section');
        
        let visibleCount = 0;
        let totalCount = nodeTemplates.length;
        
        // Show/hide clear button
        if (normalizedQuery) {
            clearBtn.style.display = 'flex';
            searchContainer.classList.add('searching');
        } else {
            clearBtn.style.display = 'none';
            searchContainer.classList.remove('searching');
        }
        
        // If query is empty, show all nodes
        if (!normalizedQuery) {
            nodeTemplates.forEach(node => {
                node.classList.remove('filtered-out', 'search-highlight');
                node.querySelector('span').innerHTML = node.querySelector('span').textContent;
            });
            toolbarSections.forEach(section => section.classList.remove('section-empty'));
            searchStats.style.display = 'none';
            return;
        }
        
        // Filter nodes
        nodeTemplates.forEach(node => {
            const nodeName = node.querySelector('span').textContent.toLowerCase();
            const nodeType = node.dataset.type.toLowerCase();
            
            // Check if query matches name or type
            const matches = this.fuzzyMatch(normalizedQuery, nodeName) || 
                           nodeType.includes(normalizedQuery);
            
            if (matches) {
                node.classList.remove('filtered-out');
                node.classList.add('search-highlight');
                visibleCount++;
                
                // Highlight matching text
                this.highlightText(node.querySelector('span'), normalizedQuery);
                
                // Remove highlight animation after delay
                setTimeout(() => {
                    node.classList.remove('search-highlight');
                }, 500);
            } else {
                node.classList.add('filtered-out');
                node.classList.remove('search-highlight');
            }
        });
        
        // Update section visibility
        toolbarSections.forEach(section => {
            const visibleNodes = section.querySelectorAll('.node-template:not(.filtered-out)');
            if (visibleNodes.length === 0) {
                section.classList.add('section-empty');
            } else {
                section.classList.remove('section-empty');
            }
        });
        
        // Update search stats
        searchStats.style.display = 'block';
        searchStats.querySelector('.search-count').textContent = 
            `${visibleCount} de ${totalCount} nodos encontrados`;
        
        console.log(`🔍 Search: "${query}" - ${visibleCount}/${totalCount} nodes found`);
    }

    /**
     * Fuzzy match algorithm for flexible search
     * @param {string} query - Search query
     * @param {string} text - Text to match against
     * @returns {boolean} - Whether query matches text
     */
    fuzzyMatch(query, text) {
        if (!query) return true;
        if (!text) return false;
        
        let queryIndex = 0;
        let textIndex = 0;
        
        while (queryIndex < query.length && textIndex < text.length) {
            if (query[queryIndex] === text[textIndex]) {
                queryIndex++;
            }
            textIndex++;
        }
        
        return queryIndex === query.length;
    }

    /**
     * Highlight matching text in node name
     * @param {HTMLElement} element - Element containing text
     * @param {string} query - Search query
     */
    highlightText(element, query) {
        const text = element.textContent;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        // Simple highlight: wrap matching substring
        const index = lowerText.indexOf(lowerQuery);
        if (index !== -1) {
            const before = text.substring(0, index);
            const match = text.substring(index, index + query.length);
            const after = text.substring(index + query.length);
            element.innerHTML = `${before}<span class="search-match">${match}</span>${after}`;
        } else {
            // Fuzzy highlight: highlight individual matching characters
            let result = '';
            let queryIndex = 0;
            
            for (let i = 0; i < text.length; i++) {
                if (queryIndex < query.length && 
                    text[i].toLowerCase() === query[queryIndex].toLowerCase()) {
                    result += `<span class="search-match">${text[i]}</span>`;
                    queryIndex++;
                } else {
                    result += text[i];
                }
            }
            
            element.innerHTML = result;
        }
    }
}

// Initialize the automation builder when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.builder = new AutomationBuilder();
    
    // Add additional CSS for properties panel and context menu
    const additionalStyles = `
        .node-properties {
            padding: 0;
        }
        
        .property-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 0;
            border-bottom: 1px solid var(--glass-border);
            margin-bottom: 20px;
        }
        
        .property-icon {
            width: 40px;
            height: 40px;
            background: var(--nexus-gradient);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
        }
        
        .property-header h4 {
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
        }
        
        .property-header p {
            color: var(--text-secondary);
            font-size: 0.8rem;
            margin: 0;
        }
        
        .property-section {
            margin-bottom: 24px;
        }
        
        .property-section h5 {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        }
        
        .property-section h5 i {
            color: var(--nexus-purple);
        }
        
        .property-field {
            margin-bottom: 16px;
        }
        
        .property-field label {
            display: block;
            color: var(--text-secondary);
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .property-field input,
        .property-field textarea {
            width: 100%;
            background: var(--surface);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            padding: 8px 12px;
            color: var(--text-primary);
            font-size: 0.9rem;
            transition: border-color 0.2s ease;
        }
        
        .property-field input:focus,
        .property-field textarea:focus {
            outline: none;
            border-color: var(--nexus-purple);
        }
        
        .property-field small {
            color: var(--text-muted);
            font-size: 0.7rem;
            margin-top: 4px;
            display: block;
        }
        
        .checkbox-container {
            position: relative;
            display: flex;
            align-items: center;
        }
        
        .checkbox-container input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
        }
        
        .property-info {
            background: var(--surface);
            border-radius: 8px;
            padding: 12px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid var(--glass-border);
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .info-item span {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }
        
        .info-item code {
            background: var(--bg-secondary);
            color: var(--nexus-cyan);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        
        .property-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--glass-border);
        }
        
        .property-btn {
            background: var(--surface);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
        }
        
        .property-btn:hover {
            background: var(--surface-light);
            color: var(--text-primary);
        }
        
        .property-btn.danger {
            border-color: var(--accent-red);
            color: var(--accent-red);
        }
        
        .property-btn.danger:hover {
            background: var(--accent-red);
            color: white;
        }
        
        .context-menu {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .context-item {
            padding: 10px 16px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
        }
        
        .context-item:hover {
            background: var(--surface);
            color: var(--text-primary);
        }
        
        .context-item.danger {
            color: var(--accent-red);
        }
        
        .context-item.danger:hover {
            background: var(--accent-red);
            color: white;
        }
        
        .context-divider {
            height: 1px;
            background: var(--glass-border);
            margin: 4px 0;
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    
    // Inject additional styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
});