# Concourse Authenticating Gateway

[![Build Status](https://travis-ci.org/timotto/concourse-auth-gateway.svg?branch=master)](https://travis-ci.org/timotto/concourse-auth-gateway)
[![Coverage Status](https://coveralls.io/repos/github/timotto/concourse-auth-gateway/badge.svg?branch=master)](https://coveralls.io/github/timotto/concourse-auth-gateway?branch=master)

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

The ```STATE_FILENAME``` environment variable controls the location of the file to save
the stored credentials and tokens in.

The ```PORT``` environment variable defines the TCP port the application is listening on.

If ```CONCOURSE_URL``` is set the ```X-Concourse-Url``` HTTP header will be ignored and
the Concourse URL is fixed.