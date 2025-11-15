#!/bin/bash
set -e
# Try multiple locations for supervisord
SUPERVISORD_PATHS=(
    "/usr/bin/supervisord"
    "/usr/sbin/supervisord"
    "$(which supervisord 2> /dev/null)"
    "$(find /usr -name supervisord -type f 2> /dev/null | head -1)"
)

SUPERVISORD_BIN=""
for path in "${SUPERVISORD_PATHS[@]}"; do
    if [ -n "$path" ] && [ -x "$path" ]; then
        SUPERVISORD_BIN="$path"
        break
    fi
done

if [ -z "$SUPERVISORD_BIN" ]; then
    echo "Error: supervisord not found in any of the expected locations"
    ls -la /usr/bin/ | grep supervisor || true
    ls -la /usr/sbin/ | grep supervisor || true
    exit 1
fi
echo "Using supervisord: $SUPERVISORD_BIN"
# Start supervisord
if [ "$DOMAIN" = openfront.dev ] && [ "$SUBDOMAIN" != main ]; then
    exec timeout 18h $SUPERVISORD_BIN -c /etc/supervisor/conf.d/supervisord.conf
else
    exec $SUPERVISORD_BIN -c /etc/supervisor/conf.d/supervisord.conf
fi
