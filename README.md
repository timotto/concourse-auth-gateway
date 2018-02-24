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

## Configuration

All configuration is done through environment variables. 
In The default configuration the credentials are not persisted and will be lost after
the application is shutdown.
- ```PORT``` default: ```3001``` defines the TCP port the application is listening on
- ```CONCOURSE_URL``` default: ```undefined``` overrides the ```X-Concourse-Url``` HTTP 
header value turning the gateway into a fixed Concourse proxy for the given instance
- ```REDIS_URL``` default: ```undefined``` defines the URL of the Redis server used as 
credential repository. Credentials are not persisted if no value is given
- ```SECRET``` default: ```changeme``` must be shared across all instances using the
same Redis server as backing store