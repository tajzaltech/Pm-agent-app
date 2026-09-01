from __future__ import annotations

from typing import Any

import httpx

from core.errors import bad_request, service_unavailable

LINEAR_URL = "https://api.linear.app/graphql"


class LinearIntegration:
    async def _graphql(self, api_key: str, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        if not api_key:
            raise service_unavailable("Linear API key is not configured")
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                LINEAR_URL,
                json={"query": query, "variables": variables or {}},
                headers={"Authorization": api_key, "Content-Type": "application/json"},
            )
            response.raise_for_status()
            payload = response.json()
        if payload.get("errors"):
            message = payload["errors"][0].get("message") if payload["errors"] else "Linear error"
            raise bad_request(str(message))
        return payload.get("data") or {}

    async def first_team_id(self, api_key: str) -> str | None:
        data = await self._graphql(api_key, "{ teams { nodes { id name key } } }")
        nodes = ((data.get("teams") or {}).get("nodes")) or []
        if not nodes:
            return None
        return str(nodes[0]["id"])

    async def create_issue(
        self,
        *,
        api_key: str,
        team_id: str,
        title: str,
        description: str,
    ) -> dict[str, str]:
        data = await self._graphql(
            api_key,
            """
            mutation IssueCreate($input: IssueCreateInput!) {
              issueCreate(input: $input) {
                success
                issue { id identifier url }
              }
            }
            """,
            {"input": {"teamId": team_id, "title": title, "description": description}},
        )
        created = data.get("issueCreate") or {}
        issue = created.get("issue") or {}
        if not created.get("success") or not issue:
            raise bad_request("Linear did not create the issue")
        return {
            "id": str(issue.get("id") or ""),
            "identifier": str(issue.get("identifier") or ""),
            "url": str(issue.get("url") or ""),
        }


linear_client = LinearIntegration()
