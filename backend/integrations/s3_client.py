from __future__ import annotations

from typing import Protocol


class S3Client(Protocol):
    def upload_file(self, *, key: str, body: bytes, content_type: str) -> str: ...
    def get_presigned_url(self, *, key: str, content_type: str, expires_in: int) -> str: ...
    def delete_file(self, *, key: str) -> None: ...
    def configured(self) -> bool: ...


class S3Integration:
    def __init__(self) -> None:
        self._client = None

    def configured(self) -> bool:
        from core.config import settings

        return bool(settings.s3_bucket and settings.aws_access_key_id and settings.aws_secret_access_key)

    def _boto(self):
        if self._client is not None:
            return self._client
        from core.config import settings
        from core.errors import service_unavailable

        if not self.configured():
            raise service_unavailable("S3 is not configured")
        import boto3

        self._client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        return self._client

    def upload_file(self, *, key: str, body: bytes, content_type: str) -> str:
        from core.config import settings

        self._boto().put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=body,
            ContentType=content_type,
            ACL="private",
        )
        return key

    def get_presigned_url(self, *, key: str, content_type: str, expires_in: int) -> str:
        from core.config import settings

        return self._boto().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": key,
                "ContentType": content_type,
                "ACL": "private",
            },
            ExpiresIn=expires_in,
        )

    def delete_file(self, *, key: str) -> None:
        from core.config import settings

        self._boto().delete_object(Bucket=settings.s3_bucket, Key=key)


s3_client = S3Integration()
