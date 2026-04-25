# Changelog

All notable changes to the OpenMetadata MCP Server project will be documented in this file.

## [1.0.0] - 2026-04-26

### Added
- **Core MCP Server**: Implementation of 6 tools (Search, Lineage, Quality, Asset, Pipelines, Policy).
- **Unit Testing**: 15+ async unit tests using `pytest` and `AsyncMock`.
- **CI/CD**: GitHub Actions workflow for automated testing and linting.
- **Documentation**: Comprehensive `README.md`, `SUBMISSION.md`, and `.env.example`.
- **License**: MIT License for open-source compliance.
- **Logging**: Integrated structured logging to `stderr`.
- **Demo**: `demo.py` for CLI-based tool verification.

### Fixed
- **Type Safety**: Comprehensive type hints added across `client.py` and `tools.py`.
- **Async Handling**: Proper async context managers for HTTP connections.
- **Error Propagation**: Tools now return structured JSON errors for better AI agent feedback.

---
*Created for the OpenMetadata Hackathon 2026*
