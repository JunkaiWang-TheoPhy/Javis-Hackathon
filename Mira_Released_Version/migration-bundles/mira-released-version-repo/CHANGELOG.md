# Changelog

## Unreleased

### Added

- established the first `Mira_Released_Version` Git baseline
- added release baseline and open-source readiness docs
- added source-to-release mapping
- added a minimal runtime contract for Mira core
- added package-oriented runtime docs for `services/notification-router`
- added package-oriented runtime docs for `modules/home-assistant`
- unified the three current deploy paths with a shared overview
- added a release-root verification entry
- added a release export script and repository split checklist
- added a license placeholder for pre-publication export

### Changed

- tightened release-side package boundaries for `core`, `modules`, and `services`
- made release-side `notification-router` YAML loading optional at runtime
- cleaned release-side installed dependencies out of the tree
