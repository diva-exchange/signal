FROM node:lts-alpine

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="diva.signal.server" \
  description="Rendezvous server, NAT traversal for iroha peers" \
  url="https://diva.exchange"

COPY package.json /home/node/package.json
COPY ecosystem.config.js /home/node/ecosystem.config.js
COPY LICENSE /home/node/LICENSE
COPY README.md /home/node/README.md

# Applications
COPY app /home/node/app

# Entrypoint
COPY entrypoint.sh /
# If you are building your code for production
# RUN npm ci --only=production
RUN cd /home/node/ \
      && npm install pm2 -g \
      && npm install --production

EXPOSE 3903

ENTRYPOINT ["/entrypoint.sh"]
