from __future__ import annotations

import base64
from typing import Any

import httpx

from core.config import settings

SKIP_DIR_PARTS = {
    "node_modules",
    "dist",
    "build",
    ".git",
    ".next",
    "vendor",
    "__pycache__",
    ".venv",
    "coverage",
}
INDEX_EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".go",
    ".rs",
    ".java",
    ".rb",
    ".md",
    ".cs",
    ".kt",
    ".swift",
}
MAX_FILES = 80
MAX_FILE_BYTES = 80_000


def _headers(token: str | None) -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "PM-Agent/1.0"}
    auth = token or settings.github_token
    if auth:
        headers["Authorization"] = f"Bearer {auth}"
    return headers


def _should_skip(path: str) -> bool:
    parts = path.split("/")
    if any(part in SKIP_DIR_PARTS for part in parts):
        return True
    lower = path.lower()
    if not any(lower.endswith(ext) for ext in INDEX_EXTENSIONS):
        return True
    if lower.endswith("package-lock.json") or lower.endswith("pnpm-lock.yaml"):
        return True
    return False


def language_for(path: str) -> str:
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return {
        "py": "python",
        "ts": "typescript",
        "tsx": "tsx",
        "js": "javascript",
        "jsx": "jsx",
        "go": "go",
        "rs": "rust",
        "java": "java",
        "rb": "ruby",
        "md": "markdown",
        "cs": "csharp",
    }.get(ext, ext or "text")


class GitHubIntegration:
    async def list_source_files(self, full_name: str, token: str | None = None) -> list[str]:
        owner, _, repo = full_name.partition("/")
        if not owner or not repo:
            raise ValueError("Repository must be owner/name")
        async with httpx.AsyncClient(timeout=30.0, headers=_headers(token)) as client:
            repo_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}")
            repo_res.raise_for_status()
            branch = repo_res.json().get("default_branch") or "main"
            tree_res = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}",
                params={"recursive": "1"},
            )
            tree_res.raise_for_status()
            paths: list[str] = []
            for item in tree_res.json().get("tree") or []:
                if item.get("type") != "blob":
                    continue
                path = str(item.get("path") or "")
                if _should_skip(path):
                    continue
                if int(item.get("size") or 0) > MAX_FILE_BYTES:
                    continue
                paths.append(path)
                if len(paths) >= MAX_FILES:
                    break
            return paths

    async def fetch_file(self, full_name: str, path: str, token: str | None = None) -> str:
        owner, _, repo = full_name.partition("/")
        async with httpx.AsyncClient(timeout=30.0, headers=_headers(token)) as client:
            response = await client.get(f"https://api.github.com/repos/{owner}/{repo}/contents/{path}")
            response.raise_for_status()
            data: dict[str, Any] = response.json()
            if data.get("encoding") == "base64" and data.get("content"):
                raw = base64.b64decode(data["content"])
                return raw.decode("utf-8", errors="replace")
            if isinstance(data.get("content"), str):
                return data["content"]
            return ""


github_client = GitHubIntegration()
