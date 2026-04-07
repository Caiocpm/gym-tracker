#!/usr/bin/env bash
# Executa o app no Chrome usando o Flutter standalone (sem puro)
set -e
cd "$(dirname "$0")"
PUB_CACHE="$HOME/.puro/shared/pub_cache" /c/flutter/bin/flutter run \
  -d chrome \
  --web-port 8080 \
  --dart-define=API_BASE_URL=http://localhost:3000/api \
  "$@"
