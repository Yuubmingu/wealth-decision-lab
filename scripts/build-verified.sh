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

if [[ ! -x "${SITES_PROJECT_ROOT}/node_modules/.bin/next" ]]; then
  echo "Next.js is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

# Next 16.2 에 CLI 절대경로를 넘기면 정적 내보내기가
# "Invariant: Expected workStore to be initialized" 로 중단된다.
# 프리렌더 워커가 work-async-storage 외부 모듈을 번들과 다른 키로 해석해
# getStore() 가 비는 것으로 보인다. 프로젝트 경로에 공백과 한글이 섞여 있어
# 더 잘 드러난다. 상대경로로 실행하면 재현되지 않는다.
# (절대경로 6회 전부 실패, 상대경로 6회 전부 성공.)
# sites-env.sh 가 이미 프로젝트 루트로 이동하므로 상대경로가 안전하다.
next="./node_modules/.bin/next"

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
