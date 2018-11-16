#!/bin/bash

# write config with env vars
CONFIG_LOCATION="/usr/share/nginx/html/datahub/ui/config.js"
echo "Writing config file to $CONFIG_LOCATION..."
cat <<EOF > $CONFIG_LOCATION
window.config = {
  SECURE_MODE: $SECURE_MODE,
  REPORTING_URL: "$REPORTING_URL",
  INDEXING_URL: "$INDEXING_URL",
  OBJECT_URL: "$OBJECT_URL",
  STORAGE_URL: "$STORAGE_URL",
  DATAHUB_URL: "$DATAHUB_URL",
  IDENTITY_URL: "$IDENTITY_URL",
  CONSENT_URL: "$CONSENT_URL"
};
EOF

echo "Starting nginx..."
nginx -g 'daemon off;'
