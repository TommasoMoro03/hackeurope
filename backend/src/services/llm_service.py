from openai import OpenAI
from src.config import settings
from typing import Optional, List, Dict, Any


class LLMService:
    """
    Centralized service for making OpenAI API calls.
    """

    def __init__(self):
        """Initialize OpenAI client with API key from settings."""
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def call_llm(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False
    ) -> str:
        """
        Make a call to OpenAI's LLM and return the response.

        Args:
            prompt: The user prompt/message to send to the LLM
            system_message: Optional system message to set LLM behavior
            temperature: Controls randomness (0-2). Lower is more deterministic.
            max_tokens: Maximum tokens in the response. None = model default.
            json_mode: If True, forces the model to return valid JSON

        Returns:
            The LLM's response as a string

        Raises:
            Exception: If the API call fails
        """
        try:
            messages = []

            # Add system message if provided
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })

            # Add user prompt
            messages.append({
                "role": "user",
                "content": prompt
            })

            # Prepare kwargs for the API call
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
            }

            if max_tokens:
                kwargs["max_tokens"] = max_tokens

            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            # Make the API call
            response = self.client.chat.completions.create(**kwargs)

            # Extract and return the response content
            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"LLM API call failed: {str(e)}")

    def call_llm_sync(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False
    ) -> str:
        """
        Synchronous version of call_llm for non-async contexts.

        Args:
            prompt: The user prompt/message to send to the LLM
            system_message: Optional system message to set LLM behavior
            temperature: Controls randomness (0-2). Lower is more deterministic.
            max_tokens: Maximum tokens in the response. None = model default.
            json_mode: If True, forces the model to return valid JSON

        Returns:
            The LLM's response as a string

        Raises:
            Exception: If the API call fails
        """
        try:
            messages = []

            # Add system message if provided
            if system_message:
                messages.append({
                    "role": "system",
                    "content": system_message
                })

            # Add user prompt
            messages.append({
                "role": "user",
                "content": prompt
            })

            # Prepare kwargs for the API call
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
            }

            if max_tokens:
                kwargs["max_tokens"] = max_tokens

            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            # Make the API call
            response = self.client.chat.completions.create(**kwargs)

            # Extract and return the response content
            return response.choices[0].message.content

        except Exception as e:
            raise Exception(f"LLM API call failed: {str(e)}")


# Singleton instance
_llm_service = None


def get_llm_service() -> LLMService:
    """
    Get or create the LLM service singleton instance.

    Returns:
        LLMService: The singleton LLM service instance
    """
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
