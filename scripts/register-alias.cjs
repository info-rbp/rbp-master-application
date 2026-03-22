const Module = require('module');
const path = require('path');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patched(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    request = path.join(process.cwd(), 'src', request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
