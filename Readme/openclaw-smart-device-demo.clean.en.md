# OpenClaw Smart Device Demo (Clean English Edition)

## File Relationship

- Chinese source: `openclaw-smart-device-demo.md`
- Full English companion: `openclaw-smart-device-demo.en.md`
- Clean English companion: `openclaw-smart-device-demo.clean.en.md`
- Structured English companion: `openclaw-smart-device-demo.structured.en.md`

This file is the cleaned English edition. It removes transcript clutter and reorganizes the document into technical sections while preserving the major comparison logic, device rankings, and demo-design conclusions.

## 1. Main Question

The source is fundamentally asking two related questions:

1. Which devices are most suitable for OpenClaw-based integration?
2. If real hardware is missing, what is the fastest convincing demo path?

## 2. Evaluation Criteria

The comparison is built on:

- system openness
- data accessibility
- control interfaces
- real-time behavior
- permission model
- security and maintenance cost

This makes the document useful as an engineering filter, not just a gadget ranking.

## 3. Device-by-Device Conclusions

### Rokid

Position:

- feasible
- custom-development-heavy
- best as a developer platform or AR front-end

Not ideal when the goal is:

- standardized health data
- low-friction household automation
- turnkey integration

### Vision Pro

Position:

- excellent spatial terminal
- strong UI and interaction shell
- not the best general sensor backend

Best for:

- dashboards
- immersive control panels
- agent-facing human interaction

### Apple Watch

Position:

- best first serious device

Best for:

- health data
- triggers
- notifications
- personal automation loops

### Xiaomi Watch

Position:

- viable data source
- usually indirect

Often depends on:

- Mi Fitness
- Apple Health
- Health Connect
- export-based workflows

## 4. Final Ranking

The cleaned ranking from the source is:

1. Apple Watch
2. Vision Pro
3. Xiaomi Watch
4. Rokid

The reason is practical utility and integration stability, not visual novelty.

## 5. Goal-Oriented Interpretation

The source explicitly notes that the ranking changes depending on product goal.

### Best for Health Assistant or Body-State Loops

- Apple Watch

### Best for AR or Spatial Agent UI

- Vision Pro

### Best for Lower-Cost Broad Data Collection

- Xiaomi Watch

### Best for Developer-Customized AR Demos

- Rokid

## 6. OpenClaw Role Mapping

The document maps each device to a natural OpenClaw role:

- Apple Watch -> health and context ingress
- Vision Pro -> interaction shell
- Xiaomi Watch -> indirect data source
- Rokid -> custom AR endpoint

This prevents role confusion when designing demos or prototypes.

## 7. One-Day Demo Strategy

The source then pivots to a concrete product-demonstration question:

If there is no actual smart bathtub or equivalent hardware yet, how should the demo be built?

The recommended answer is:

- do not start with real hardware
- build a digital twin
- use a fake actuator
- show a clean agent-driven loop

## 8. Recommended Demo Routes

### Spline Route

Best when:

- speed matters
- design polish matters
- browser deployment matters

### PlayCanvas Route

Best when:

- more programmable logic is needed
- the prototype should feel more like an application than a motion scene

### AI Video Route

Best when:

- there is no time for interactivity
- a presentation clip is enough

## 9. Smart Bathtub Demo Pattern

The source suggests a minimal but convincing state machine:

- idle
- filling
- heating
- ready
- draining

Then visualize:

- water level
- temperature
- valve state
- system status

This demonstrates the agent-control loop clearly even without actual plumbing hardware.

## 10. Why Mechanical or Remote Switches Can Work

The source answers yes, but only when the control loop is sound.

Key requirements:

- current state can be inferred or read
- commands can be injected reliably
- repeated actuation is safe
- outcome can be checked

This is why Home Assistant-visible actuators and mapped entities are repeatedly favored.

## 11. Core Demo Principle

The source distills the demo value into:

`user intent -> OpenClaw -> bridge or backend -> state machine -> UI feedback`

This matters more than full physical realism for an early-stage demo.

## 12. Practical Takeaways

1. Use Apple Watch first for real wearable value.
2. Use Vision Pro as an interaction surface, not as a universal sensor node.
3. Use digital twins before hardware-heavy builds.
4. Prefer browser-friendly demo paths when time is short.
5. Evaluate devices by integration quality, not by futuristic branding.

## 13. Companion File Usage

- Use `openclaw-smart-device-demo.en.md` for the broader English companion.
- Use this file for most technical discussion and planning.
- Use `openclaw-smart-device-demo.structured.en.md` when preparing release-facing docs or concise architecture materials.
