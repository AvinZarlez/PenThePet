# PenThePet Documentation

Welcome to the PenThePet documentation! This directory contains comprehensive guides for developers, AI agents, and contributors.

## 📋 Main Documentation

These are the core documentation files that describe the current state of the project:

- **[AGENT_GUIDELINES.md](AGENT_GUIDELINES.md)** - ⚠️ **START HERE** - Critical requirements for AI coding agents
  - Pre-change checklist
  - Code standards and patterns
  - Testing requirements
  - Documentation maintenance
  - Map generation guidelines
  - Quality standards

- **[CODE_STRUCTURE.md](CODE_STRUCTURE.md)** - Project structure and file organization
  - File purposes and responsibilities
  - How to extend the game
  - Adding new features
  - Cookie-based preferences

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Design decisions and philosophy
  - Why vanilla JavaScript
  - Technology choices and tradeoffs
  - Algorithm design rationale
  - Performance considerations
  - Future extensibility

- **[MAP_GENERATION.md](MAP_GENERATION.md)** - Map generation algorithm details
  - Generation process and validation
  - Quality standards and rules
  - How to generate new maps
  - Testing and verification
  - Script usage

- **[TESTING.md](TESTING.md)** - Testing infrastructure and guide
  - Test suite overview (262 tests)
  - Code coverage (77%)
  - Writing tests
  - Running tests
  - Debugging tests

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer workflow and setup
  - Getting started
  - Development cycle
  - Coding standards
  - Common tasks
  - Troubleshooting
  - CI/CD setup

- **[DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md)** - Testing branches before merging
  - Testing without cloning (GitHub Pages)
  - Testing locally with live server
  - Testing multiple branches simultaneously
  - Best practices for branch testing
  - Troubleshooting common issues

## 📝 Change Summaries

Historical documentation of major changes, bug fixes, and implementations:

- **[summaries/](summaries/)** - PR and change summaries
  - [DEPENDABOT_FIX_SUMMARY.md](summaries/DEPENDABOT_FIX_SUMMARY.md) - Fixed agent hang issues
  - [FIXES_SUMMARY_2026-02-06.md](summaries/FIXES_SUMMARY_2026-02-06.md) - Puzzle scoring fixes
  - [IMPLEMENTATION_SUMMARY.md](summaries/IMPLEMENTATION_SUMMARY.md) - Map generation improvements
  - [MAPGEN_FIX_SUMMARY.md](summaries/MAPGEN_FIX_SUMMARY.md) - Goal calculation bug fix
  - [MAP_GENERATION_AUDIT_SUMMARY.md](summaries/MAP_GENERATION_AUDIT_SUMMARY.md) - Generation system audit
  - [MENU_IMPLEMENTATION.md](summaries/MENU_IMPLEMENTATION.md) - Menu system implementation

## 🚀 Quick Start Guides

### For New Developers
1. Read [CODE_STRUCTURE.md](CODE_STRUCTURE.md) to understand the architecture
2. Review [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions
3. Check [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md) for testing branches
4. Review [TESTING.md](TESTING.md) to learn about the test suite

### For AI Coding Agents
1. **Must read first:** [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md)
2. Then read relevant docs based on your task:
   - Code changes → [CODE_STRUCTURE.md](CODE_STRUCTURE.md)
   - Map generation → [MAP_GENERATION.md](MAP_GENERATION.md)
   - Testing → [TESTING.md](TESTING.md)

### For Contributors
1. Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand design decisions
2. Follow [DEVELOPMENT.md](DEVELOPMENT.md) for workflow
3. Maintain [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) standards

## 🔍 Finding Documentation

### By Topic

**Architecture & Design:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - Why decisions were made
- [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - How code is organized

**Development:**
- [DEVELOPMENT.md](DEVELOPMENT.md) - Day-to-day workflow
- [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md) - Testing branches
- [TESTING.md](TESTING.md) - Test infrastructure

**Map Generation:**
- [MAP_GENERATION.md](MAP_GENERATION.md) - Current implementation
- [summaries/MAP_GENERATION_AUDIT_SUMMARY.md](summaries/MAP_GENERATION_AUDIT_SUMMARY.md) - Recent audit

**Guidelines:**
- [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) - For AI agents
- [DEVELOPMENT.md](DEVELOPMENT.md) - For human developers

### By Activity

**Making Code Changes:**
1. [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) - Requirements
2. [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Architecture
3. [DEBUGGING_BRANCHES.md](DEBUGGING_BRANCHES.md) - Testing branches
4. [TESTING.md](TESTING.md) - Testing

**Adding Features:**
1. [ARCHITECTURE.md](ARCHITECTURE.md) - Design philosophy
2. [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Where to add code
3. [DEVELOPMENT.md](DEVELOPMENT.md) - Development workflow

**Generating Maps:**
1. [MAP_GENERATION.md](MAP_GENERATION.md) - Complete guide
2. [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) - Quality rules

**Understanding History:**
1. [summaries/](summaries/) - All change summaries
2. Git history - Commit messages

## 📖 Documentation Standards

All documentation in this project follows these principles:

1. **Keep in sync with code** - Update docs when code changes
2. **Write for humans and AI** - Clear, comprehensive, examples
3. **Link between docs** - Connect related information
4. **Version in git** - Documentation is code
5. **Test instructions** - Verify steps actually work

See [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) for detailed documentation requirements.

## 🆘 Getting Help

**Can't find what you need?**
1. Check the [main README](../README.md) for project overview
2. Search documentation files for keywords
3. Look at code comments (JSDoc)
4. Check git history for context
5. Review [summaries/](summaries/) for recent changes

**Found a documentation bug?**
1. Fix it yourself (small changes)
2. Open an issue (larger changes)
3. Keep docs in sync with code changes

## 🤝 Contributing to Documentation

When updating documentation:
- Keep formatting consistent
- Update all affected files
- Check and fix any broken links
- Add examples where helpful
- Test that instructions work
- Update this README if adding new docs

---

**Last Updated:** 2026-02-06  
**Total Documentation Files:** 13 (7 main + 6 summaries)  
**Lines of Documentation:** ~12,000+
