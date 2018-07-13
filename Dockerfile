FROM node:slim AS build

ADD . /build

WORKDIR /build

RUN npm install && \
    npm run test && \
    npm run tsc && \
    rm -rf node_modules/ && \
    npm install --production=true

FROM node:slim AS runtime

COPY --from=build /build /app

WORKDIR /app

ENV PORT 3001

ENV STATE_FILENAME /state.json

CMD node dist
