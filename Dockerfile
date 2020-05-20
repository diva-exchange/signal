FROM node:lts-alpine

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="diva.signal.server" \
  description="A generic rendezvous server to enable NAT traversal of services located behind firewalls" \
  url="https://diva.exchange"

WORKDIR /home/node

COPY package.json /home/node/package.json
COPY app /home/node/app

# If you are building your code for production
# RUN npm ci --only=production
RUN apk --no-cache add \
  make \
  gcc \
  python3 \
  && cd /home/node/ \
  && npm install --production \
  && npm ci --only=production

# 3. prepare final image
FROM node:lts-alpine
WORKDIR /home/node

COPY --from=0 /home/node/package.json /home/node/
COPY --from=0 /home/node/package-lock.json /home/node/
COPY --from=0 /home/node/node_modules /home/node/
COPY --from=0 /home/node/app /home/node/

COPY ecosystem.config.js /home/node/ecosystem.config.js
COPY LICENSE /home/node/LICENSE
COPY README.md /home/node/README.md

RUN cd /home/node/ \
  && npm install pm2 -g \
  && npm install --production

# Entrypoint
COPY entrypoint.sh /

EXPOSE 3903

ENTRYPOINT ["/entrypoint.sh"]
