FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html privacy.html terms.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

RUN nginx -t

EXPOSE 80
