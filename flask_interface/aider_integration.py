"""
Aider Integration Module

This module provides utilities for integrating aider's core functionality
into the Flask web interface.
"""

import os
import json
from typing import List, Dict, Any, Optional

from aider.models import Model, ModelSettings
from aider.coders import Coder, EditBlockCoder, WholeFileCoder, UnifiedDiffCoder
from aider.io import InputOutput
from aider.repo import GitRepo
from aider.commands import Commands
from aider.repomap import RepoMap

class WebIO(InputOutput):
    """
    Custom InputOutput implementation for web interface.
    
    This class extends aider's InputOutput class to redirect terminal output
    to the web interface via WebSocket.
    """
    
    def __init__(self, session_id, emit_callback=None):
        """
        Initialize WebIO.
        
        Args:
            session_id: Unique identifier for the session
            emit_callback: Callback function for emitting messages via WebSocket
        """
        super().__init__()
        self.session_id = session_id
        self.emit_callback = emit_callback
        self.output_buffer = []
    
    def tool_output(self, output):
        """
        Handle tool output by sending it to the client.
        
        Args:
            output: Output string from aider
        """
        self.output_buffer.append(output)
        if self.emit_callback:
            self.emit_callback('tool_output', {
                'session_id': self.session_id,
                'output': output
            })
    
    def user_input(self, prompt=None):
        """
        Not used in web interface as input comes via API.
        
        Args:
            prompt: Input prompt (not used)
        
        Returns:
            None
        """
        return None
    
    def get_output_buffer(self):
        """
        Get and clear the output buffer.
        
        Returns:
            String containing all buffered output
        """
        output = '\n'.join(self.output_buffer)
        self.output_buffer = []
        return output

class AiderSession:
    """
    Manages an aider session for the web interface.
    
    This class encapsulates all the components needed for an aider session,
    including the model, coder, git repository, and commands.
    """
    
    def __init__(self, session_id, model_name='gpt-4o', repo_path=None, model_config=None, emit_callback=None):
        """
        Initialize an AiderSession.
        
        Args:
            session_id: Unique identifier for the session
            model_name: Name of the AI model to use
            repo_path: Path to the Git repository
            model_config: Configuration settings for the model
            emit_callback: Callback function for emitting messages via WebSocket
        """
        self.session_id = session_id
        self.model_name = model_name
        self.repo_path = repo_path
        
        # Initialize components
        self.io = WebIO(session_id, emit_callback)
        
        # Create model with configuration settings
        if model_config:
            # Create a ModelSettings instance with the provided configuration
            model_settings = ModelSettings(
                name=model_name,
                edit_format=model_config.get('edit_format', 'whole'),
                weak_model_name=model_config.get('weak_model_name'),
                use_repo_map=model_config.get('use_repo_map', False),
                send_undo_reply=model_config.get('send_undo_reply', False),
                lazy=model_config.get('lazy', False),
                reminder=model_config.get('reminder', 'user'),
                examples_as_sys_msg=model_config.get('examples_as_sys_msg', False),
                use_system_prompt=model_config.get('use_system_prompt', True),
                use_temperature=model_config.get('use_temperature', True),
                streaming=model_config.get('streaming', True)
            )
            self.model = Model(settings=model_settings)
        else:
            # Use default model settings
            self.model = Model(name=model_name)
        
        if repo_path and os.path.isdir(repo_path):
            self.git_repo = GitRepo(repo_path)
            self.repo_map = RepoMap(self.git_repo)
        else:
            self.git_repo = None
            self.repo_map = None
        
        # Create the appropriate coder based on model settings
        if self.model.edit_format == 'diff':
            self.coder = UnifiedDiffCoder(
                io=self.io,
                model=self.model,
                git_repo=self.git_repo,
                repo_map=self.repo_map
            )
        elif self.model.edit_format == 'whole':
            self.coder = WholeFileCoder(
                io=self.io,
                model=self.model,
                git_repo=self.git_repo,
                repo_map=self.repo_map
            )
        else:
            self.coder = EditBlockCoder(
                io=self.io,
                model=self.model,
                git_repo=self.git_repo,
                repo_map=self.repo_map
            )
        
        # Create commands handler
        self.commands = Commands(io=self.io, coder=self.coder)
        
        # Chat history
        self.messages = []
    
    def add_files(self, file_paths: List[str]) -> List[str]:
        """
        Add files to the chat.
        
        Args:
            file_paths: List of file paths to add
        
        Returns:
            List of successfully added file paths
        """
        return self.coder.add_files(file_paths)
    
    def get_repo_files(self) -> List[str]:
        """
        Get a list of files in the repository.
        
        Returns:
            List of file paths in the repository
        """
        if self.git_repo:
            return self.git_repo.get_tracked_files()
        return []
    
    def send_message(self, message: str) -> str:
        """
        Send a message to the AI and get a response.
        
        Args:
            message: User message
        
        Returns:
            AI response
        """
        # Add message to history
        self.messages.append({
            'role': 'user',
            'content': message
        })
        
        # Process the message through aider
        response = self.coder.run_chat_completion(
            messages=self.messages
        )
        
        # Add response to history
        self.messages.append({
            'role': 'assistant',
            'content': response
        })
        
        return response
    
    def commit_changes(self, commit_message: str) -> Optional[str]:
        """
        Commit changes to the repository.
        
        Args:
            commit_message: Commit message
        
        Returns:
            Commit hash if successful, None otherwise
        """
        if self.git_repo:
            return self.git_repo.commit(commit_message)
        return None

def create_session(session_id: str, model_name: str = 'gpt-4o', 
                  repo_path: Optional[str] = None, 
                  model_config: Optional[Dict[str, Any]] = None,
                  emit_callback=None) -> AiderSession:
    """
    Create a new aider session.
    
    Args:
        session_id: Unique identifier for the session
        model_name: Name of the AI model to use
        repo_path: Path to the Git repository
        model_config: Configuration settings for the model
        emit_callback: Callback function for emitting messages via WebSocket
    
    Returns:
        AiderSession instance
    """
    return AiderSession(
        session_id=session_id,
        model_name=model_name,
        repo_path=repo_path,
        model_config=model_config,
        emit_callback=emit_callback
    )
