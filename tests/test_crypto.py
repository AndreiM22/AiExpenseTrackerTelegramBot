import pytest
from app.utils.crypto import encrypt_data, decrypt_data, decrypt_json


def test_encrypt_decrypt_string():
    """Test encryption and decryption of a simple string"""
    original_text = "This is a secret expense: 250 MDL at Kaufland"

    # Encrypt
    encrypted = encrypt_data(original_text)
    assert encrypted != original_text
    assert len(encrypted) > 0

    # Decrypt
    decrypted = decrypt_data(encrypted)
    assert decrypted == original_text


def test_encrypt_decrypt_dict():
    """Test encryption and decryption of a dictionary"""
    original_data = {
        "amount": 250.50,
        "currency": "MDL",
        "vendor": "Kaufland",
        "items": ["Coffee", "Milk"]
    }

    # Encrypt
    encrypted = encrypt_data(original_data)
    assert encrypted != str(original_data)

    # Decrypt as JSON
    decrypted = decrypt_json(encrypted)
    assert decrypted == original_data
    assert decrypted["amount"] == 250.50
    assert decrypted["vendor"] == "Kaufland"


def test_encrypt_decrypt_unicode():
    """Test encryption with unicode characters (Romanian text)"""
    original_text = "Cheltuială la magazin: 150 lei pentru pâine și brânză"

    encrypted = encrypt_data(original_text)
    decrypted = decrypt_data(encrypted)

    assert decrypted == original_text


def test_decrypt_empty_string():
    """Test decryption of empty string"""
    result = decrypt_data("")
    assert result == ""


def test_decrypt_invalid_data():
    """Test that invalid encrypted data raises error"""
    with pytest.raises(ValueError):
        decrypt_data("invalid_base64_data!")


def test_encryption_produces_different_output():
    """Test that encrypting the same data twice produces different output (due to random nonce)"""
    text = "Same text"

    encrypted1 = encrypt_data(text)
    encrypted2 = encrypt_data(text)

    # Different encrypted values due to random nonce
    assert encrypted1 != encrypted2

    # But both decrypt to the same value
    assert decrypt_data(encrypted1) == text
    assert decrypt_data(encrypted2) == text


def test_decrypt_json_empty():
    """Test decrypting empty encrypted JSON"""
    result = decrypt_json("")
    assert result == {}
