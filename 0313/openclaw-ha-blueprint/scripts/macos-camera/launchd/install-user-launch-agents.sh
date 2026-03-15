#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$script_dir/launchd-common.sh"

devbox_tunnel_runner="$runtime_devbox_tunnel_runner"
bridge_gateway_runner="$runtime_bridge_gateway_runner"
mac_camera_sidecar_runner="$runtime_mac_camera_sidecar_runner"
openclaw_app_runner="$runtime_openclaw_app_runner"

devbox_tunnel_template="$launchd_templates_dir/$devbox_tunnel_label.plist.template"
bridge_gateway_template="$launchd_templates_dir/$bridge_gateway_label.plist.template"
mac_camera_sidecar_template="$launchd_templates_dir/$mac_camera_sidecar_label.plist.template"
openclaw_app_template="$launchd_templates_dir/$openclaw_app_label.plist.template"

kill_if_matches() {
  local pid="$1"
  local pattern="$2"
  local command
  command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  if [[ -n "$command" && "$command" == *"$pattern"* ]]; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

cleanup_conflicting_processes() {
  local tunnel_pids
  local bridge_pids

  tunnel_pids="$(lsof -tiTCP:"$devbox_tunnel_local_port" -sTCP:LISTEN 2>/dev/null || true)"
  for pid in $tunnel_pids; do
    kill_if_matches "$pid" "ssh -fN -L ${devbox_tunnel_local_port}:${devbox_tunnel_remote_host}:${devbox_tunnel_remote_port}"
    kill_if_matches "$pid" "ssh -N -L ${devbox_tunnel_local_port}:${devbox_tunnel_remote_host}:${devbox_tunnel_remote_port}"
  done

  bridge_pids="$(lsof -tiTCP:3301 -sTCP:LISTEN 2>/dev/null || true)"
  for pid in $bridge_pids; do
    kill_if_matches "$pid" "services/rokid-bridge-gateway/src/server.ts"
    kill_if_matches "$pid" "rokid-bridge-gateway-runtime.mjs"
  done
}

install_runtime_local_macos_scripts() {
  cp "$local_macos_dir/mac-camera-common.sh" "$runtime_local_macos_dir/mac-camera-common.sh"
  cp "$local_macos_dir/mac-camera-shot" "$runtime_local_macos_dir/mac-camera-shot"
  cp "$local_macos_dir/mac-camera-emit-event" "$runtime_local_macos_dir/mac-camera-emit-event"
  cp "$local_macos_dir/mac-camera-loop" "$runtime_local_macos_dir/mac-camera-loop"
  chmod +x \
    "$runtime_local_macos_dir/mac-camera-common.sh" \
    "$runtime_local_macos_dir/mac-camera-shot" \
    "$runtime_local_macos_dir/mac-camera-emit-event" \
    "$runtime_local_macos_dir/mac-camera-loop"
}

install_runtime_gateway() {
  cat >"$runtime_bridge_gateway_js" <<'EOF'
#!/usr/bin/env node
import http from "node:http";

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function buildNoopEnvelope(sessionId, correlationId, reason) {
  return {
    schemaVersion: "0.1.0",
    envelopeId: `env-${correlationId}-noop`,
    sessionId,
    correlationId,
    createdAt: new Date().toISOString(),
    safetyTier: "inform",
    actions: [{ kind: "noop", reason }],
  };
}

function buildAmbientEscalationEnvelope(observation, escalation) {
  const title =
    escalation === "clip" ? "Ambient activity detected" : "Ambient scene change detected";
  const body =
    escalation === "clip"
      ? "Meaningful motion was detected. Capture a short camera clip if more context is needed."
      : "A meaningful visual change was detected. Capture a fresh snapshot if more context is needed.";
  const speech =
    escalation === "clip"
      ? "I detected sustained activity on the Mac webcam. A short clip may help."
      : "I detected a meaningful change on the Mac webcam. A fresh snapshot may help.";

  return {
    schemaVersion: "0.1.0",
    envelopeId: `env-${observation.observationId}-ambient-${escalation}`,
    sessionId: observation.sessionId,
    correlationId: observation.observationId,
    createdAt: new Date().toISOString(),
    safetyTier: "inform",
    actions: [
      {
        kind: "overlay_panel",
        panelId: "ambient-panel-1",
        title,
        body,
      },
      {
        kind: "speech",
        text: speech,
        interrupt: false,
      },
    ],
  };
}

function isValidObservation(observation) {
  if (!observation || typeof observation !== "object") return false;
  if (observation.schemaVersion !== "0.1.0") return false;
  if (typeof observation.sessionId !== "string") return false;
  if (typeof observation.observationId !== "string") return false;
  if (typeof observation.observedAt !== "string") return false;
  if (!observation.source || observation.source.deviceFamily !== "mac_webcam") return false;
  if (!observation.capture || !["snapshot", "clip"].includes(observation.capture.mode)) return false;
  if (!observation.event || typeof observation.event.changeScore !== "number") return false;
  if (typeof observation.event.personPresent !== "boolean") return false;
  if (typeof observation.event.personCount !== "number") return false;
  if (!["idle", "person_present", "active_motion"].includes(observation.event.activityState)) return false;
  if (!Array.isArray(observation.event.reasons)) return false;
  if (!observation.privacy || typeof observation.privacy.retainFrame !== "boolean") return false;
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/v1/health") {
      writeJson(res, 200, { ok: true, service: "rokid-bridge-gateway" });
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/ambient/observe") {
      const body = await readJson(req);
      const observation = body?.observation;
      if (!isValidObservation(observation)) {
        writeJson(
          res,
          400,
          buildNoopEnvelope("unknown", "invalid-ambient-observation", "Invalid ambient observation payload."),
        );
        return;
      }
      const { changeScore, activityState } = observation.event;
      if (changeScore < 0.18 && activityState === "idle") {
        writeJson(
          res,
          200,
          buildNoopEnvelope(
            observation.sessionId,
            observation.observationId,
            "Ambient change stayed below escalation threshold.",
          ),
        );
        return;
      }
      const escalation = activityState === "active_motion" || changeScore >= 0.45 ? "clip" : "snap";
      writeJson(res, 200, buildAmbientEscalationEnvelope(observation, escalation));
      return;
    }
    writeJson(res, 404, { ok: false, error: "not found" });
  } catch (error) {
    writeJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

const port = Number(process.env.PORT ?? 3301);
server.listen(port, "127.0.0.1", () => {
  console.log(JSON.stringify({ ok: true, port, service: "rokid-bridge-gateway" }));
});
EOF
  chmod +x "$runtime_bridge_gateway_js"
}

install_runtime_tunnel_runner() {
  cat >"$runtime_devbox_tunnel_runner" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec "$ssh_bin" \\
  -N \\
  -L "${devbox_tunnel_local_port}:${devbox_tunnel_remote_host}:${devbox_tunnel_remote_port}" \\
  -o ExitOnForwardFailure=yes \\
  -o ServerAliveInterval=30 \\
  -o ServerAliveCountMax=3 \\
  -o TCPKeepAlive=yes \\
  -o IdentitiesOnly=yes \\
  -o StrictHostKeyChecking=accept-new \\
  -i "$runtime_devbox_ssh_identity" \\
  -p "$devbox_ssh_port" \\
  "${devbox_ssh_user}@${devbox_ssh_host}"
EOF
  chmod +x "$runtime_devbox_tunnel_runner"
}

install_runtime_bridge_runner() {
  cat >"$runtime_bridge_gateway_runner" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ -f "$bridge_env_file" ]]; then
  set -a
  . "$bridge_env_file"
  set +a
fi
exec "$node_bin_default" "$runtime_bridge_gateway_js"
EOF
  chmod +x "$runtime_bridge_gateway_runner"
}

install_runtime_sidecar_runner() {
  cat >"$runtime_mac_camera_sidecar_runner" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export OPENCLAW_BIN="${openclaw_bin_default}"
if [[ -f "$sidecar_env_file" ]]; then
  set -a
  . "$sidecar_env_file"
  set +a
fi
exec "$runtime_local_macos_dir/mac-camera-loop"
EOF
  chmod +x "$runtime_mac_camera_sidecar_runner"
}

install_runtime_openclaw_app_runner() {
  cat >"$runtime_openclaw_app_runner" <<EOF
#!/usr/bin/env bash
set -euo pipefail
for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:${devbox_tunnel_local_port}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
exec "$openclaw_mac_app_path"
EOF
  chmod +x "$runtime_openclaw_app_runner"
}

install_runtime_identity() {
  if [[ ! -f "$devbox_ssh_identity" ]]; then
    echo "missing SSH identity: $devbox_ssh_identity" >&2
    exit 1
  fi
  cp "$devbox_ssh_identity" "$runtime_devbox_ssh_identity"
  chmod 600 "$runtime_devbox_ssh_identity"
}

ensure_launchd_dirs
write_default_env_files_if_missing
cleanup_conflicting_processes
install_runtime_local_macos_scripts
install_runtime_gateway
install_runtime_identity
install_runtime_tunnel_runner
install_runtime_bridge_runner
install_runtime_sidecar_runner
install_runtime_openclaw_app_runner

render_plist_template \
  "$devbox_tunnel_template" \
  "$devbox_tunnel_plist" \
  "$devbox_tunnel_label" \
  "$devbox_tunnel_runner" \
  "$runtime_root_dir" \
  "$devbox_tunnel_stdout" \
  "$devbox_tunnel_stderr" \
  true

render_plist_template \
  "$bridge_gateway_template" \
  "$bridge_gateway_plist" \
  "$bridge_gateway_label" \
  "$bridge_gateway_runner" \
  "$runtime_root_dir" \
  "$bridge_gateway_stdout" \
  "$bridge_gateway_stderr" \
  false

render_plist_template \
  "$mac_camera_sidecar_template" \
  "$mac_camera_sidecar_plist" \
  "$mac_camera_sidecar_label" \
  "$mac_camera_sidecar_runner" \
  "$runtime_root_dir" \
  "$mac_camera_sidecar_stdout" \
  "$mac_camera_sidecar_stderr" \
  false

render_plist_template \
  "$openclaw_app_template" \
  "$openclaw_app_plist" \
  "$openclaw_app_label" \
  "$openclaw_app_runner" \
  "$runtime_root_dir" \
  "$openclaw_app_stdout" \
  "$openclaw_app_stderr" \
  false

chmod 644 "$devbox_tunnel_plist" "$bridge_gateway_plist" "$mac_camera_sidecar_plist" "$openclaw_app_plist"

bootout_if_loaded "$devbox_tunnel_plist"
bootout_if_loaded "$bridge_gateway_plist"
bootout_if_loaded "$mac_camera_sidecar_plist"
bootout_if_loaded "$openclaw_app_plist"

bootstrap_plist "$devbox_tunnel_plist"
bootstrap_plist "$bridge_gateway_plist"
bootstrap_plist "$mac_camera_sidecar_plist"
bootstrap_plist "$openclaw_app_plist"

kickstart_label "$devbox_tunnel_label"
kickstart_label "$bridge_gateway_label"
kickstart_label "$mac_camera_sidecar_label"
kickstart_label "$openclaw_app_label"

printf '%s\n' '{"ok":true,"installed":true,"labels":["ai.javis.openclaw-devbox-tunnel","ai.javis.rokid-bridge-gateway","ai.javis.mac-camera-sidecar","ai.javis.openclaw-macos-app"]}'
