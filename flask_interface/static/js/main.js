/**
 * Aider Web Interface JavaScript
 * 
 * This file contains the client-side JavaScript code for the Aider Web Interface.
 * It handles user interactions, WebSocket communication, and UI updates.
 */

// Global variables
let currentSessionId = null;
let socket = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSocketConnection();
    setupEventListeners();
    loadSettings();
});

// Initialize WebSocket connection
function initializeSocketConnection() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        addSystemMessage('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        addSystemMessage('Disconnected from server');
    });
    
    socket.on('tool_output', (data) => {
        if (data.session_id === currentSessionId) {
            addSystemMessage(data.output);
        }
    });
}

// Load settings from localStorage
function loadSettings() {
    const model = localStorage.getItem('aider_model');
    const apiKey = localStorage.getItem('aider_api_key');
    const editFormat = localStorage.getItem('aider_edit_format');
    const useRepoMap = localStorage.getItem('aider_use_repo_map');
    const streaming = localStorage.getItem('aider_streaming');
    const useSystemPrompt = localStorage.getItem('aider_use_system_prompt');
    const sendUndoReply = localStorage.getItem('aider_send_undo_reply');
    const lazy = localStorage.getItem('aider_lazy');
    const useTemperature = localStorage.getItem('aider_use_temperature');
    const reminder = localStorage.getItem('aider_reminder');
    const weakModel = localStorage.getItem('aider_weak_model');
    
    // Basic settings
    if (model) {
        document.getElementById('modelSelect').value = model;
    }
    
    if (apiKey) {
        document.getElementById('apiKeyInput').value = apiKey;
    }
    
    if (editFormat) {
        document.getElementById('editFormatSelect').value = editFormat;
    }
    
    // Advanced settings
    if (useRepoMap !== null) {
        document.getElementById('useRepoMapSwitch').checked = useRepoMap === 'true';
    }
    
    if (streaming !== null) {
        document.getElementById('streamingSwitch').checked = streaming === 'true';
    }
    
    if (useSystemPrompt !== null) {
        document.getElementById('useSystemPromptSwitch').checked = useSystemPrompt === 'true';
    }
    
    if (sendUndoReply !== null) {
        document.getElementById('sendUndoReplySwitch').checked = sendUndoReply === 'true';
    }
    
    if (lazy !== null) {
        document.getElementById('lazySwitch').checked = lazy === 'true';
    }
    
    if (useTemperature !== null) {
        document.getElementById('useTemperatureSwitch').checked = useTemperature === 'true';
    }
    
    if (reminder) {
        document.getElementById('reminderSelect').value = reminder;
    }
    
    if (weakModel) {
        document.getElementById('weakModelSelect').value = weakModel;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Send message
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Load repository
    document.getElementById('loadRepoBtn').addEventListener('click', loadRepository);
    
    // Refresh files
    document.getElementById('refreshFilesBtn').addEventListener('click', getRepositoryFiles);
    
    // Add files to chat
    document.getElementById('addFilesBtn').addEventListener('click', showFileSelectionModal);
    document.getElementById('confirmAddFilesBtn').addEventListener('click', addSelectedFilesToChat);
    
    // Save settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // New session
    document.getElementById('newSessionBtn').addEventListener('click', startNewSession);
    
    // Commit changes
    document.getElementById('commitChangesBtn').addEventListener('click', commitChanges);
}

// Start a new session
function startNewSession() {
    const repoPath = document.getElementById('repoPathInput').value.trim();
    
    // Get model configuration settings
    const model = document.getElementById('modelSelect').value;
    const editFormat = localStorage.getItem('aider_edit_format') || 'whole';
    const useRepoMap = localStorage.getItem('aider_use_repo_map') === 'true';
    const streaming = localStorage.getItem('aider_streaming') === 'true';
    const useSystemPrompt = localStorage.getItem('aider_use_system_prompt') === 'true';
    const sendUndoReply = localStorage.getItem('aider_send_undo_reply') === 'true';
    const lazy = localStorage.getItem('aider_lazy') === 'true';
    const useTemperature = localStorage.getItem('aider_use_temperature') === 'true';
    const reminder = localStorage.getItem('aider_reminder') || 'user';
    const weakModel = localStorage.getItem('aider_weak_model') || '';
    
    // Create model configuration object
    const modelConfig = {
        name: model,
        edit_format: editFormat,
        weak_model_name: weakModel || null,
        use_repo_map: useRepoMap,
        send_undo_reply: sendUndoReply,
        lazy: lazy,
        reminder: reminder,
        use_system_prompt: useSystemPrompt,
        use_temperature: useTemperature,
        streaming: streaming
    };
    
    fetch('/api/start_session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            repo_path: repoPath,
            model_name: model,
            model_config: modelConfig
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            currentSessionId = data.session_id;
            document.getElementById('chatMessages').innerHTML = '';
            addSystemMessage(`New session started with model: ${data.model}`);
            addSystemMessage(`Repository: ${data.repo_path}`);
            
            if (repoPath) {
                getRepositoryFiles();
            }
        } else {
            addSystemMessage(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        addSystemMessage(`Error: ${error.message}`);
    });
}

// Load repository
function loadRepository() {
    const repoPath = document.getElementById('repoPathInput').value.trim();
    
    if (!repoPath) {
        addSystemMessage('Please enter a repository path');
        return;
    }
    
    startNewSession();
}

// Get repository files
function getRepositoryFiles() {
    if (!currentSessionId) {
        addSystemMessage('No active session. Please start a new session first.');
        return;
    }
    
    fetch('/api/get_repo_files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: currentSessionId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateFileList(data.files);
        } else {
            addSystemMessage(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        addSystemMessage(`Error: ${error.message}`);
    });
}

// Update file list
function updateFileList(files) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<div class="text-muted">No files found</div>';
        return;
    }
    
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = file;
        fileItem.dataset.path = file;
        
        fileItem.addEventListener('click', () => {
            fileItem.classList.toggle('active');
        });
        
        fileList.appendChild(fileItem);
    });
}

// Show file selection modal
function showFileSelectionModal() {
    if (!currentSessionId) {
        addSystemMessage('No active session. Please start a new session first.');
        return;
    }
    
    const fileSelectionList = document.getElementById('fileSelectionList');
    fileSelectionList.innerHTML = '';
    
    const fileItems = document.getElementById('fileList').querySelectorAll('.file-item');
    
    if (fileItems.length === 0) {
        fileSelectionList.innerHTML = '<div class="text-muted">No files available</div>';
    } else {
        fileItems.forEach(item => {
            const filePath = item.dataset.path;
            
            const checkboxItem = document.createElement('div');
            checkboxItem.className = 'form-check';
            
            const checkbox = document.createElement('input');
            checkbox.className = 'form-check-input';
            checkbox.type = 'checkbox';
            checkbox.id = `file-${filePath}`;
            checkbox.dataset.path = filePath;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `file-${filePath}`;
            label.textContent = filePath;
            
            checkboxItem.appendChild(checkbox);
            checkboxItem.appendChild(label);
            fileSelectionList.appendChild(checkboxItem);
        });
    }
    
    const modal = new bootstrap.Modal(document.getElementById('fileSelectionModal'));
    modal.show();
}

// Add selected files to chat
function addSelectedFilesToChat() {
    const selectedFiles = [];
    const checkboxes = document.getElementById('fileSelectionList').querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        selectedFiles.push(checkbox.dataset.path);
    });
    
    if (selectedFiles.length === 0) {
        addSystemMessage('No files selected');
        return;
    }
    
    fetch('/api/add_files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: currentSessionId,
            file_paths: selectedFiles
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            addSystemMessage(`Added files to chat: ${data.added_files.join(', ')}`);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('fileSelectionModal'));
            modal.hide();
        } else {
            addSystemMessage(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        addSystemMessage(`Error: ${error.message}`);
    });
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    if (!currentSessionId) {
        addSystemMessage('No active session. Please start a new session first.');
        return;
    }
    
    // Add user message to chat
    addUserMessage(message);
    
    // Clear input
    messageInput.value = '';
    
    // Show loading indicator
    const loadingMessage = addSystemMessage('<div class="loading"></div> Processing...');
    
    // Send message to server
    fetch('/api/send_message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: currentSessionId,
            message: message
        })
    })
    .then(response => response.json())
    .then(data => {
        // Remove loading indicator
        loadingMessage.remove();
        
        if (data.status === 'success') {
            addAssistantMessage(data.response);
        } else {
            addSystemMessage(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        // Remove loading indicator
        loadingMessage.remove();
        
        addSystemMessage(`Error: ${error.message}`);
    });
}

// Commit changes
function commitChanges() {
    if (!currentSessionId) {
        addSystemMessage('No active session. Please start a new session first.');
        return;
    }
    
    const commitMessage = document.getElementById('commitMessageInput').value.trim();
    
    if (!commitMessage) {
        addSystemMessage('Please enter a commit message');
        return;
    }
    
    fetch('/api/commit_changes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            session_id: currentSessionId,
            commit_message: commitMessage
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            addSystemMessage(`Changes committed: ${data.message}`);
            document.getElementById('commitMessageInput').value = '';
        } else {
            addSystemMessage(`Error: ${data.message}`);
        }
    })
    .catch(error => {
        addSystemMessage(`Error: ${error.message}`);
    });
}

// Save settings
function saveSettings() {
    // Get basic settings
    const model = document.getElementById('modelSelect').value;
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const editFormat = document.getElementById('editFormatSelect').value;
    
    // Get advanced settings
    const useRepoMap = document.getElementById('useRepoMapSwitch').checked;
    const streaming = document.getElementById('streamingSwitch').checked;
    const useSystemPrompt = document.getElementById('useSystemPromptSwitch').checked;
    const sendUndoReply = document.getElementById('sendUndoReplySwitch').checked;
    const lazy = document.getElementById('lazySwitch').checked;
    const useTemperature = document.getElementById('useTemperatureSwitch').checked;
    const reminder = document.getElementById('reminderSelect').value;
    const weakModel = document.getElementById('weakModelSelect').value;
    
    // Store settings in localStorage
    localStorage.setItem('aider_model', model);
    localStorage.setItem('aider_edit_format', editFormat);
    localStorage.setItem('aider_use_repo_map', useRepoMap);
    localStorage.setItem('aider_streaming', streaming);
    localStorage.setItem('aider_use_system_prompt', useSystemPrompt);
    localStorage.setItem('aider_send_undo_reply', sendUndoReply);
    localStorage.setItem('aider_lazy', lazy);
    localStorage.setItem('aider_use_temperature', useTemperature);
    localStorage.setItem('aider_reminder', reminder);
    localStorage.setItem('aider_weak_model', weakModel);
    
    if (apiKey) {
        localStorage.setItem('aider_api_key', apiKey);
    }
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    modal.hide();
    
    addSystemMessage('Model configuration saved');
}

// Add user message to chat
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.textContent = message;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add assistant message to chat
function addAssistantMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message assistant-message';
    messageElement.innerHTML = marked.parse(message);
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add system message to chat
function addSystemMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';
    messageElement.innerHTML = message;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageElement;
}
