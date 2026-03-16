# Two External Positionings For The Home Assistant Module

## 1. Purpose

This document captures the two external narratives discussed for Mira's `Home Assistant` module:

- `HA-first home control center`
- `multi-ecosystem household capability router`

This is not just a wording difference. It changes where the system center is.

## 2. Option A: HA-first Home Control Center

This positioning means:

- `Home Assistant` is the default hub
- Mira mainly controls the home through HA
- other ecosystems act mostly as supplemental integration surfaces around HA

### Architectural Center

- `HA entity`
- `HA service`
- `HA scene`

### External Narrative

Mira is an intelligent control and orchestration layer built on top of Home Assistant.

### Advantages

- easiest to land
- closest to the current mature implementation path
- very direct for demos
- easy for users to understand

### Drawbacks

- Mira can be mistaken for "an agent on top of HA"
- the architecture naturally leans toward a single hub
- boundaries become harder to keep clean when more household backends are added

## 3. Option B: Multi-Ecosystem Household Capability Router

This positioning means:

- Mira is centered on household intent and capability
- `Home Assistant` is an important backend, but not the only theoretical center
- actions may route through HA, direct adapters, local bridges, or other ecosystem backends

### Architectural Center

- `device`
- `capability`
- `intent`
- `route`

### External Narrative

Mira is a unified orchestration layer for household capabilities, while `Home Assistant` is one of the strongest and most mature execution backends available today.

### Advantages

- better fit for long-term expansion
- more aligned with a platform narrative
- avoids binding Mira's identity to a single ecosystem

### Drawbacks

- higher design complexity up front
- can sound too abstract if the capability model is weak
- requires more careful documentation of routing and device abstraction

## 4. The Core Difference

### `HA-first`

- the central object is `Home Assistant`
- Mira looks more like the intelligent upper layer
- device abstraction leans toward `entity / service`
- other ecosystems are mostly accessed through HA

### `multi-ecosystem routing`

- the central object is the `Mira capability graph`
- Mira behaves more like a household intent orchestrator
- device abstraction leans toward `intent / capability / route`
- HA is an important route target, not the only theoretical center

## 5. Which One Matches The Current Code Better

Based on the current discussion and plugin direction, the current system is not purely `HA-first`.

Why:

- the existing Home Assistant control layer is more than raw `service call`
- the structure already includes typed tools, scene orchestration, wearable/presence policy, and ecosystem registry

So while HA is still the most mature backend today, the architectural direction is already moving toward multi-ecosystem routing.

## 6. Recommended Positioning

The recommended combination is:

- external positioning: `multi-ecosystem household capability router`
- implementation strategy today: `Home Assistant as the first-party flagship backend`

In other words:

- narratively, do not present Mira as subordinate to HA
- technically, acknowledge that HA is currently the strongest and most mature execution surface

This is the most stable balance.

## 7. Relationship To Existing Docs

If you want to go deeper into the module itself, also read:

- `mira-home-assistant-flagship-module.en.md`
- `mira-core-without-home-assistant.en.md`
- `mira-released-version-layered-release-architecture.md`

## 8. Formal Product Copy

Below are two versions of formal product-facing copy that can be reused directly.

### 8.1 Copy Version A: `HA-first home control center`

Mira's Home Assistant module is currently her most mature home control center.

In this model, Home Assistant acts as the default device hub, owning household entities, services, scenes, and automation. Mira operates as the intelligent orchestration layer above it, connecting natural-language understanding, long-term memory, state judgment, and household actions through typed tools, scene orchestration, and context-aware decision-making.

That means Mira is not simply "able to call the Home Assistant API." She is able to interpret user state, read household context, and turn that understanding into concrete, safe, and explainable household control flows on top of Home Assistant's device graph.

Under this positioning, Home Assistant is the device authority layer, while Mira is the intelligence, care, and orchestration layer. The former makes the home controllable; the latter makes the system capable of understanding, judgment, and care.

If your goal is to ship a household companion system that is quickly usable, demonstrable, and deployable, this route is the most direct and the closest to Mira's currently mature capability surface.

### 8.2 Copy Version B: `multi-ecosystem household capability router`

Mira's Home Assistant module is not just a home plugin. It is the flagship execution backend inside her household capability graph.

In this model, Mira is not centered on any single household platform. She is centered on user intent, device capability, and environmental state. Through typed tools, scene orchestration, wearable and presence policies, and an ecosystem registry, she organizes capabilities from different ecosystems and execution surfaces into a single household action layer.

Home Assistant plays the role of the first-party flagship backend here: it is one of the strongest and most mature execution surfaces available today, but it is not Mira's only theoretical center. Mira's real center is her capability graph, her ongoing interpretation of what the user needs, what state the household is in, and which actions can be executed safely.

So the value of this module is not limited to controlling lights, air conditioners, fans, or music. Its value is that it lets Mira reliably read household state across ecosystems, assess risk, choose the right execution path, and turn care into environmental action.

If your goal is to turn Mira into a long-term, extensible, open, cross-ecosystem ambient companion system, this positioning is the better fit for a formal release.

### 8.3 Recommended Use

Use version A first when the context is:

- demos
- partner-facing explanations
- current capability introduction

Use version B first when the context is:

- release README
- architecture explanation
- long-term community-facing narrative

The most practical combination is:

- version A for the homepage or demo path
- version B for architecture and release documentation

## 9. One-Line Summary

The root difference is:

- `HA-first` means "Home Assistant is the primary operating layer, and Mira is the intelligence above it"
- `multi-ecosystem routing` means "Mira is the orchestrator, and Home Assistant is an important execution backend"

If the goal is a long-term public release and open architecture, the second option is the better fit.
