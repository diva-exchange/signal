FROM node:lts-alpine

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="diva.signal.server" \
  description="A generic rendezvous server to enable NAT traversal of services located behind firewalls" \
  url="https://diva.exchange"

COPY package.json /home/node/package.json
COPY app /home/node/app
COPY entrypoint.sh /

RUN cd /home/node/ \
  && npm i --production \
  && chmod a+x /entrypoint.sh

EXPOSE 3903

WORKDIR "/home/node/"
ENTRYPOINT ["/entrypoint.sh"]
