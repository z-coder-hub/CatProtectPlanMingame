# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open source preparation

## [1.6.0] - 2024-XX-XX

### Added
- Complete TypeScript migration to Cocos Creator 3.8.6
- 11 unique cat heroes with unified projectile attack system
- 16 enemy types including 7 boss enemies
- 10 progressive levels with unlock system
- Grid-based deployment system (11x6)
- Battle management system
- Wave management system
- Level management system
- Hero factory system
- Enemy factory system
- Projectile system with object pooling

### Changed
- Refactored hero architecture with DRY principles
- Refactored enemy architecture with unified base class
- Optimized data management with BattleManager as single source of truth
- Cleaned up unused code following YAGNI principles
- Simplified type system

### Removed
- Hero health system (heroes are now permanent defensive units)
- Enemy attack capabilities (pure tower defense mechanics)
- Hero movement system (heroes are statically deployed)
- Unused type definitions and configurations

### Documentation
- Comprehensive development guide (CLAUDE.md)
- Component architecture documentation
- Game mechanics design documentation
- Game balance design documentation
- Hero design principles
- Enemy design principles

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Basic game mechanics
- Core hero and enemy systems
- Level progression system

---

## Version History Notes

### v1.6: Code Cleanup & YAGNI Principles
- Massive code cleanup removing 450+ lines of unused code
- Type system simplification
- Maintained full functionality with improved maintainability

### v1.5: Data Architecture Optimization
- BattleManager as core data center
- Eliminated duplicate data storage
- Unified data access patterns

### v1.4: Documentation Expansion
- Expanded hero system documentation
- Expanded enemy system documentation
- Updated project structure documentation

### v1.3: Game Mechanics Purification
- Removed hero health system
- Removed enemy attack capabilities
- Removed hero movement system
- Pure tower defense mechanics established

### v1.2: DRY Refactoring
- Unified hero appearance management
- Unified enemy label system
- Established abstract base class patterns

### v1.1: UI System Refactoring
- Unified GameHUD interface system
- Fixed Graphics API compatibility
- Resolved duplicate rendering warnings

### v1.0: TypeScript Migration
- Completed migration from Cocos Creator 2.4.10 to 3.8.6
- Established type-safe development architecture

---

[Unreleased]: https://github.com/yourusername/CatProtectPlanMingame/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/yourusername/CatProtectPlanMingame/releases/tag/v1.6.0
[1.0.0]: https://github.com/yourusername/CatProtectPlanMingame/releases/tag/v1.0.0
