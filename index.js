var util = require("util");
var url = require("url");

module.exports = function (everyauth) {
  if (! everyauth.oauth2) {
    everyauth.oauth2 = require("everyauth-oauth2")(everyauth);
  }
  everyauth.github =
  everyauth.oauth2.submodule("github")
  .configurable({
      scope: 'specify types of access: (no scope), user, public_repo, repo, gist'
  })

  .oauthHost('https://github.com')
  .apiHost('https://api.github.com')

  .customHeaders({'User-Agent': 'everyauth-github'})

  .authPath('/login/oauth/authorize')
  .accessTokenPath('/login/oauth/access_token')

  .entryPath('/auth/github')
  .callbackPath('/auth/github/callback')

  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/user', accessToken, function (err, data) {
      if (err) return p.fail(err);
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    });
    return p;
  });

  everyauth.github.AuthCallbackError = AuthCallbackError;

  return everyauth.github;
};

function AuthCallbackError (req) {
  Error.call(this);
  Error.captureStackTrace(this, AuthCallbackError);
  this.name = 'AuthCallbackError';
  var query = url.parse(req.url, true).query;
  this.message = query.error + "; " + query.error_description;
}
util.inherits(AuthCallbackError, Error);
