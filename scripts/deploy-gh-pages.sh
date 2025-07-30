#!/bin/bash

set -euo pipefail


function main {
  trap _on_exit INT TERM EXIT
  read APP_PATH BUILD_DIR GH_BRANCH REPO_URL <<< "$(_parse_args "$@")"

  _info "Building Vite app at ${APP_PATH}..."
  _build "$APP_PATH"

  _info "Preparing temporary directory..."
  _create_staging_area "$BUILD_DIR" "/tmp/dialetica-gh-pages"

  _info "Deploying to branch: ${GH_BRANCH} on repo: ${REPO_URL}"
  _deploy "/tmp/dialetica-gh-pages" "$GH_BRANCH" "$REPO_URL"

  _info "Deployment complete!"
}

function _build {
  local app_path="$1"

  (cd "${app_path}" && pnpm run build)
}

function _create_staging_area {
  local build_dir="$1"
  local temp_dir="$2"

  rm -rf "${temp_dir}"
  mkdir -p "${temp_dir}"
  cp -r "${build_dir}"/* "${temp_dir}"
}

function _parse_args {
  local APP_PATH=""
  local BUILD_DIR=""
  local GH_BRANCH="gh-pages"
  local REPO_URL="git@github.com:edsilfer/dialectica.git"

  while [[ $# -gt 0 ]]; do
    case $1 in
      --repo)
        REPO_URL="$2"
        shift 2
        ;;
      --branch)
        GH_BRANCH="$2"
        shift 2
        ;;
      --app)
        APP_PATH="$2"
        BUILD_DIR="${APP_PATH}/dist"
        shift 2
        ;;
      -h|--help)
        _help
        exit 0
        ;;
      *)
        _error "Unknown argument: ${1}"
        _help
        exit 1
        ;;
    esac
  done

  if [[ -z "$APP_PATH" ]]; then
    _error "Missing required --app argument"
    _help
    exit 1
  fi

  echo "$APP_PATH" "$BUILD_DIR" "$GH_BRANCH" "$REPO_URL"
}

function _help {
  echo "Usage: ./_deploy-gh-pages.sh [options]"
  echo ""
  echo "Options:"
  echo "  --repo <url>       GitHub repository URL (SSH or HTTPS)"
  echo "  --branch <name>    Git branch to push to (default: gh-pages)"
  echo "  --app <path>       Path to app directory (required)"
  echo "  -h, --help         Show this help message"
}

function _deploy {
  local temp_dir="$1"
  local branch="$2"
  local repo="$3"
  
  cd "$temp_dir"
  git init
  git checkout -b "$branch"
  git add .
  git commit -m "Deploy to GitHub Pages ($(date '+%Y-%m-%d %H:%M:%S'))"
  git remote add origin "${repo}"
  git push -f origin "$branch"
  cd - > /dev/null
}

function _cleanup {
  local temp_dir="/tmp/dialetica-gh-pages"
  
  _info "Cleaning up temporary directories & files..."
  rm -rf "${temp_dir}"
}

function _info {
  echo -e "\033[32m[INFO] ${1}\033[0m"
}

function _error {
  echo -e "\033[31m[ERROR] ${1}\033[0m"
}

function _on_exit {
  _cleanup
  trap - INT TERM EXIT
}

main "$@"