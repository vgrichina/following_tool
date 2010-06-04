require.paths.unshift("./express/lib");
require.paths.unshift("./node-oauth/lib");
require.paths.unshift("./express-auth/lib");

require("express");

require("express/plugins")
use(Cookie)
use(Session, { expires: (12).hours , reapInterval: (2).minutes })

var sys = require("sys");

var OAuth = require("oauth").OAuth;
Object.merge(global, require('express/plugins/auth'));

var twitterConsumerKey = "Am8JnxHXtZwrIuQnTlnQ";
var twitterConsumerSecret = "5wuqO5WvAgyyGQSp0x5xnFkQH9V1AOOe2xy0fl7c7U";

var StrategyDefinition = require('express/plugins/strategyDefinition').StrategyDefinition;
use(Auth, { 
        strategies: {
            "twitter": new StrategyDefinition(Twitter, { consumerKey: twitterConsumerKey, consumerSecret: twitterConsumerSecret })
    }
});

configure(function() {
    set("root", __dirname);
});

get("/auth/twitter", function() {
    var self = this;
    self.authenticate(['twitter'], function(error, authenticated) { 
        if (authenticated) {
            var oa= new OAuth("http://twitter.com/oauth/request_token",
                            "http://twitter.com/oauth/access_token",
                            twitterConsumerKey,
                            twitterConsumerSecret,
                            "1.0",
                            null,
                            "HMAC-SHA1");
            oa.getProtectedResource("http://twitter.com/statuses/user_timeline.xml", "GET",
                self.session.auth["twitter_oauth_token"], self.session.auth["twitter_oauth_token_secret"],
                function (error, data) {
                    sys.p('got protected resource ')
                    self.respond(200, "<html><h1>Hello! Twitter authenticated user ("+self.session.auth.user.username+")</h1>"+data+ "</html>")
                });
        } else {
            sys.inspect(error);
            self.respond(200, "<html><h1>Twitter authentication failed :( </h1></html>")
        }
    });
})

get("/", function() {
    this.render("following.html.haml", {
        layout: false,
        locals: {
            following: [ {name: "foo"}, {name: "bar"} ]
        } 
    });
});

run();
