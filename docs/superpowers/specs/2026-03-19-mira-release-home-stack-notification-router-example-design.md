# Mira Release Home Stack Plus Notification Router Example Design

## Goal

Add a release-side advanced composition example for `core + home-assistant + notification-router`.

## Scope

This is documentation-only. It creates one new example entry and updates navigation docs that already mention `notification-router` as an optional dependency of the home stack.

## Design

The new example should sit one step beyond `home-stack`.

It should answer:

1. when to stop at `home-stack`
2. when to add `notification-router`
3. what extra capability that composition unlocks

The example should stay explicit that outbound behavior remains optional and policy-gated.
