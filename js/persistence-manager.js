/**
 * Nexus AI - Persistence Manager
 * Handles localStorage operations for workflow save/load
 */

class PersistenceManager {
    constructor(builder) {
        this.builder = builder;
        this.storageKey = 'nexus_automation_workflows';
        this.currentWorkflowKey = 'nexus_current_workflow';
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.hasUnsavedChanges = false;
        
        console.log('💾 PersistenceManager inicializado');
    }

    /**
     * Serialize current workflow to JSON
     * @returns {Object} Serialized workflow data
     */
    serialize() {
        const nodes = [];
        const connections = [];

        // Serialize nodes
        this.builder.nodes.forEach((nodeData, nodeId) => {
            nodes.push({
                id: nodeId,
                type: nodeData.type,
                position: {
                    x: nodeData.position.x,
                    y: nodeData.position.y
                },
                properties: nodeData.properties,
                config: {
                    subtitle: nodeData.config.subtitle,
                    category: nodeData.config.category,
                    hasInput: nodeData.config.hasInput,
                    hasOutput: nodeData.config.hasOutput,
                    color: nodeData.config.color
                }
            });
        });

        // Serialize connections
        this.builder.connections.forEach((connData, connId) => {
            connections.push({
                id: connId,
                from: connData.from,
                to: connData.to
            });
        });

        const workflow = {
            id: this.getCurrentWorkflowId() || this.generateWorkflowId(),
            name: this.getCurrentWorkflowName() || 'Workflow Sin Título',
            version: '1.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: nodes,
            connections: connections,
            settings: {
                zoom: this.builder.zoom || 1,
                pan: this.builder.pan || { x: 0, y: 0 },
                nodeIdCounter: this.builder.nodeIdCounter || 0
            }
        };

        console.log(`📦 Workflow serializado: ${nodes.length} nodos, ${connections.length} conexiones`);
        return workflow;
    }

    /**
     * Deserialize workflow data and restore to canvas
     * @param {Object} workflow - Workflow data to restore
     */
    deserialize(workflow) {
        if (!workflow || !workflow.nodes) {
            throw new Error('Datos de workflow inválidos');
        }

        console.log(`📥 Deserializando workflow: ${workflow.name}`);

        // Clear current canvas
        this.builder.clearCanvas();

        // Restore settings
        if (workflow.settings) {
            this.builder.zoom = workflow.settings.zoom || 1;
            this.builder.pan = workflow.settings.pan || { x: 0, y: 0 };
            this.builder.nodeIdCounter = workflow.settings.nodeIdCounter || 0;
        }

        // Restore nodes
        workflow.nodes.forEach(nodeData => {
            this.recreateNode(nodeData);
        });

        // Restore connections (with delay to ensure nodes are ready)
        setTimeout(() => {
            workflow.connections.forEach(connData => {
                this.recreateConnection(connData);
            });
            
            this.builder.updateStats();
            console.log(`✅ Workflow "${workflow.name}" cargado exitosamente`);
        }, 100);

        // Store current workflow info
        this.setCurrentWorkflow(workflow.id, workflow.name);
    }

    /**
     * Recreate a node from serialized data
     * @param {Object} nodeData - Serialized node data
     */
    recreateNode(nodeData) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'flow-node';
        nodeElement.dataset.nodeId = nodeData.id;
        nodeElement.dataset.nodeType = nodeData.type;
        
        // Position the node
        nodeElement.style.left = `${nodeData.position.x}px`;
        nodeElement.style.top = `${nodeData.position.y}px`;

        // Get node configuration
        const config = this.builder.getNodeConfig(nodeData.type);
        
        // Get title from node type
        const title = this.getNodeTitle(nodeData.type);
        const icon = this.getNodeIcon(nodeData.type);

        // Build node DOM safely
        const header = document.createElement('div');
        header.className = 'flow-node-header';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'flow-node-icon';
        const iconEl = document.createElement('i');
        iconEl.className = this.builder.sanitizeIconClass(icon);
        iconContainer.appendChild(iconEl);

        const textContainer = document.createElement('div');
        const titleEl = document.createElement('div');
        titleEl.className = 'flow-node-title';
        titleEl.textContent = title;
        const subtitleEl = document.createElement('div');
        subtitleEl.className = 'flow-node-subtitle';
        subtitleEl.textContent = config.subtitle;
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
        this.builder.setupNodeEvents(nodeElement);
        
        // Add to canvas and store
        this.builder.canvas.appendChild(nodeElement);
        this.builder.nodes.set(nodeData.id, {
            id: nodeData.id,
            type: nodeData.type,
            element: nodeElement,
            config: config,
            position: nodeData.position,
            properties: nodeData.properties || config.defaultProperties
        });
        
        this.builder.updateDropZoneHint();
    }

    /**
     * Recreate a connection from serialized data
     * @param {Object} connData - Serialized connection data
     */
    recreateConnection(connData) {
        const fromNode = this.builder.nodes.get(connData.from);
        const toNode = this.builder.nodes.get(connData.to);

        if (!fromNode || !toNode) {
            console.warn(`⚠️ No se puede recrear conexión ${connData.id}: nodos no encontrados`);
            return;
        }

        // Get port elements
        const fromPort = fromNode.element.querySelector('.node-port.output');
        const toPort = toNode.element.querySelector('.node-port.input');

        if (!fromPort || !toPort) {
            console.warn(`⚠️ No se puede recrear conexión ${connData.id}: puertos no encontrados`);
            return;
        }

        // Create connection
        this.builder.connections.set(connData.id, {
            id: connData.id,
            from: connData.from,
            to: connData.to,
            fromPort: fromPort,
            toPort: toPort
        });

        // Draw the connection
        this.builder.drawConnection(connData.id);
    }

    /**
     * Get node title from type
     * @param {string} type - Node type
     * @returns {string} Node title
     */
    getNodeTitle(type) {
        const titles = {
            'webhook': 'Webhook',
            'form': 'Formulario',
            'email-trigger': 'Email',
            'schedule': 'Programador',
            'chatgpt': 'ChatGPT',
            'gemini': 'Gemini AI',
            'filter': 'Filtro',
            'transform': 'Transformar',
            'email-send': 'Enviar Email',
            'slack': 'Slack',
            'database': 'Base Datos',
            'api-call': 'API Call',
            'zapier': 'Zapier',
            'make': 'Make',
            'google-sheets': 'G. Sheets',
            'crm': 'CRM',
            'whatsapp': 'WhatsApp',
            'telegram': 'Telegram',
            'twilio': 'Twilio SMS',
            'discord': 'Discord',
            'stripe': 'Stripe',
            'paypal': 'PayPal',
            'mercadopago': 'MercadoPago',
            'aws-s3': 'AWS S3',
            'firebase': 'Firebase',
            'mongodb': 'MongoDB',
            'supabase': 'Supabase',
            'google-analytics': 'G. Analytics',
            'mixpanel': 'Mixpanel',
            'segment': 'Segment'
        };
        return titles[type] || type;
    }

    /**
     * Get node icon from type
     * @param {string} type - Node type
     * @returns {string} Icon class
     */
    getNodeIcon(type) {
        const icons = {
            'webhook': 'fas fa-globe',
            'form': 'fas fa-wpforms',
            'email-trigger': 'fas fa-envelope',
            'schedule': 'fas fa-clock',
            'chatgpt': 'fas fa-robot',
            'gemini': 'fas fa-brain',
            'filter': 'fas fa-filter',
            'transform': 'fas fa-exchange-alt',
            'email-send': 'fas fa-paper-plane',
            'slack': 'fab fa-slack',
            'database': 'fas fa-database',
            'api-call': 'fas fa-code',
            'zapier': 'fas fa-bolt',
            'make': 'fas fa-puzzle-piece',
            'google-sheets': 'fab fa-google',
            'crm': 'fas fa-users',
            'whatsapp': 'fab fa-whatsapp',
            'telegram': 'fab fa-telegram',
            'twilio': 'fas fa-sms',
            'discord': 'fab fa-discord',
            'stripe': 'fab fa-stripe-s',
            'paypal': 'fab fa-paypal',
            'mercadopago': 'fas fa-money-bill-wave',
            'aws-s3': 'fab fa-aws',
            'firebase': 'fas fa-fire',
            'mongodb': 'fas fa-leaf',
            'supabase': 'fas fa-bolt',
            'google-analytics': 'fas fa-chart-line',
            'mixpanel': 'fas fa-chart-pie',
            'segment': 'fas fa-project-diagram'
        };
        return icons[type] || 'fas fa-cube';
    }

    /**
     * Save current workflow to localStorage
     * @param {string} name - Optional workflow name
     * @returns {Object} Result with success status
     */
    saveWorkflow(name = null) {
        try {
            const workflow = this.serialize();
            
            if (name) {
                workflow.name = name;
            }

            const workflows = this.getAllWorkflows();
            workflows[workflow.id] = workflow;
            
            localStorage.setItem(this.storageKey, JSON.stringify(workflows));
            this.setCurrentWorkflow(workflow.id, workflow.name);
            this.hasUnsavedChanges = false;
            
            console.log(`✅ Workflow guardado: ${workflow.name} (${workflow.id})`);
            return { success: true, id: workflow.id, name: workflow.name };
        } catch (error) {
            console.error('❌ Error guardando workflow:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load workflow from localStorage by ID
     * @param {string} workflowId - Workflow ID to load
     * @returns {Object} Result with success status
     */
    loadWorkflow(workflowId) {
        try {
            const workflows = this.getAllWorkflows();
            const workflow = workflows[workflowId];
            
            if (!workflow) {
                throw new Error('Workflow no encontrado');
            }

            this.deserialize(workflow);
            this.hasUnsavedChanges = false;
            
            return { success: true, name: workflow.name };
        } catch (error) {
            console.error('❌ Error cargando workflow:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete workflow from localStorage
     * @param {string} workflowId - Workflow ID to delete
     * @returns {Object} Result with success status
     */
    deleteWorkflow(workflowId) {
        try {
            const workflows = this.getAllWorkflows();
            
            if (!workflows[workflowId]) {
                throw new Error('Workflow no encontrado');
            }

            const workflowName = workflows[workflowId].name;
            delete workflows[workflowId];
            
            localStorage.setItem(this.storageKey, JSON.stringify(workflows));
            
            // Clear current workflow if it's the one being deleted
            if (this.getCurrentWorkflowId() === workflowId) {
                this.clearCurrentWorkflow();
            }
            
            console.log(`🗑️ Workflow eliminado: ${workflowName}`);
            return { success: true, name: workflowName };
        } catch (error) {
            console.error('❌ Error eliminando workflow:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all saved workflows
     * @returns {Object} All workflows keyed by ID
     */
    getAllWorkflows() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('❌ Error leyendo workflows:', error);
            return {};
        }
    }

    /**
     * Export workflow to JSON file
     */
    exportToFile() {
        const workflow = this.serialize();
        const blob = new Blob([JSON.stringify(workflow, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${workflow.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📤 Workflow exportado: ${workflow.name}`);
        this.builder.showToast(`Workflow exportado: ${workflow.name}`, 'success');
    }

    /**
     * Import workflow from JSON file
     * @param {File} file - File to import
     * @returns {Promise} Promise resolving with result
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const workflow = JSON.parse(e.target.result);
                    
                    // Validate workflow structure
                    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
                        throw new Error('Archivo de workflow inválido');
                    }
                    
                    // Generate new ID to avoid conflicts
                    workflow.id = this.generateWorkflowId();
                    workflow.name = `${workflow.name} (Importado)`;
                    
                    this.deserialize(workflow);
                    
                    console.log(`📥 Workflow importado: ${workflow.name}`);
                    this.builder.showToast(`Workflow importado: ${workflow.name}`, 'success');
                    
                    resolve({ success: true, name: workflow.name });
                } catch (error) {
                    console.error('❌ Error importando workflow:', error);
                    this.builder.showToast('Error al importar workflow', 'error');
                    reject({ success: false, error: error.message });
                }
            };
            
            reader.onerror = () => {
                reject({ success: false, error: 'Error leyendo archivo' });
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Start auto-save functionality
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            if (this.hasUnsavedChanges && this.builder.nodes.size > 0) {
                const result = this.saveWorkflow();
                if (result.success) {
                    this.builder.showToast('Auto-guardado ✓', 'info', 2000);
                }
            }
        }, this.autoSaveInterval);
        
        console.log(`⏰ Auto-guardado activado (cada ${this.autoSaveInterval/1000}s)`);
    }

    /**
     * Stop auto-save functionality
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏹️ Auto-guardado desactivado');
        }
    }

    /**
     * Mark workflow as having unsaved changes
     */
    markAsChanged() {
        this.hasUnsavedChanges = true;
    }

    /**
     * Generate unique workflow ID
     * @returns {string} Unique ID
     */
    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current workflow ID
     * @returns {string|null} Current workflow ID
     */
    getCurrentWorkflowId() {
        try {
            const data = localStorage.getItem(this.currentWorkflowKey);
            return data ? JSON.parse(data).id : null;
        } catch {
            return null;
        }
    }

    /**
     * Get current workflow name
     * @returns {string|null} Current workflow name
     */
    getCurrentWorkflowName() {
        try {
            const data = localStorage.getItem(this.currentWorkflowKey);
            return data ? JSON.parse(data).name : null;
        } catch {
            return null;
        }
    }

    /**
     * Set current workflow info
     * @param {string} id - Workflow ID
     * @param {string} name - Workflow name
     */
    setCurrentWorkflow(id, name) {
        localStorage.setItem(this.currentWorkflowKey, JSON.stringify({ id, name }));
    }

    /**
     * Clear current workflow info
     */
    clearCurrentWorkflow() {
        localStorage.removeItem(this.currentWorkflowKey);
    }
}
