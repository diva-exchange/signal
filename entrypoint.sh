#!/bin/sh
#
# Author/Maintainer: konrad@diva.exchange
#

# start application
su node -c "cd /home/node/ && ./node_modules/.bin/pm2-runtime start ecosystem.config.js --env production"

