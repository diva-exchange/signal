#!/bin/sh
#
# Author/Maintainer: konrad@diva.exchange
#
# Start signal server
#

# start applications
su node -c "cd /home/node/ && pm2-runtime start ecosystem.config.js --env production"

