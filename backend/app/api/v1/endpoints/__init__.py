"""Endpoints package for API v1.

This module exposes endpoint submodules so callers can do:
    from app.api.v1.endpoints import linkedin, resumes
"""

from . import linkedin, resumes

__all__ = ["linkedin", "resumes"]
