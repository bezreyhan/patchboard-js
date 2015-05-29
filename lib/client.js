// Generated by CoffeeScript 1.8.0
(function() {
  var API, Action, Patchboard, Request,
    __slice = [].slice;

  Request = require("./request");

  API = require("./api");

  Action = require("./action");

  module.exports = Patchboard = (function() {
    var Client;

    Patchboard.Request = Request;

    Patchboard.discover = function() {
      var args, callback, options, req, url;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 2) {
        url = args[0], callback = args[1];
        options = {};
      } else if (args.length === 3) {
        url = args[0], options = args[1], callback = args[2];
      }
      if (url.constructor !== String) {
        throw new Error("Discovery URL must be a string");
      }
      req = {
        url: url,
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      };
      return new Request(req, (function(_this) {
        return function(error, response) {
          var client;
          if (error != null) {
            return callback(error);
          } else {
            if (response.data != null) {
              client = new _this(response.data, options);
              return callback(null, client);
            } else {
              return callback(new Error("Unparseable response body"));
            }
          }
        };
      })(this));
    };

    function Patchboard(api, options) {
      var client, context, _ref;
      this.options = options != null ? options : {};
      _ref = this.options, this.authorizer = _ref.authorizer, context = _ref.context;
      this.context_creator = context || Object;
      this.api = new API(api);
      this.create_resource_constructors(this.api.resources, this.api.mappings);
      client = this.spawn();
      this.resources = client.resources;
      this.context = client.context;
    }

    Patchboard.prototype.spawn = function(context) {
      if (context == null) {
        context = new this.context_creator();
      }
      return new Client(this, context, this.api);
    };

    Client = (function() {
      function Client(main, context, api) {
        this.context = context;
        Object.defineProperty(this, "main", main);
        this.resources = this.create_endpoints(this.context, api.mappings);
      }

      Client.prototype.spawn = function(context) {
        return this.main.spawn(context);
      };

      Client.prototype.create_endpoints = function(context, mappings) {
        var endpoints, mapping, name, _fn;
        endpoints = {};
        _fn = (function(_this) {
          return function(name, mapping) {
            var constructor, path, query, template, url;
            url = mapping.url, query = mapping.query, path = mapping.path, template = mapping.template;
            constructor = mapping.constructor;
            if ((template != null) || (query != null)) {
              return endpoints[name] = function(params) {
                if (params == null) {
                  params = {};
                }
                return new constructor(context, {
                  url: mapping.generate_url(params)
                });
              };
            } else if (path != null) {
              return endpoints[name] = new constructor(context, {
                url: mapping.generate_url()
              });
            } else if (url != null) {
              return endpoints[name] = new constructor(context, {
                url: url
              });
            } else {
              return console.error("Unexpected mapping:", name, mapping);
            }
          };
        })(this);
        for (name in mappings) {
          mapping = mappings[name];
          _fn(name, mapping);
        }
        return endpoints;
      };

      return Client;

    })();

    Patchboard.prototype.create_resource_constructors = function(definitions, mappings) {
      var alias, constructor, constructors, definition, mapping, name, _i, _len, _ref;
      constructors = {};
      for (name in mappings) {
        mapping = mappings[name];
        definition = mapping.resource;
        constructor = this.resource_constructor({
          mapping: mapping,
          definition: definition
        });
        mapping.constructor = constructor;
        constructors[name] = constructor;
        if (definition.aliases != null) {
          _ref = definition.aliases;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            alias = _ref[_i];
            constructors[alias] = constructor;
          }
        }
      }
      return constructors;
    };

    Patchboard.prototype.resource_constructor = function(_arg) {
      var client, constructor, def, definition, mapping, method, name, _fn, _ref, _ref1;
      mapping = _arg.mapping, definition = _arg.definition;
      client = this;
      constructor = function(context, data) {
        var key, value;
        this.context = context;
        if (data == null) {
          data = {};
        }
        if ((data != null ? data.constructor : void 0) === String) {
          this.url = data;
        } else {
          for (key in data) {
            value = data[key];
            this[key] = value;
          }
        }
        return this;
      };
      constructor.prototype._actions = {};
      constructor.prototype.resource_type = definition.name;
      Object.defineProperty(constructor.prototype, "patchboard_client", {
        value: this,
        enumerable: false
      });
      _ref = definition.actions;
      _fn = function(name, def) {
        var action;
        action = constructor.prototype._actions[name] = new Action(client, name, def);
        return constructor.prototype[name] = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return action.request.apply(action, [this, this.url].concat(__slice.call(args)));
        };
      };
      for (name in _ref) {
        def = _ref[name];
        _fn(name, def);
      }
      _ref1 = this.resource_methods;
      for (name in _ref1) {
        method = _ref1[name];
        constructor.prototype[name] = method;
      }
      return constructor;
    };

    Patchboard.prototype.resource_methods = {
      curl: function() {
        var action, agent, args, body, command, header, headers, method, name, request, url, value;
        name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        action = this._actions[name];
        request = action.create_request.apply(action, [this.url].concat(__slice.call(args)));
        method = request.method, url = request.url, headers = request.headers, body = request.body;
        agent = headers["User-Agent"];
        command = [];
        command.push("curl -v -A '" + agent + "' -X " + method);
        for (header in headers) {
          value = headers[header];
          if (header !== "User-Agent") {
            command.push("  -H '" + header + ": " + value + "'");
          }
        }
        if (body != null) {
          command.push("  -d " + (JSON.stringify(body)));
        }
        command.push("  " + url);
        return command.join(" \\\n");
      }
    };

    return Patchboard;

  })();

}).call(this);