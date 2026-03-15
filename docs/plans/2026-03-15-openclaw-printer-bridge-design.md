# OpenClaw Printer Bridge Design

## Summary

Build a printer bridge that lets the cloud `OpenClaw` instance on `devbox` discover and use the local macOS printer `Mi Wireless Photo Printer 1S [6528]` through a constrained tool interface.

The bridge keeps printer execution on the Mac. The cloud server talks only to a loopback endpoint exposed through a reverse `SSH` tunnel. The same change also writes durable device knowledge so `Claw` knows which Mac and printer it is allowed to use.

## Goals

- Let cloud `OpenClaw` query printer status from the local Mac.
- Let cloud `OpenClaw` submit image and PDF print jobs to `Mi_Wireless_Photo_Printer_1S__6528_`.
- Let cloud `OpenClaw` cancel a queued print job.
- Persist stable knowledge about the Mac, the printer, the supported media sizes, and the bridge path.
- Keep the first version auditable with plain shell commands and small scripts.

## Non-Goals

- Expose the printer bridge directly to the LAN or the public internet.
- Give cloud `OpenClaw` arbitrary shell access to the Mac.
- Claim end-to-end physical print completion in v1.
- Add generic support for every printer on the Mac.
- Add a full Home Assistant print abstraction.

## Stable Device Facts

### Local Mac

- Role: bridge host for locally attached printer capabilities
- Current working path: local repository checkout
- Printer commands already verified locally:
  - `lpstat -t`
  - `lpoptions -p Mi_Wireless_Photo_Printer_1S__6528_ -l`
  - `lp -d Mi_Wireless_Photo_Printer_1S__6528_ ...`

### Printer

- System queue name: `Mi_Wireless_Photo_Printer_1S__6528_`
- Human-readable name: `Mi Wireless Photo Printer 1S [6528]`
- Device type: AirPrint / CUPS queue on macOS
- Current supported media reported by CUPS:
  - `3x3`
  - `3x3.Fullbleed`
  - `4x6`
  - `4x6.Fullbleed`
- Default three-inch behavior for v1:
  - user-facing `three_inch`
  - runtime media option `3x3.Fullbleed`

### Cloud OpenClaw

- Host alias: `devbox`
- Project root: `/home/devbox/project`
- OpenClaw config: `/home/devbox/.openclaw/openclaw.json`
- Gateway bind: `loopback`
- Gateway port: `18789`
- Gateway auth mode: `token`

## Architecture

The system has four layers:

1. `Cloud OpenClaw tool call`
   The agent invokes a bounded printer tool such as `printer_get_status` or `printer_print_image`.

2. `Remote OpenClaw printer plugin`
   A small plugin on `devbox` validates input, forwards the request to the bridge endpoint on remote loopback, and returns structured results to the agent.

3. `Reverse SSH tunnel`
   The Mac opens a reverse tunnel so a remote loopback port on `devbox` maps back to the local bridge service.

4. `Local macOS printer bridge`
   A local HTTP service on the Mac wraps `lpstat`, `lpoptions`, `lp`, and `cancel` for one allowlisted printer queue.

## Control Flow

### Status request

`OpenClaw tool -> remote plugin -> remote loopback port -> reverse tunnel -> local bridge -> CUPS -> result`

### Print request

`OpenClaw tool -> remote plugin -> local bridge -> download/stage file on Mac -> validate type -> submit lp job -> return job id`

## Security Model

### Network boundary

- The local bridge listens on `127.0.0.1` only.
- The remote plugin connects to `127.0.0.1:<remote-port>` only.
- The tunnel is established from the Mac outward with `ssh -R`, so the server never needs inbound reachability to the Mac.

### Capability boundary

The local bridge exposes only:

- `GET /health`
- `GET /v1/printers/default`
- `POST /v1/printers/default/print-image`
- `POST /v1/printers/default/print-pdf`
- `POST /v1/jobs/cancel`

No generic shell endpoint exists.

### Authentication

- Tunnel trust comes from the existing `devbox` SSH key flow.
- Bridge requests also require a dedicated bearer token.
- The bearer token is separate from the OpenClaw gateway token.

## Tool Surface

The remote plugin registers these tools:

- `printer_get_status`
  - returns bridge status, printer metadata, supported media, and active queue summary
- `printer_print_image`
  - inputs:
    - `source_url` or `source_path`
    - `media`
    - `fit_to_page`
- `printer_print_pdf`
  - inputs:
    - `source_url` or `source_path`
    - `media`
- `printer_cancel_job`
  - inputs:
    - `job_id`

The plugin should reject unknown media sizes and reject unsupported file types before forwarding the request.

## Persistent Knowledge

The implementation writes durable printer knowledge in two places:

1. Repository docs
   - bridge architecture
   - printer metadata
   - operational scripts
   - environment variables

2. Remote OpenClaw workspace docs
   - the default printer for this environment
   - supported media names
   - rule that all printing must go through the printer bridge
   - rule that success means queue submission unless the bridge reports more

## Failure Handling

- Bridge offline:
  - remote plugin returns `bridge offline`
- Printer unavailable:
  - local bridge returns the latest `lpstat` summary
- Unsupported media:
  - return validation error
- Unsupported file type:
  - return validation error
- Submission failure:
  - return the command stderr and non-zero exit indication

## Verification Plan

### Local verification

- verify the bridge can report the default printer and media options
- verify a local image print job can be submitted
- verify a queued job can be canceled

### Tunnel verification

- verify the Mac can open the reverse `SSH` tunnel
- verify `curl http://127.0.0.1:<remote-port>/health` succeeds on `devbox`

### OpenClaw verification

- verify the plugin is loaded by `OpenClaw`
- verify `printer_get_status` returns the configured printer
- verify `printer_print_image` submits a real job to `Mi_Wireless_Photo_Printer_1S__6528_`

## Implementation Notes

- Prefer small self-contained scripts with standard-library dependencies.
- Keep the local bridge printer allowlist to a single queue in v1.
- Use explicit media aliases instead of free-form size guessing.
