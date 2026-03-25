#!/bin/bash
curl -i -N -X GET "http://localhost:9002/mcp" \
  -H "Authorization: Bearer my-secret-test-token" \
  -H "Origin: http://localhost:9002"
