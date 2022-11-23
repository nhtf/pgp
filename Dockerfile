FROM postgres:latest
ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD postgres
ENV POSTGRESS_DB=deb
ADD session_table.sql /docker-entrypoint-initdb.d/
