FROM denoland/deno:latest
WORKDIR /app
COPY . .
RUN deno cache main.ts
EXPOSE 8080
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
