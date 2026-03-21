from __future__ import annotations

import subprocess
from typing import Any, Callable, Sequence


ShellRunner = Callable[[str, float], subprocess.CompletedProcess[str]]


class NoOpTrigger:
    def trigger(self) -> dict[str, Any]:
        return {
            "ok": True,
            "strategy": "noop",
            "executed": False,
            "commands": [],
        }


class AdbShellCommandTrigger:
    def __init__(
        self,
        commands: Sequence[str],
        runner: ShellRunner,
        *,
        timeout_seconds: float = 20.0,
    ) -> None:
        self.commands = [str(command).strip() for command in commands if str(command).strip()]
        self.runner = runner
        self.timeout_seconds = timeout_seconds

    def trigger(self) -> dict[str, Any]:
        if not self.commands:
            return {
                "ok": True,
                "strategy": "adb_shell_commands",
                "executed": False,
                "commands": [],
            }

        command_results: list[dict[str, Any]] = []
        ok = True
        for command in self.commands:
            result = self.runner(command, self.timeout_seconds)
            entry = {
                "command": command,
                "returncode": int(result.returncode),
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
            }
            command_results.append(entry)
            if result.returncode != 0:
                ok = False
                break

        return {
            "ok": ok,
            "strategy": "adb_shell_commands",
            "executed": True,
            "commands": command_results,
        }


def build_trigger(config: dict[str, Any], runner: ShellRunner):
    fresh_read = config.get("fresh_read", {})
    strategy = str(fresh_read.get("trigger_strategy", "noop")).strip() or "noop"
    timeout_seconds = float(fresh_read.get("trigger_timeout_seconds", 20) or 20)

    if strategy == "noop":
        return NoOpTrigger()
    if strategy == "adb_shell_commands":
        return AdbShellCommandTrigger(
            fresh_read.get("trigger_commands", []),
            runner,
            timeout_seconds=timeout_seconds,
        )
    raise ValueError(f"unsupported fresh_read.trigger_strategy: {strategy}")
