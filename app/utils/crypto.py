import base64
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
from app.utils.config import settings
import os


class CryptoService:
    """Service for encrypting and decrypting sensitive data using AES-GCM"""

    def __init__(self):
        # Decode base64 encryption key from settings
        self.key = base64.b64decode(settings.ENCRYPTION_KEY)
        if len(self.key) not in [16, 24, 32]:
            raise ValueError("Encryption key must be 16, 24, or 32 bytes")
        self.aesgcm = AESGCM(self.key)

    def encrypt_data(self, data: str | dict) -> str:
        """
        Encrypt data using AES-GCM.

        Args:
            data: String or dict to encrypt

        Returns:
            Base64-encoded encrypted data with nonce prepended
        """
        if isinstance(data, dict):
            data = json.dumps(data)

        if not isinstance(data, str):
            raise ValueError("Data must be string or dict")

        # Generate random nonce (12 bytes recommended for GCM)
        nonce = os.urandom(12)

        # Encrypt the data
        encrypted = self.aesgcm.encrypt(nonce, data.encode('utf-8'), None)

        # Prepend nonce to encrypted data and encode as base64
        encrypted_with_nonce = nonce + encrypted
        return base64.b64encode(encrypted_with_nonce).decode('utf-8')

    def decrypt_data(self, encrypted_data: str) -> str:
        """
        Decrypt data using AES-GCM.

        Args:
            encrypted_data: Base64-encoded encrypted data with nonce

        Returns:
            Decrypted string
        """
        if not encrypted_data:
            return ""

        try:
            # Decode from base64
            encrypted_with_nonce = base64.b64decode(encrypted_data)

            # Extract nonce and encrypted data
            nonce = encrypted_with_nonce[:12]
            encrypted = encrypted_with_nonce[12:]

            # Decrypt
            decrypted = self.aesgcm.decrypt(nonce, encrypted, None)
            return decrypted.decode('utf-8')

        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")

    def decrypt_json(self, encrypted_data: str) -> dict:
        """
        Decrypt data and parse as JSON.

        Args:
            encrypted_data: Base64-encoded encrypted JSON data

        Returns:
            Decrypted dict
        """
        decrypted = self.decrypt_data(encrypted_data)
        if not decrypted:
            return {}
        return json.loads(decrypted)


# Singleton instance
crypto_service = CryptoService()


# Convenience functions
def encrypt_data(data: str | dict) -> str:
    """Encrypt data using AES-GCM"""
    return crypto_service.encrypt_data(data)


def decrypt_data(encrypted_data: str) -> str:
    """Decrypt data using AES-GCM"""
    return crypto_service.decrypt_data(encrypted_data)


def decrypt_json(encrypted_data: str) -> dict:
    """Decrypt and parse JSON data"""
    return crypto_service.decrypt_json(encrypted_data)
