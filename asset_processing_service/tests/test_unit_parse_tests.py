# tests/test_unit_parse_tests.py
import pytest

from asset_processing_service.main import parse_test_numbers


def test_parse_test_numbers_none():
    assert parse_test_numbers(None) is None


def test_parse_test_numbers_single():
    assert parse_test_numbers("1") == [1]


def test_parse_test_numbers_multi():
    assert parse_test_numbers("1, 3,4") == [1, 3, 4]


def test_parse_test_numbers_whitespace_only():
    assert parse_test_numbers("   ") is None


def test_parse_test_numbers_trailing_comma():
    # If your parser ignores empty items, this should pass.
    # If you instead want this to raise, flip the expectation accordingly.
    assert parse_test_numbers("1,2,") == [1, 2]


def test_parse_test_numbers_invalid():
    with pytest.raises(ValueError):
        parse_test_numbers("1,nope")
