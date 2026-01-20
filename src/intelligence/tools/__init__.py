from typing import Callable, Any
from dataclasses import dataclass


@dataclass
class ToolResult:
    success: bool
    data: Any = None
    error: str = None


ToolFunction = Callable[..., ToolResult]


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, tuple[ToolFunction, dict]] = {}

    def register(self, name: str, description: str, parameters: dict) -> Callable:
        def decorator(func: ToolFunction):
            self._tools[name] = (func, {
                "description": description,
                "parameters": parameters,
            })
            return func
        return decorator

    def get_tool(self, name: str) -> tuple[ToolFunction, dict]:
        if name not in self._tools:
            raise ValueError(f"Unknown tool: {name}")
        return self._tools[name]

    def list_tools(self) -> dict:
        return {name: info for name, info in self._tools.items()}

    def get_descriptions(self) -> dict:
        return {
            name: {"description": info["description"], "parameters": info["parameters"]}
            for name, info in self._tools.items()
        }


registry = ToolRegistry()
