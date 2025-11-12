FROM ubuntu:22.04

ARG NODEJS_VERSION=20

RUN apt-get update && \
    apt-get install -y git curl build-essential && \
    echo "##############" && \
    echo "Install NodeJS ${NODEJS_VERSION}" && \
    echo "##############" && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/trusted.gpg.d/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/trusted.gpg.d/nodesource.gpg] https://deb.nodesource.com/node_$NODEJS_VERSION.x nodistro main" | tee -a /etc/apt/sources.list.d/nodesource.list ; \
    apt-get update && \
    apt-get install -y nodejs && \
    echo "##############" && \
    echo "Install npm" && \
    echo "##############" && \
    curl -sL https://www.npmjs.com/install.sh | bash ; \
    npm update -g npm && \
    echo "##############" && \
    echo "Install Google Chrome" && \
    echo "##############" && \
    curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/trusted.gpg.d/google.gpg && \
    echo "deb [signed-by=/etc/apt/trusted.gpg.d/google.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | tee -a /etc/apt/sources.list.d/google.list ; \
    apt-get update -y && \
    apt-get install -y google-chrome-stable && \
    rm -rf /etc/apt/sources.list.d/google-chrome.list && \
    rm -rf /etc/apt/sources.list.d/google.list && \
    # clean up
    apt-get autoremove --purge -y &&  \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* 

ARG USERID=1000
RUN useradd user -m -u $USERID -U -s /bin/bash -r

USER user

WORKDIR /project

ENV CHROME_BIN=/usr/bin/google-chrome