#
# Copyright (C) 2020 diva.exchange
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
# Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
#

FROM node:lts-alpine

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="signal.diva.exchange" \
  description="A generic rendezvous server to enable NAT traversal of services located behind firewalls" \
  url="https://signal.diva.exchange"

COPY package.json /home/node/package.json
COPY app /home/node/app
COPY entrypoint.sh /

RUN cd /home/node/ \
  && npm i --only=production \
  && chmod a+x /entrypoint.sh

EXPOSE 3903

WORKDIR "/home/node/"
ENTRYPOINT ["/entrypoint.sh"]
