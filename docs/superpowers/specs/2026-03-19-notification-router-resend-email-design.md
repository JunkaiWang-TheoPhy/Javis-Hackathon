# Notification Router Resend Email Design

## Purpose

Add the first real email channel to `notification-router`.

This first pass should stay narrow:

- one provider
- one channel name
- one minimal send flow

## Provider Choice

The first API email provider is `Resend`.

Why:

- it matches the current HTTP-oriented router shape
- the send API is simple
- it avoids introducing SMTP or OAuth complexity in the first pass

## Scope

This pass includes:

- a new `email` channel in `notification-router`
- a `resend_email` channel adapter
- environment-driven configuration
- one end-to-end router test

This pass excludes:

- inbox reading
- provider webhooks
- template rendering
- attachments
- batching

## Contract

The adapter will map `OutboundMessageIntent` to a Resend send-email request using:

- `from`
- `to`
- `subject`
- `text`
- optional `replyTo`

The router will require:

- a configured Resend API key
- a configured sender address
- `intent.recipient.address`

## Runtime Shape

Environment variables:

- `MIRA_NOTIFICATION_ROUTER_RESEND_API_KEY`
- `MIRA_NOTIFICATION_ROUTER_RESEND_FROM`
- `MIRA_NOTIFICATION_ROUTER_RESEND_REPLY_TO` (optional)

## Expected Outcome

After this pass:

- `notification-router` supports both private DM and email
- low-risk self messages can be delivered through `email`
- the implementation stays small enough to extend later
