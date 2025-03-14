ARG SOURCE_DIGEST=d7a882db5450b0f95c8ccf6797d9c4a0c14b9d34f4d4fd66289e6125b95e7989
FROM nginx:1.27.4-alpine-slim@sha256:${SOURCE_DIGEST}
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
