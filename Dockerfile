# Dockerfile.build (기존 파일 유지)
ARG NODE_VERSION=18.19.0
FROM node:${NODE_VERSION} AS base

ENV HOME='.'
RUN apt-get update && \
    apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 \
      libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 \
      libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
      libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
      libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget openjdk-17-jre python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Chrome 설치
# Specify the version of Chrome that matches the version of chromedriver in the package.json.
# A list of Chrome versions can be found here:
# https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-stable
ARG CHROME_VERSION=stable
RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && wget -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y rsync jq tar python3-pip --no-install-recommends \
    && apt-get install -y /tmp/chrome.deb --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Python venv 설정
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install awscli

# OpenSearch Dashboards 실행 유저 생성
RUN groupadd -r opensearch-dashboards && \
		useradd -r -g opensearch-dashboards opensearch-dashboards && \
		mkdir /home/opensearch-dashboards && \
		chown opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards

WORKDIR /app

COPY build /usr/share/opensearch-dashboards

COPY config /usr/share/opensearch-dashboards

USER opensearch-dashboards

CMD ["/usr/share/opensearch-dashboards/bin/opensearch-dashboards"]