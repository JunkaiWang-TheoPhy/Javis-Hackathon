#!/usr/bin/env bash
set -euo pipefail

docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-ha-control
docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-rokid-bridge
docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-hue
docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-google-home
docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-lutron
docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-smartthings
docker compose exec openclaw-cli openclaw plugins install /project/plugins/openclaw-plugin-alexa
docker compose restart openclaw-gateway
