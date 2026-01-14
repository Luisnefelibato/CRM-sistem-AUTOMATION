/**
 * Nexus AI - Execution Engine
 * Handles workflow execution with data flow between nodes
 */

class ExecutionEngine {
    constructor(builder) {
        this.builder = builder;
        this.executionContext = new Map(); // Stores output data from each node
        this.executionLogs = [];
        this.isExecuting = false;
        this.executionId = null;
        
        console.log('⚙️ ExecutionEngine initialized');
    }

    /**
     * Execute workflow with real data flow
     * @returns {Promise<Object>} Execution result
     */
    async executeWorkflow() {
        if (this.isExecuting) {
            throw new Error('Workflow is already executing');
        }

        if (this.builder.nodes.size === 0) {
            throw new Error('No nodes to execute');
        }

        this.isExecuting = true;
        this.executionId = `exec_${Date.now()}`;
        this.executionContext.clear();
        this.executionLogs = [];

        try {
            // Log execution start
            this.log('info', 'Workflow execution started', { executionId: this.executionId });

            // Step 1: Topological sort to determine execution order
            const sortedNodes = this.topologicalSort();
            this.log('info', `Execution order determined: ${sortedNodes.length} nodes`, {
                nodeIds: sortedNodes.map(n => n.id)
            });

            // Step 2: Execute nodes in order
            for (const node of sortedNodes) {
                await this.executeNode(node);
            }

            // Log execution completion
            this.log('success', 'Workflow execution completed successfully', {
                nodesExecuted: sortedNodes.length,
                duration: Date.now() - parseInt(this.executionId.split('_')[1])
            });

            return {
                success: true,
                executionId: this.executionId,
                context: Object.fromEntries(this.executionContext),
                logs: this.executionLogs
            };

        } catch (error) {
            this.log('error', `Workflow execution failed: ${error.message}`, { error });
            throw error;
        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Topological sort to determine node execution order
     * @returns {Array} Sorted array of nodes
     */
    topologicalSort() {
        const nodes = Array.from(this.builder.nodes.values());
        const connections = Array.from(this.builder.connections.values());
        
        // Build adjacency list and in-degree map
        const adjacencyList = new Map();
        const inDegree = new Map();
        
        // Initialize
        nodes.forEach(node => {
            adjacencyList.set(node.id, []);
            inDegree.set(node.id, 0);
        });
        
        // Build graph
        connections.forEach(conn => {
            const fromId = conn.from;
            const toId = conn.to;
            
            adjacencyList.get(fromId).push(toId);
            inDegree.set(toId, inDegree.get(toId) + 1);
        });
        
        // Find nodes with no incoming edges (start nodes)
        const queue = [];
        inDegree.forEach((degree, nodeId) => {
            if (degree === 0) {
                queue.push(nodeId);
            }
        });
        
        // Kahn's algorithm for topological sort
        const sorted = [];
        
        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = this.builder.nodes.get(currentId);
            sorted.push(currentNode);
            
            // Process neighbors
            const neighbors = adjacencyList.get(currentId);
            neighbors.forEach(neighborId => {
                inDegree.set(neighborId, inDegree.get(neighborId) - 1);
                if (inDegree.get(neighborId) === 0) {
                    queue.push(neighborId);
                }
            });
        }
        
        // Check for cycles
        if (sorted.length !== nodes.length) {
            throw new Error('Workflow contains cycles - cannot execute');
        }
        
        return sorted;
    }

    /**
     * Execute a single node
     * @param {Object} node - Node to execute
     * @returns {Promise<Object>} Node output data
     */
    async executeNode(node) {
        const startTime = Date.now();
        
        try {
            this.log('info', `Executing node: ${node.type}`, { nodeId: node.id });

            // Highlight node during execution (visual feedback)
            this.highlightNode(node.element, 'executing');

            // Get input data from connected nodes
            const inputData = this.getNodeInputs(node);

            // Execute node logic based on type
            const outputData = await this.runNodeLogic(node, inputData);

            // Store output in context
            this.executionContext.set(node.id, outputData);

            // Visual feedback: success
            this.highlightNode(node.element, 'success');

            const duration = Date.now() - startTime;
            this.log('success', `Node executed successfully: ${node.type}`, {
                nodeId: node.id,
                duration,
                outputSize: JSON.stringify(outputData).length
            });

            return outputData;

        } catch (error) {
            // Visual feedback: error
            this.highlightNode(node.element, 'error');

            this.log('error', `Node execution failed: ${node.type}`, {
                nodeId: node.id,
                error: error.message
            });

            throw new Error(`Node ${node.id} (${node.type}) failed: ${error.message}`);
        }
    }

    /**
     * Get input data for a node from connected nodes
     * @param {Object} node - Node to get inputs for
     * @returns {Object} Input data from all connected nodes
     */
    getNodeInputs(node) {
        const inputs = {};
        
        // Find all connections where this node is the target
        this.builder.connections.forEach(connection => {
            if (connection.to === node.id) {
                const sourceNodeId = connection.from;
                const sourceData = this.executionContext.get(sourceNodeId);
                
                if (sourceData) {
                    // Merge source data into inputs
                    inputs[sourceNodeId] = sourceData;
                }
            }
        });
        
        return inputs;
    }

    /**
     * Resolve variables in text using {{node.output.field}} syntax
     * @param {string} text - Text with variables to resolve
     * @param {Object} node - Current node (for context)
     * @returns {string} Text with resolved variables
     */
    resolveVariables(text, node) {
        if (typeof text !== 'string') return text;

        // Pattern: {{nodeId.field.subfield}} or {{prev.field}}
        const variablePattern = /\{\{\s*([\w.-]+)\s*\}\}/g;
        
        return text.replace(variablePattern, (match, path) => {
            try {
                // Handle 'prev' shortcut (last connected node)
                if (path.startsWith('prev.')) {
                    const inputs = this.getNodeInputs(node);
                    const inputNodeIds = Object.keys(inputs);
                    
                    if (inputNodeIds.length === 0) {
                        console.warn(`⚠️ Variable ${match}: No previous nodes connected`);
                        return match;
                    }
                    
                    // Use the first input node as 'prev'
                    const prevNodeId = inputNodeIds[0];
                    const fieldPath = path.substring(5); // Remove 'prev.'
                    const value = this.getNestedValue(inputs[prevNodeId], fieldPath);
                    
                    return value !== undefined ? String(value) : match;
                }
                
                // Handle explicit node references: {{nodeId.field.subfield}}
                const parts = path.split('.');
                const nodeId = parts[0];
                const fieldPath = parts.slice(1).join('.');
                
                const nodeData = this.executionContext.get(nodeId);
                if (!nodeData) {
                    console.warn(`⚠️ Variable ${match}: Node ${nodeId} not found or not executed yet`);
                    return match;
                }
                
                const value = this.getNestedValue(nodeData, fieldPath);
                return value !== undefined ? String(value) : match;
                
            } catch (error) {
                console.error(`Error resolving variable ${match}:`, error);
                return match;
            }
        });
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to traverse
     * @param {string} path - Dot-separated path (e.g., 'data.user.name')
     * @returns {*} Value at path or undefined
     */
    getNestedValue(obj, path) {
        if (!path) return obj;
        
        return path.split('.').reduce((current, key) => {
            return current?.[key];
        }, obj);
    }

    /**
     * Resolve all variables in an object recursively
     * @param {*} obj - Object/Array/String to resolve
     * @param {Object} node - Current node
     * @returns {*} Object with resolved variables
     */
    resolveObjectVariables(obj, node) {
        if (typeof obj === 'string') {
            return this.resolveVariables(obj, node);
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.resolveObjectVariables(item, node));
        }
        
        if (obj && typeof obj === 'object') {
            const resolved = {};
            for (const [key, value] of Object.entries(obj)) {
                resolved[key] = this.resolveObjectVariables(value, node);
            }
            return resolved;
        }
        
        return obj;
    }

    /**
     * Execute node-specific logic (simulated for now, to be implemented per node type)
     * @param {Object} node - Node to execute
     * @param {Object} inputs - Input data
     * @returns {Promise<Object>} Output data
     */
    async runNodeLogic(node, inputs) {
        // Resolve variables in node properties before execution
        const resolvedProperties = this.resolveObjectVariables(
            node.properties || {},
            node
        );
        
        // Create a temporary node object with resolved properties
        const resolvedNode = {
            ...node,
            properties: resolvedProperties
        };
        // Simulate execution delay
        await this.sleep(300 + Math.random() * 200);

        // Different logic based on node type (use resolvedNode for execution)
        switch (resolvedNode.type) {
            case 'webhook':
                return this.executeWebhook(resolvedNode, inputs);
            
            case 'form':
                return this.executeForm(resolvedNode, inputs);
            
            case 'chatgpt':
            case 'gemini':
                return this.executeAI(resolvedNode, inputs);
            
            case 'filter':
                return this.executeFilter(resolvedNode, inputs);
            
            case 'transform':
                return this.executeTransform(resolvedNode, inputs);
            
            case 'email-send':
                return this.executeEmailSend(resolvedNode, inputs);
            
            case 'slack':
                return this.executeSlack(resolvedNode, inputs);
            
            case 'api-call':
                return this.executeAPICall(resolvedNode, inputs);
            
            default:
                return this.executeGeneric(resolvedNode, inputs);
        }
    }

    /**
     * Execute webhook node (generates sample data)
     */
    executeWebhook(node, inputs) {
        return {
            status: 200,
            method: node.properties.method || 'POST',
            url: node.properties.url || '/webhook',
            body: {
                timestamp: new Date().toISOString(),
                data: 'Sample webhook data',
                source: 'webhook-trigger'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }

    /**
     * Execute form node (generates sample form data)
     */
    executeForm(node, inputs) {
        return {
            formName: node.properties.formName || 'Contact Form',
            fields: {
                nombre: 'Juan Pérez',
                email: 'juan@example.com',
                empresa: 'Acme Corp',
                telefono: '+1234567890',
                mensaje: 'Interesado en los servicios'
            },
            submittedAt: new Date().toISOString()
        };
    }

    /**
     * Execute AI node (simulates AI processing)
     */
    executeAI(node, inputs) {
        // Get first input data
        const inputKeys = Object.keys(inputs);
        const firstInput = inputKeys.length > 0 ? inputs[inputKeys[0]] : {};
        
        // The systemPrompt has already been resolved with variables
        const resolvedPrompt = node.properties.systemPrompt || 'Process this data';
        
        return {
            model: node.properties.model || 'gpt-4',
            prompt: resolvedPrompt,
            input: firstInput,
            response: {
                text: `Processed by ${node.type}: AI response based on prompt "${resolvedPrompt.substring(0, 50)}..." and input data.`,
                confidence: 0.95,
                tokens: 150,
                variables_resolved: true
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Execute filter node (applies conditions)
     */
    executeFilter(node, inputs) {
        const inputKeys = Object.keys(inputs);
        const firstInput = inputKeys.length > 0 ? inputs[inputKeys[0]] : {};
        
        // Simple filter logic (always passes for now)
        const passed = true;
        
        return {
            filtered: passed,
            input: firstInput,
            conditions: node.properties.conditions || [],
            operator: node.properties.operator || 'AND'
        };
    }

    /**
     * Execute transform node (transforms data)
     */
    executeTransform(node, inputs) {
        const inputKeys = Object.keys(inputs);
        const firstInput = inputKeys.length > 0 ? inputs[inputKeys[0]] : {};
        
        return {
            transformed: true,
            input: firstInput,
            output: {
                ...firstInput,
                transformed_at: new Date().toISOString(),
                node_type: node.type
            },
            mappings: node.properties.mappings || {}
        };
    }

    /**
     * Execute email send node
     */
    executeEmailSend(node, inputs) {
        const inputKeys = Object.keys(inputs);
        const firstInput = inputKeys.length > 0 ? inputs[inputKeys[0]] : {};
        
        // Properties are already resolved with variables
        return {
            sent: true,
            provider: node.properties.provider || 'SMTP',
            to: node.properties.to || firstInput.email || 'recipient@example.com',
            subject: node.properties.subject || 'Email from Nexus AI Workflow',
            body: node.properties.body || 'Email body content',
            variables_resolved: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Execute Slack node
     */
    executeSlack(node, inputs) {
        const inputKeys = Object.keys(inputs);
        const firstInput = inputKeys.length > 0 ? inputs[inputKeys[0]] : {};
        
        // Properties are already resolved with variables
        return {
            sent: true,
            channel: node.properties.channel || '#general',
            message: node.properties.message || JSON.stringify(firstInput, null, 2),
            variables_resolved: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Execute API call node
     */
    executeAPICall(node, inputs) {
        const inputKeys = Object.keys(inputs);
        const firstInput = inputKeys.length > 0 ? inputs[inputKeys[0]] : {};
        
        return {
            status: 200,
            method: node.properties.method || 'POST',
            url: node.properties.url || 'https://api.example.com',
            response: {
                success: true,
                data: firstInput
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Execute generic node (fallback)
     */
    executeGeneric(node, inputs) {
        return {
            nodeType: node.type,
            executed: true,
            inputs: inputs,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Highlight node with visual feedback during execution
     * @param {HTMLElement} element - Node element
     * @param {string} state - State: 'executing', 'success', 'error'
     */
    highlightNode(element, state) {
        if (!element) return;

        // Remove previous states
        element.classList.remove('node-executing', 'node-success', 'node-error');

        // Add new state
        switch (state) {
            case 'executing':
                element.classList.add('node-executing');
                break;
            case 'success':
                element.classList.add('node-success');
                setTimeout(() => {
                    element.classList.remove('node-success');
                }, 1000);
                break;
            case 'error':
                element.classList.add('node-error');
                setTimeout(() => {
                    element.classList.remove('node-error');
                }, 2000);
                break;
        }
    }

    /**
     * Log execution event
     * @param {string} level - Log level: 'info', 'success', 'warning', 'error'
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     */
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            executionId: this.executionId,
            ...data
        };

        this.executionLogs.push(logEntry);

        // Console output with emoji
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[level] || '📝';

        console.log(`${emoji} [ExecutionEngine] ${message}`, data);
    }

    /**
     * Sleep utility for simulating async operations
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get execution logs
     * @returns {Array} Array of log entries
     */
    getLogs() {
        return this.executionLogs;
    }

    /**
     * Get execution context (all node outputs)
     * @returns {Object} Execution context
     */
    getContext() {
        return Object.fromEntries(this.executionContext);
    }

    /**
     * Clear execution state
     */
    clear() {
        this.executionContext.clear();
        this.executionLogs = [];
        this.executionId = null;
        console.log('🧹 Execution state cleared');
    }
}
