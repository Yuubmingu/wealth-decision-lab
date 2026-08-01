#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

if command -v timeout >/dev/null; then
  timeout_command=(timeout)
elif command -v gtimeout >/dev/null; then
  # Homebrew names GNU coreutils commands with a "g" prefix on macOS.
  timeout_command=(gtimeout)
else
  echo "GNU timeout is unavailable; running the build without a time limit." >&2
  timeout_command=()
fi

next="${SITES_PROJECT_ROOT}/node_modules/.bin/next"
if [[ ! -x "${next}" ]]; then
  echo "Next.js is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Running bounded static Next.js export..."
if [[ "${#timeout_command[@]}" -gt 0 ]]; then
  "${timeout_command[@]}" \
    --signal=TERM \
    --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
    "${SITES_BUILD_TIMEOUT:-3m}" \
    "${next}" build
else
  "${next}" build
fi

"${script_dir}/package-static-site.sh"

"${script_dir}/validate-artifact.sh"
