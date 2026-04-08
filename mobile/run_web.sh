#!/usr/bin/env bash
# Executa o app no Chrome usando o Flutter standalone
set -e
cd "$(dirname "$0")"
flutter run -d chrome "$@"
