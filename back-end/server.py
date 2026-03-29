#!/usr/bin/env python3
import os
import sys

from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "castle_backend.settings")
    from django.core.management import execute_from_command_line

    port = os.getenv("PORT", "5000")
    execute_from_command_line([sys.argv[0], "runserver", f"0.0.0.0:{port}"])


if __name__ == "__main__":
    main()
