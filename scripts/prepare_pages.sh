#!/usr/bin/env sh
set -eu

client_dir="${1:-dist/client}"
base_name="repo-gauntlet"
route_document="${client_dir}/${base_name}.html"
route_assets="${client_dir}/${base_name}"

if [ ! -f "${route_document}" ] || [ ! -d "${route_assets}" ]; then
  echo "expected Vinext base-path output was not produced" >&2
  exit 1
fi

# GitHub Pages mounts the uploaded artifact at /repo-gauntlet. Vinext keeps the
# base path inside its export tree, so promote the route document and assets to
# the artifact root while retaining their /repo-gauntlet URLs in the HTML.
cp "${route_document}" "${client_dir}/index.html"
cp -R "${route_assets}/." "${client_dir}/"

test -f "${client_dir}/index.html"
test -f "${client_dir}/index.txt"
test -d "${client_dir}/_next"

