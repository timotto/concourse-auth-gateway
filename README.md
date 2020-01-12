# Deprecated

Since Concourse now supports different user roles this gateway is no longer required to view pipelines.

The pipeline for this project has been removed and there will be no more updates.

# Concourse Authenticating Gateway

[![Build Status](https://travis-ci.org/timotto/concourse-auth-gateway.svg?branch=master)](https://travis-ci.org/timotto/concourse-auth-gateway)
[![Coverage Status](https://coveralls.io/repos/github/timotto/concourse-auth-gateway/badge.svg?branch=master)](https://coveralls.io/github/timotto/concourse-auth-gateway?branch=master)
[![Dependency Status](https://david-dm.org/timotto/concourse-auth-gateway.svg)](https://david-dm.org/timotto/concourse-auth-gateway)
[![devDependency Status](https://david-dm.org/timotto/concourse-auth-gateway/dev-status.svg)](https://david-dm.org/timotto/concourse-auth-gateway#info=devDependencies)

This Concourse Reverse Proxy stores and injects credentials into requests forwarded to
Concourse so that pipelines do not have to be exposed or public for a status monitor
to display them.

To select a Concourse backend the client needs to send the URL to the Concourse
instance in the ```X-Concourse-Url``` HTTP header value. 

To add credentials simply log-in to a team using the web interface through the 
Concourse Reverse Proxy.

The Concourse Reverse Proxy detects the appropriate credentials based on the API
url.  

The ```/api/v1/pipelines``` endpoint has special treatment: it is executed with every
known credential and the result is merged.

## Credential Management

Team credentials can be entered using the web interface through the proxy of the instance.
Alternatively basic authentication credentials as well as ATC Bearer Tokens can also be
entered using the ```/_auth/basic``` and ```/_auth/token``` endpoints, eg.:
```bash
http POST concourse-gateway.cloud.corp/_auth/token \
    team=some-team \
    token="Bearer AAx..." \
    concourseUrl=https://ci.cloud.corp
#or 
http POST concourse-gateway.cloud.corp/_auth/basic \
    team=different-team \
    credentials="Basic BASE64..." \
    concourseUrl=https://ci.cloud.corp
```
This allows running the Concourse Auth Gateway behind a Basic Authentication protected
reverse proxy which would prohibit the use of (again) Basic Authentication to log-in 
to a Concourse team while still maintaining an interface to manage team credentials.

### Persistence

The app itself tries to follow the principles of [the 12 factor app](https://12factor.net/)
and is ready for stateless cluster operation. For credentials and tokens to be available
across the cluster a Redis server is used as shared memory between the instances. The
values of credentials and tokens stored on the Redis server are encrypted using symmetric 
AES-256 block cipher based on the provided ```SECRET``` value shared across all instances.

## Configuration

All configuration is done through environment variables. 
In the default configuration the credentials are not persisted and will be lost after
the application is shutdown.
- ```PORT``` default: ```3001``` defines the TCP port the application is listening on
- ```CONCOURSE_URL``` default: ```undefined``` overrides the ```X-Concourse-Url``` HTTP 
header value turning the gateway into a fixed Concourse proxy for the given instance
- ```REDIS_URL``` default: ```empty``` defines the URL of the Redis server used as 
credential repository. Credentials are not persisted if no value is given
- ```SECRET``` default: ```changeme``` must be shared across all instances using the
same Redis server as backing store
- ```SALT``` default: ```changeme``` must be shared across all instances using the
same Redis server as backing store
- ```ITERATIONS``` default: ```100000``` must be shared across all instances using the
same Redis server as backing store
- ```DIGEST``` default: ```sha512``` must be shared across all instances using the
same Redis server as backing store
