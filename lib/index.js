'use strict';

const path = require('path');
const supertest = require('supertest');

let request;
let framework;

exports.contentTypes = {
  json: /application\/json/
};

exports.setup = function(config) {

  if (config.app)
    request = supertest(config.app);

  if (typeof config.framework === 'string')
    framework = require(['.', 'frameworks', config.framework].join(path.sep))(config);
  else
    framework = config.framework;
};

exports.request = function(verb, url, config) {
  const send = (typeof config.send === 'function') ? config.send() : config.send;

  if (!request)
    throw new Error(`setup() has to be called with the 'app' config property before making any requests.`);

  return Promise
    .resolve(send)
    .then(send => {
      const req = request[verb](url);

      if (send)
        req.send(send);

      // we don't want to run the request yet so we can't return 'req' directly as its 'then()' function would be called
      // which would run the request and the returned promise would resolve to the result instead of the request itself
      return {req};
    });
};

exports.createRequestTests = function(verb, url, configs) {
  configs.forEach((config) => {
    const title = config.title || ('should respond with ' + config.status);

    framework.createTest(title, function(done) {
      const cb = framework.doneCB(done);

      url = (typeof url === 'function') ? url() : url;

      const promise = exports
        .request(verb, url, config)
        .then(function({req}) {
          req.expect(config.status);

          if (config.contentType)
            req.expect('Content-Type', exports.contentTypes[config.contentType] || config.contentType);

          return req
            .then((res) => {
              if (typeof config.check === 'function')
                return config.check(res);
              else
                return null;
            })
        });

      if (cb) {
        promise
          .then(cb)
          .catch(cb);
      }

      return promise;
    });
  });
};
