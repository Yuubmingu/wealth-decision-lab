#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"

[[ -d "${project_root}/out" ]] || {
  echo "Missing static export directory: out" >&2
  exit 66
}

rm -rf "${project_root}/dist"
mkdir -p "${project_root}/dist/client" "${project_root}/dist/server" "${project_root}/dist/.openai"
cp -R "${project_root}/out/." "${project_root}/dist/client/"
cp "${project_root}/worker/static-index.js" "${project_root}/dist/server/index.js"
cp "${project_root}/worker/static-wrangler.json" "${project_root}/dist/server/wrangler.json"
cp "${project_root}/.openai/hosting.json" "${project_root}/dist/.openai/hosting.json"

echo "Packaged static Sites artifact."
