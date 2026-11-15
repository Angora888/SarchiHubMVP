#!/usr/bin/env python3
"""One-time secure admin provisioning for Directorio Sarchí.

Run from a trusted machine with DATABASE_URL set to the SarchiHub PostgreSQL
connection string. Passwords are prompted via getpass and never printed.
Dependencies: python -m pip install "psycopg[binary]>=3.2,<4" "bcrypt>=4,<6"
"""
import getpass
import os
import re
import sys

def main() -> int:
    try:
        import psycopg
        import bcrypt
    except ImportError:
        print("Install dependencies: pip install 'psycopg[binary]>=3.2,<4' 'bcrypt>=4,<6'", file=sys.stderr)
        return 2
    dsn = os.environ.get("DIRECTORY_DATABASE_URL", "")
    if not dsn:
        print("DIRECTORY_DATABASE_URL is required. Never paste it into chat or commit it.", file=sys.stderr)
        return 2
    email = input("Directory admin email: ").strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 254:
        print("Invalid email", file=sys.stderr)
        return 2
    password = getpass.getpass("Choose a strong password (at least 14 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation or len(password) < 14 or len(password.encode("utf-8")) > 72:
        print("Passwords must match and be 14-72 UTF-8 bytes.", file=sys.stderr)
        return 2
    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")
    try:
        with psycopg.connect(dsn, connect_timeout=15) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO directory.admin_accounts (email, password_hash, is_active)
                       VALUES (%s, %s, TRUE)
                       ON CONFLICT (email) DO NOTHING
                       RETURNING id""",
                    (email, pw_hash),
                )
                row = cur.fetchone()
                if row is None:
                    print("An administrator with this email already exists; no changes made.")
                    return 1
        print("Directory admin account created. Sign in at /admin.")
        return 0
    except Exception as exc:
        print(f"Database operation failed ({type(exc).__name__}).", file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
