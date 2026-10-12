ARG SOURCE_DIGEST=sha256:f761b94f2cb9e8e05e2943d5f773609596113ef69b54e2433a996d109a8f78b7
FROM nginx:1.31.6-alpine3.24-slim@${SOURCE_DIGEST}
ARG SOURCE_DIGEST

# The STOPSIGNAL instruction sets the system call signal that will be sent to the container to exit
# SIGTERM = 15 - https://de.wikipedia.org/wiki/Signal_(Unix)
STOPSIGNAL SIGTERM

# Define the exposed port or range of ports for the service
EXPOSE 8080

ENV PORTAL_CSP_HOSTNAME=HOST_NOT_SET

# Defining Healthcheck
HEALTHCHECK --interval=15s \
    --timeout=10s \
    --start-period=30s \
    --retries=3 \
    CMD ["/usr/bin/wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]

# Copy required files
COPY --chown=nginx:nginx ./config/docker /
COPY --chown=nginx:nginx ./dist/*/* /usr/share/nginx/html

USER root

## Add permissions
RUN chmod +x /docker-entrypoint.d/*.sh

## switch to non-root user
USER nginx

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-c", "/tmp/nginx.conf", "-g", "daemon off;"]

###########################
# Labels
###########################

ARG COMMIT_HASH
ARG VERSION

LABEL de.gematik.commit-sha=$COMMIT_HASH \
    de.gematik.version=$VERSION \
    de.gematik.source.digest=$SOURCE_DIGEST \
    de.gematik.vendor="gematik GmbH" \
    maintainer="software-development@gematik.de" \
    de.gematik.app="DEMIS Notification Portal IGS" \
    de.gematik.git-repo-name="https://gitlab.prod.ccs.gematik.solutions/git/demis/portal/portal-igs.git"
