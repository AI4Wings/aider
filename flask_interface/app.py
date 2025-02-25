import os
import json
from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO
import aider
from aider_integration import create_session, WebIO, AiderSession

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory storage for chat sessions
chat_sessions = {}

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/api/start_session', methods=['POST'])
def start_session():
    """Start a new aider session with the specified settings."""
    data = request.json
    session_id = os.urandom(16).hex()
    
    # Create a session with default settings
    model_name = data.get('model_name', 'gpt-4o')
    repo_path = data.get('repo_path', '')
    
    try:
        # Create a new aider session
        def emit_callback(event, data):
            socketio.emit(event, data)
        
        aider_session = create_session(
            session_id=session_id,
            model_name=model_name,
            repo_path=repo_path,
            emit_callback=emit_callback
        )
        
        # Store session
        chat_sessions[session_id] = aider_session
        
        return jsonify({
            'status': 'success',
            'session_id': session_id,
            'model': model_name,
            'repo_path': repo_path if repo_path else 'No repository selected'
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/send_message', methods=['POST'])
def send_message():
    """Process a user message and get a response from aider."""
    data = request.json
    session_id = data.get('session_id')
    message = data.get('message', '')
    
    if not session_id or session_id not in chat_sessions:
        return jsonify({
            'status': 'error',
            'message': 'Invalid session ID'
        }), 400
    
    aider_session = chat_sessions[session_id]
    
    try:
        # Send message and get response
        response = aider_session.send_message(message)
        
        return jsonify({
            'status': 'success',
            'response': response
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/add_files', methods=['POST'])
def add_files():
    """Add files to the current aider session."""
    data = request.json
    session_id = data.get('session_id')
    file_paths = data.get('file_paths', [])
    
    if not session_id or session_id not in chat_sessions:
        return jsonify({
            'status': 'error',
            'message': 'Invalid session ID'
        }), 400
    
    aider_session = chat_sessions[session_id]
    
    try:
        # Add files to the coder
        added_files = aider_session.add_files(file_paths)
        
        return jsonify({
            'status': 'success',
            'added_files': added_files
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/get_repo_files', methods=['POST'])
def get_repo_files():
    """Get a list of files in the repository."""
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id or session_id not in chat_sessions:
        return jsonify({
            'status': 'error',
            'message': 'Invalid session ID'
        }), 400
    
    aider_session = chat_sessions[session_id]
    
    try:
        files = aider_session.get_repo_files()
        if files:
            return jsonify({
                'status': 'success',
                'files': files
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'No repository is associated with this session or no files found'
            }), 400
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/commit_changes', methods=['POST'])
def commit_changes():
    """Commit changes to the repository."""
    data = request.json
    session_id = data.get('session_id')
    commit_message = data.get('commit_message', '')
    
    if not session_id or session_id not in chat_sessions:
        return jsonify({
            'status': 'error',
            'message': 'Invalid session ID'
        }), 400
    
    aider_session = chat_sessions[session_id]
    
    try:
        commit_hash = aider_session.commit_changes(commit_message)
        if commit_hash:
            return jsonify({
                'status': 'success',
                'commit_hash': commit_hash,
                'message': f'Changes committed with hash: {commit_hash}'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'No repository is associated with this session or no changes to commit'
            }), 400
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection to WebSocket."""
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection from WebSocket."""
    print('Client disconnected')

if __name__ == '__main__':
    # Create templates and static directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
