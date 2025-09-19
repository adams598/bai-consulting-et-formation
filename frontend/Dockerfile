FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# Installation d'OpenSSL pour la génération de certificats
RUN apk add --no-cache openssl

# Création des répertoires SSL
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

# Copie des fichiers de configuration
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-ssl.conf /etc/nginx/nginx.conf

# Génération automatique de certificats auto-signés pour le développement
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/server.key \
    -out /etc/ssl/certs/server.crt \
    -subj "/C=FR/ST=France/L=Paris/O=BAI Consulting/CN=localhost"

# Génération du paramètre DH pour la sécurité SSL
RUN openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Configuration des permissions
RUN chmod 600 /etc/ssl/private/server.key
RUN chmod 644 /etc/ssl/certs/server.crt
RUN chmod 644 /etc/ssl/certs/dhparam.pem

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"] 