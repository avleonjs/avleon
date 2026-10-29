#!/usr/bin/env bash
# Push each folder's history to its standalone repository.
#
# The standalone repos keep their own CI, so releases and deploys work
# exactly as before:
#   packages/core -> avleonjs/avleon-core         (publishes to npm on a v* tag)
#   packages/cli  -> avleonjs/avleon-cli          (releases on push to main)
#   docs          -> avleonjs/avleonjs.github.io  (deploys GitHub Pages on push to main)
#
# Usage:
#   scripts/mirror.sh                  mirror every target
#   scripts/mirror.sh core docs        mirror only the named targets
#   scripts/mirror.sh --tag core v0.3.0
#                                      mirror core, then push tag v0.3.0 to it
#
# Pushes are fast-forward only: if a standalone repo has commits the
# monorepo does not, the push is rejected instead of overwriting them.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

prefix_of() {
  case "$1" in
    core) echo "packages/core" ;;
    cli)  echo "packages/cli" ;;
    docs) echo "docs" ;;
    *) echo "Unknown target '$1' (expected core, cli or docs)" >&2; exit 1 ;;
  esac
}

remote_of() {
  case "$1" in
    core) echo "https://github.com/avleonjs/avleon-core.git" ;;
    cli)  echo "https://github.com/avleonjs/avleon-cli.git" ;;
    docs) echo "https://github.com/avleonjs/avleonjs.github.io.git" ;;
  esac
}

mirror() {
  local target="$1" prefix remote sha
  prefix="$(prefix_of "$target")"
  remote="$(remote_of "$target")"
  echo "==> $target: splitting $prefix"
  sha="$(git subtree split -q --prefix="$prefix" HEAD)"
  echo "==> $target: pushing $sha to $remote main"
  git push "$remote" "$sha:refs/heads/main"
  SPLIT_SHA="$sha"
}

if [ "${1:-}" = "--tag" ]; then
  target="${2:?Usage: scripts/mirror.sh --tag <core|cli|docs> <tag>}"
  tag="${3:?Usage: scripts/mirror.sh --tag <core|cli|docs> <tag>}"
  mirror "$target"
  echo "==> $target: pushing tag $tag ($SPLIT_SHA)"
  git push "$(remote_of "$target")" "$SPLIT_SHA:refs/tags/$tag"
  exit 0
fi

if [ "$#" -eq 0 ]; then
  set -- core cli docs
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Note: uncommitted changes are not mirrored; only committed history is pushed." >&2
fi

for target in "$@"; do
  mirror "$target"
done
