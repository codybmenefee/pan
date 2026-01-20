import json
from typing import AsyncIterator, Optional
from dataclasses import dataclass

import httpx

from .config import LLMConfig


@dataclass
class ToolDefinition:
    name: str
    description: str
    input_schema: dict


@dataclass
class ToolCall:
    name: str
    arguments: dict


@dataclass
class Message:
    role: str
    content: str
    tool_calls: Optional[list[ToolCall]] = None


class LLMClient:
    def __init__(self, config: LLMConfig):
        self.config = config
        self.client = httpx.AsyncClient(timeout=config.timeout_seconds)

    async def close(self):
        await self.client.aclose()

    async def complete(
        self,
        messages: list[dict],
        tools: Optional[list[ToolDefinition]] = None,
        stream: bool = True,
    ) -> AsyncIterator[dict]:
        headers = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }

        if self.config.provider == "anthropic":
            headers["x-api-key"] = self.config.api_key
            url = "https://api.anthropic.com/v1/messages"
        elif self.config.provider == "openrouter":
            headers["Authorization"] = f"Bearer {self.config.api_key}"
            url = f"{self.config.base_url}/chat/completions"
        else:
            raise ValueError(f"Unknown provider: {self.config.provider}")

        payload = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "messages": messages,
        }

        if tools:
            payload["tools"] = [self._tool_to_openai(t) for t in tools]

        async with self.client.stream("POST", url, headers=headers, json=payload) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        yield chunk
                    except json.JSONDecodeError:
                        continue

    def _tool_to_openai(self, tool: ToolDefinition) -> dict:
        return {
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.input_schema,
        }


async def create_message(
    client: LLMClient,
    messages: list[dict],
    tools: Optional[list[ToolDefinition]] = None,
) -> dict:
    full_response = ""
    tool_calls = []

    async for chunk in client.complete(messages, tools):
        if "content" in chunk:
            for block in chunk["content"]:
                if block["type"] == "text":
                    full_response += block["text"]
                elif block["type"] == "tool_use":
                    tool_calls.append(
                        ToolCall(
                            name=block["name"],
                            arguments=block["input"],
                        )
                    )

    return {
        "role": "assistant",
        "content": full_response,
        "tool_calls": tool_calls if tool_calls else None,
    }


async def extract_text_response(response: dict) -> str:
    content = response.get("content", "")
    if isinstance(content, list):
        text_parts = [
            block.get("text", "") for block in content if block.get("type") == "text"
        ]
        return "".join(text_parts)
    return content


def parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    return json.loads(text)


def format_tools_for_anthropic(tools: dict) -> list[ToolDefinition]:
    result = []
    for name, tool in tools.items():
        result.append(
            ToolDefinition(
                name=name,
                description=tool.get("description", ""),
                input_schema=tool.get("parameters", {}),
            )
        )
    return result
