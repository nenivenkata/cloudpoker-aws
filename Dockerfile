FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --chown=node:node package.json ./
COPY --chown=node:node app ./app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "app/server.js"]
