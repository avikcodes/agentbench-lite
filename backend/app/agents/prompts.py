from __future__ import annotations

import json

from app.schemas.execution import AgentTaskPayload, ExecutionTraceStep


def build_agent_prompt(
    task: AgentTaskPayload,
    trace: list[ExecutionTraceStep],
) -> str:
    allowed_tools = task.allowed_tools or []
    history = [
        {
            "step_number": step.step_number,
            "reasoning_step": step.reasoning_step,
            "selected_tool": step.selected_tool,
            "tool_input": step.tool_input,
            "tool_output": step.tool_output,
            "status": step.status,
            "error_message": step.error_message,
        }
        for step in trace
    ]

    return (
        "You are an agent runner for benchmark tasks.\n"
        "Decide the next best action for the task.\n"
        "You must respond with valid JSON only.\n"
        "Schema:\n"
        "{\n"
        '  "reasoning": "short explanation",\n'
        '  "action": "tool" or "final",\n'
        '  "tool_name": "tool name when action is tool",\n'
        '  "tool_input": {"key": "value"},\n'
        '  "final_answer": "answer when action is final"\n'
        "}\n"
        "Rules:\n"
        "- Use only allowed tools.\n"
        "- If no tool is needed, return action final.\n"
        "- If previous tool output already answers the task, return final.\n"
        "- Never include markdown fences.\n\n"
        f"Task ID: {task.task_id}\n"
        f"Question: {task.question}\n"
        f"Allowed tools: {json.dumps(allowed_tools)}\n"
        f"Execution history: {json.dumps(history)}\n"
    )
