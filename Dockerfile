FROM nginx

COPY dist/bundle.tar.gz /home/bundle.tar.gz
COPY scripts/run.sh /home/run.sh
RUN chmod +x /home/run.sh
RUN mkdir -p /usr/share/nginx/html/datahub/ui/
RUN tar -xzvf /home/bundle.tar.gz -C /usr/share/nginx/html/datahub/ui/

ARG SECURE_MODE
ARG REPORTING_URL
ARG INDEXING_URL
ARG OBJECT_URL
ARG STORAGE_URL
ARG DATAHUB_URL
ARG AUTH_URL
ARG CONSENT_URL

ENV SECURE_MODE ${SECURE_MODE}
ENV REPORTING_URL ${REPORTING_URL}
ENV INDEXING_URL ${INDEXING_URL}
ENV OBJECT_URL ${OBJECT_URL}
ENV STORAGE_URL ${STORAGE_URL}
ENV DATAHUB_URL ${DATAHUB_URL}
ENV AUTH_URL ${AUTH_URL}
ENV CONSENT_URL ${CONSENT_URL}

# run server command
CMD ["/home/run.sh"]
