#!/usr/bin/env sh
set -euo pipefail

echo "### Initialising nginx configuration"
cp /etc/nginx/nginx.conf /tmp/nginx.conf

echo "### Configuring Hostname for Content-Security-Policy"
sed -i 's|${PORTAL_CSP_HOSTNAME}|'"$PORTAL_CSP_HOSTNAME"'|g' /tmp/nginx.conf
