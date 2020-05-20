FROM node:lts-alpine

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="diva.signal.server" \
  description="A generic rendezvous server to enable NAT traversal of services located behind firewalls" \
  url="https://diva.exchange"

WORKDIR /home/node

COPY package.json /home/node/package.json
COPY app /home/node/app

RUN apk --no-cache add \
  make \
  gcc \
  python3 \
  && cd /home/node/ \
  && npm install request \
  && npm install pm2 \
  && npm install --production \
  && npm ci --only=production

# prepare final image
FROM node:lts-alpine
WORKDIR /home/node

COPY --from=0 /home/node/package.json /home/node/
COPY --from=0 /home/node/package-lock.json /home/node/
COPY --from=0 /home/node/node_modules /home/node/node_modules
COPY --from=0 /home/node/app /home/node/app

COPY ecosystem.config.js /home/node/ecosystem.config.js
COPY LICENSE /home/node/LICENSE
COPY README.md /home/node/README.md

# Entrypoint
COPY entrypoint.sh /

EXPOSE 3903

ENTRYPOINT ["/entrypoint.sh"]
