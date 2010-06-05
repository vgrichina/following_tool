// Configure modules paths
require.paths.unshift("./express/lib");
require.paths.unshift("./node-oauth/lib");
require.paths.unshift("./express-auth/lib");

// Use Express framework and its plugins
require("express");
require("express/plugins")
use(Cookie)
use(Session, { expires: (12).hours , reapInterval: (2).minutes })

// Use secret values from separate module
var secret = require("./secret");

// Use Express authentication plugins, Twitter in particular
Object.merge(global, require('express/plugins/auth'));
var StrategyDefinition = require('express/plugins/strategyDefinition').StrategyDefinition;
use(Auth, {
        strategies: {
            "twitter": new StrategyDefinition(Twitter, { consumerKey: secret.twitterConsumerKey, consumerSecret: secret.twitterConsumerSecret })
        }
});

// Use system module, for debug output, etc.
var sys = require("sys");

// Use various utility functions
require("ext");

// Use OAuth implementation classl
var OAuth = require("oauth").OAuth;

// Stores OAuth instance used to do queries to Twitter API
var oauth =  new OAuth("http://twitter.com/oauth/request_token",
                            "http://twitter.com/oauth/access_token",
                            secret.twitterConsumerKey,
                            secret.twitterConsumerSecret,
                            "1.0",
                            null,
                            "HMAC-SHA1");


function getResource(self, url, method, callback) {
    oauth.getProtectedResource(url, method,
        self.session.auth["twitter_oauth_token"], self.session.auth["twitter_oauth_token_secret"],
        function (error, data) {
            sys.puts('got protected resource ');
            callback(data);
        });
}

configure(function() {
    set("root", __dirname);
});

// Authenticate using Twitter OAuth
get("/auth/twitter", function() {
    var self = this;
    self.authenticate(['twitter'], function(error, authenticated) {
        if (authenticated) {
            // Authenticated successfully, redirect to main page
            self.redirect("/");
        } else {
            sys.inspect(error);
            self.respond(200, "<html><h1>Twitter authentication failed :( </h1></html>");
        }
    });
})

get("/", function() {
    var self = this;

    if (!self.isAuthenticated()) {
        self.redirect("/auth/twitter");
    } else {
        getResource(self, "http://api.twitter.com/1/friends/ids.json", "GET", function (data) {
            var friendsIds = eval(data);

            sys.puts("friendsIds = ", friendsIds);

            getResource(self, "http://api.twitter.com/1/users/lookup.json?user_id=" + friendsIds.take(10).join(","), "GET", function (data) {
                var friends = eval(data);

                self.render("following.html.haml", {
                    layout: false,
                    locals: {
                        friends: friends
                    }
                });
            });
        });
    }
});

run();
