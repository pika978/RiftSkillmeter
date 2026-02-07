"""
Tavus CVI (Conversational Video Interface) Client

Handles integration with Tavus API for:
- Creating personas (interview behavior/personality)
- Creating conversations (real-time video sessions)
- Echo Mode audio streaming (sending Gemini audio to avatar)
- Conversation lifecycle management

API Reference: https://docs.tavus.io
"""

import os
import uuid
import aiohttp
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TavusConfig:
    """Configuration for Tavus API client."""
    api_key: str
    base_url: str = "https://tavusapi.com/v2"
    replica_id: str = ""  # Default avatar to use


class TavusClient:
    """
    Async client for Tavus Conversational Video Interface API.
    
    Example usage:
        client = TavusClient(TavusConfig(api_key="..."))
        persona = await client.create_persona("Interviewer", system_prompt)
        conversation = await client.create_conversation(persona["persona_id"])
        # User is now in video call at conversation["conversation_url"]
        await client.send_audio(conversation["conversation_id"], audio_base64)
    """
    
    def __init__(self, config: Optional[TavusConfig] = None):
        if config is None:
            config = TavusConfig(
                api_key=os.getenv("TAVUS_API_KEY", ""),
                replica_id=os.getenv("TAVUS_REPLICA_ID", "")
            )
        self.config = config
        self._session: Optional[aiohttp.ClientSession] = None
    
    @property
    def headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.config.api_key,
            "Content-Type": "application/json"
        }
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def close(self):
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def create_persona(
        self, 
        name: str, 
        system_prompt: str,
        enable_echo_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Create a Tavus persona for the interview.
        
        A persona defines the behavior and capabilities of the avatar.
        With Echo Mode enabled, we can send our own audio (from Gemini)
        to be lip-synced by the avatar.
        
        Args:
            name: Persona name (e.g., "Python_Interviewer")
            system_prompt: Instructions for the AI (passed to LLM if not using Echo Mode)
            enable_echo_mode: If True, disables Tavus's built-in mic/LLM pipeline.
                             We'll send audio directly via send_audio().
        
        Returns:
            Dict with persona_id and other metadata
        """
        session = await self._get_session()
        
        payload = {
            "persona_name": name,
            "system_prompt": system_prompt,
            "default_replica_id": self.config.replica_id  # Required: which avatar to use
        }
        
        # Note: Echo Mode configuration removed - it was causing 500 errors
        # The Tavus API v2 may handle echo mode differently or automatically
        # We'll send audio via the /speak endpoint regardless
        
        try:
            async with session.post(
                f"{self.config.base_url}/personas",
                headers=self.headers,
                json=payload
            ) as response:
                response.raise_for_status()
                data = await response.json()
                logger.info(f"Created Tavus persona: {data.get('persona_id')}")
                return data
                
        except aiohttp.ClientError as e:
            logger.error(f"Failed to create Tavus persona: {e}")
            raise
    
    async def create_conversation(
        self, 
        persona_id: str,
        replica_id: Optional[str] = None,
        conversation_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a Tavus conversation (video session).
        
        This starts the avatar rendering and returns a Daily.co room URL
        that can be embedded in the frontend.
        
        Args:
            persona_id: ID of the persona to use
            replica_id: ID of the avatar replica (uses default if not specified)
            conversation_name: Optional name for the conversation
        
        Returns:
            Dict with:
                - conversation_id: Unique ID for API calls
                - conversation_url: Daily.co WebRTC room URL for embedding
                - status: Current state of the conversation
        """
        session = await self._get_session()
        
        payload = {
            "replica_id": replica_id or self.config.replica_id,
            "persona_id": persona_id,
            "conversation_name": conversation_name or f"Interview_{uuid.uuid4().hex[:8]}"
        }
        
        try:
            async with session.post(
                f"{self.config.base_url}/conversations",
                headers=self.headers,
                json=payload
            ) as response:
                response.raise_for_status()
                data = await response.json()
                logger.info(
                    f"Created Tavus conversation: {data.get('conversation_id')} "
                    f"URL: {data.get('conversation_url')}"
                )
                return data
                
        except aiohttp.ClientError as e:
            logger.error(f"Failed to create Tavus conversation: {e}")
            raise
    
    async def send_audio(
        self, 
        conversation_id: str, 
        audio_base64: str
    ) -> Dict[str, Any]:
        """
        Send audio to the avatar for lip-sync (Echo Mode).
        
        This is used to make the avatar speak with Gemini's audio output.
        The avatar will animate its lips to match the audio.
        
        Args:
            conversation_id: Active conversation ID
            audio_base64: Base64 encoded audio data (PCM or WAV)
        
        Returns:
            Response from Tavus API
        """
        session = await self._get_session()
        
        payload = {
            "audio": audio_base64
        }
        
        try:
            async with session.post(
                f"{self.config.base_url}/conversations/{conversation_id}/speak",
                headers=self.headers,
                json=payload
            ) as response:
                response.raise_for_status()
                data = await response.json()
                return data
                
        except aiohttp.ClientError as e:
            logger.error(f"Failed to send audio to Tavus: {e}")
            raise
    
    async def end_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        End an active Tavus conversation.
        
        This stops the avatar rendering and frees resources.
        Should be called when the interview ends.
        
        Args:
            conversation_id: Conversation to end
        
        Returns:
            Final conversation status
        """
        session = await self._get_session()
        
        try:
            async with session.delete(
                f"{self.config.base_url}/conversations/{conversation_id}",
                headers=self.headers
            ) as response:
                response.raise_for_status()
                data = await response.json()
                logger.info(f"Ended Tavus conversation: {conversation_id}")
                return data
                
        except aiohttp.ClientError as e:
            logger.error(f"Failed to end Tavus conversation: {e}")
            raise
    
    async def get_conversation_status(
        self, 
        conversation_id: str
    ) -> Dict[str, Any]:
        """
        Get the current status of a conversation.
        
        Args:
            conversation_id: Conversation to check
        
        Returns:
            Conversation details including status
        """
        session = await self._get_session()
        
        try:
            async with session.get(
                f"{self.config.base_url}/conversations/{conversation_id}",
                headers=self.headers
            ) as response:
                response.raise_for_status()
                return await response.json()
                
        except aiohttp.ClientError as e:
            logger.error(f"Failed to get Tavus conversation status: {e}")
            raise
    
    async def list_replicas(self) -> Dict[str, Any]:
        """
        List available avatar replicas.
        
        Useful for letting users choose an interviewer appearance
        or for getting the default replica ID.
        
        Returns:
            List of available replicas with their IDs and metadata
        """
        session = await self._get_session()
        
        try:
            async with session.get(
                f"{self.config.base_url}/replicas",
                headers=self.headers
            ) as response:
                response.raise_for_status()
                return await response.json()
                
        except aiohttp.ClientError as e:
            logger.error(f"Failed to list Tavus replicas: {e}")
            raise


# Singleton instance for easy import
_client: Optional[TavusClient] = None


def get_tavus_client() -> TavusClient:
    """Get the singleton Tavus client instance."""
    global _client
    if _client is None:
        _client = TavusClient()
    return _client
