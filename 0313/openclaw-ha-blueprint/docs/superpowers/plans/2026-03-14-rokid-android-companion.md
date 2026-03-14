# Rokid Android Companion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Android Kotlin companion app wired to Rokid CXR-M and make the local Mac capable of building it.

**Architecture:** Keep the Android project isolated under `apps/rokid-android-companion`, use Rokid's Maven repository for the SDK, and wrap SDK-specific behavior behind a small facade so the rest of the sample remains testable.

**Tech Stack:** Kotlin, Android Gradle Plugin, Gradle wrapper, JDK 17, Android SDK command-line tools, Rokid CXR-M 1.0.9.

---

## Chunk 1: Local Toolchain

### Task 1: Install the host dependencies

**Files:**
- Modify: `/Users/thomasjwang/.zshrc`

- [ ] Install JDK 17
- [ ] Install Gradle
- [ ] Install Android command-line tools
- [ ] Install Android platform/build-tools packages
- [ ] Persist `JAVA_HOME`, `ANDROID_SDK_ROOT`, and Android CLI paths in shell config
- [ ] Verify `java`, `gradle`, `adb`, `sdkmanager`

## Chunk 2: Android Project Scaffold

### Task 2: Create the Android app shell

**Files:**
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/settings.gradle.kts`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/build.gradle.kts`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/gradle.properties`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/app/build.gradle.kts`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/app/src/main/...`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/app/src/test/...`

- [ ] Scaffold Gradle files and wrapper
- [ ] Add Android manifest and minimal resources
- [ ] Add a failing unit test around app config/facade behavior
- [ ] Run the test to verify RED
- [ ] Implement minimal production code for GREEN
- [ ] Re-run tests

## Chunk 3: Rokid Integration

### Task 3: Wire Rokid SDK configuration

**Files:**
- Modify: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/settings.gradle.kts`
- Modify: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/app/build.gradle.kts`
- Modify: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/app/src/main/AndroidManifest.xml`
- Modify: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/app/src/main/java/...`

- [ ] Add Rokid Maven repository
- [ ] Add `com.rokid.cxr:client-m:1.0.9`
- [ ] Add the minimum permissions called out by the official doc
- [ ] Add UI/config placeholders for credentials and `.lc` auth file
- [ ] Keep actual SDK calls behind a facade

## Chunk 4: Verification and Docs

### Task 4: Prove the setup works

**Files:**
- Modify: `0313/openclaw-ha-blueprint/README.md`
- Create: `0313/openclaw-ha-blueprint/apps/rokid-android-companion/README.md`

- [ ] Run local unit tests
- [ ] Run a debug build
- [ ] Document prerequisites that still require a Rokid account and SN binding
- [ ] Record exact commands for future reuse
