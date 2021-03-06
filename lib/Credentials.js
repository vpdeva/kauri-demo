'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _JWT = require('./JWT');

var _jsontokens = require('jsontokens');

var _uportLite = require('uport-lite');

var _uportLite2 = _interopRequireDefault(_uportLite);

var _nets = require('nets');

var _nets2 = _interopRequireDefault(_nets);

var _tweetnacl = require('tweetnacl');

var _tweetnacl2 = _interopRequireDefault(_tweetnacl);

var _tweetnaclUtil = require('tweetnacl-util');

var _tweetnaclUtil2 = _interopRequireDefault(_tweetnaclUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
*    The Credentials class allows you to easily create the signed payloads used in uPort inlcuding
*    credentials and signed mobile app requests (ex. selective disclosure requests
*    for private data). It also provides signature verification over signed payloads and
*    allows you to send push notifications to users.
*/
var Credentials = function () {

  /**
   * Instantiates a new uPort Credentials object
   *
   * @example
   * import { Credentials, SimpleSigner } from 'uport'
   * const networks = {  '0x94365e3b': { rpcUrl: 'https://private.chain/rpc', registry: '0x0101.... }}
   * const setttings = { networks, address: '5A8bRWU3F7j3REx3vkJ...', signer: new SimpleSigner(process.env.PRIVATE_KEY)}
   * const credentials = new Credentials(settings)
   *
   * @example
   * import { Credentials } from 'uport'
   * const credentials = new Credentials()
   *
   * @param       {Object}            [settings]             setttings
   * @param       {Object}            settings.networks      networks config object, ie. {  '0x94365e3b': { rpcUrl: 'https://private.chain/rpc', address: '0x0101.... }}
   * @param       {UportLite}         settings.registry      a registry object from UportLite
   * @param       {SimpleSigner}      settings.signer        a signer object, see SimpleSigner.js
   * @param       {Address}           settings.address       your uPort address (may be the address of your application's uPort identity)
   * @return      {Credentials}                              self
   */
  function Credentials() {
    var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Credentials);

    this.settings = settings;
    this.settings.networks = settings.networks ? configNetworks(settings.networks) : {};
    if (!this.settings.registry) {
      var registry = (0, _uportLite2.default)({ networks: this.settings.networks });
      this.settings.registry = function (address) {
        return new Promise(function (resolve, reject) {
          registry(address, function (error, profile) {
            if (error) return reject(error);
            resolve(profile);
          });
        });
      };
    }
  }

  /**
   *  Creates a signed request token (JWT) given a request params object.
   *
   *  @example
   *  const req = { requested: ['name', 'country'],
   *                callbackUrl: 'https://myserver.com',
   *                notifications: true }
   *  credentials.createRequest(req).then(jwt => {
   *      ...
   *  })
  
  
   requested: ['name','phone','identity_no'],
      callbackUrl: 'https://....' // URL to send the response of the request to
      notifications: true
  
   *
   *  @param    {Object}             [params={}]           request params object
   *  @param    {Array}              params.requested      an array of attributes for which you are requesting credentials to be shared for
   *  @param    {Array}              params.verified       an array of attributes for which you are requesting verified credentials to be shared for
   *  @param    {Boolean}            params.notifications  boolean if you want to request the ability to send push notifications
   *  @param    {String}             params.callbackUrl    the url which you want to receive the response of this request
   *  @param    {String}             params.network_id     network id of Ethereum chain of identity eg. 0x4 for rinkeby
   *  @param    {String}             params.accountType    Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none"
   *  @return   {Promise<Object, Error>}                   a promise which resolves with a signed JSON Web Token or rejects with an error
   */


  _createClass(Credentials, [{
    key: 'createRequest',
    value: function createRequest() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var payload = {};
      if (params.requested) {
        payload.requested = params.requested;
      }
      if (params.verified) {
        payload.verified = params.verified;
      }
      if (params.notifications) {
        payload.permissions = ['notifications'];
      }
      if (params.callbackUrl) {
        payload.callback = params.callbackUrl;
      }
      if (params.network_id) {
        payload.net = params.network_id;
      }
      if (params.accountType && ['general', 'segregated', 'keypair', 'devicekey', 'none'].indexOf(params.accountType) >= 0) {
        payload.act = params.accountType;
      }
      if (params.exp) {
        //checks for expiration on requests, if none is provided the default is 10 min
        payload.exp = params.exp;
      } else {
        payload.exp = Math.floor(Date.now() / 1000) + 600;
      }
      return (0, _JWT.createJWT)(this.settings, _extends({}, payload, { type: 'shareReq' }));
    }

    /**
      *  Receive signed response token from mobile app. Verifies and parses the given response token.
      *
      *  @example
      *  const resToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJyZXF1Z....'
      *  credentials.receive(resToken).then(res => {
      *      const credentials = res.verified
             const name =  res.name
      *      ...
      *  })
      *
      *  @param    {String}                  token                 a response token
      *  @param    {String}                  [callbackUrl=null]    callbackUrl
      *  @return   {Promise<Object, Error>}                        a promise which resolves with a parsed response or rejects with an error.
      */

  }, {
    key: 'receive',
    value: function receive(token) {
      var _this = this;

      var callbackUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      return (0, _JWT.verifyJWT)(this.settings, token, callbackUrl).then(function (_ref) {
        var payload = _ref.payload,
            profile = _ref.profile;


        function processPayload(settings) {
          var credentials = _extends({}, profile, payload.own || {}, payload.capabilities && payload.capabilities.length === 1 ? { pushToken: payload.capabilities[0] } : {}, { address: payload.iss });
          if (payload.nad) {
            credentials.networkAddress = payload.nad;
          }
          if (payload.verified) {
            return Promise.all(payload.verified.map(function (token) {
              return (0, _JWT.verifyJWT)(settings, token);
            })).then(function (verified) {
              return _extends({}, credentials, { verified: verified.map(function (v) {
                  return _extends({}, v.payload, { jwt: v.jwt });
                }) });
            });
          } else {
            return credentials;
          }
        }

        if (_this.settings.signer) {
          if (payload.req) {
            return (0, _JWT.verifyJWT)(_this.settings, payload.req).then(function (challenge) {
              if (challenge.payload.iss === _this.settings.address && challenge.payload.type === 'shareReq') {
                return processPayload(_this.settings);
              }
            });
          } else {
            throw new Error('Challenge was not included in response');
          }
        } else {
          return processPayload(_this.settings);
        }
      });
    }

    /**
      *  Send a push notification to a user, consumes a token which allows you to send push notifications
      *  and a url/uri request you want to send to the user.
      *
      *  @param    {String}                  token              a push notification token (get a pn token by requesting push permissions in a request)
      *  @param    {Object}                  payload            push notification payload
      *  @param    {String}                  payload.url        a uport request url
      *  @param    {String}                  payload.message    a message to display to the user
      *  @param    {String}                  pubEncKey          the public encryption key of the receiver, encoded as a base64 string
      *  @return   {Promise<Object, Error>}              a promise which resolves with successful status or rejects with an error
      */

  }, {
    key: 'push',
    value: function push(token, pubEncKey, payload) {
      var PUTUTU_URL = 'https://pututu.uport.me';
      return new Promise(function (resolve, reject) {
        var endpoint = '/api/v2/sns';
        if (!token) {
          return reject(new Error('Missing push notification token'));
        }
        //if (!pubEncKey) {
        //return reject(new Error('Missing public encryption key of the receiver'))
        //}
        if (pubEncKey.url) {
          console.error('WARNING: Calling push without a public encryption key is deprecated');
          endpoint = '/api/v1/sns';
          payload = pubEncKey;
        } else {
          if (!payload.url) {
            return reject(new Error('Missing payload url for sending to users device'));
          }
          var plaintext = padMessage(JSON.stringify(payload));
          var enc = encryptMessage(plaintext, pubEncKey);
          payload = { message: JSON.stringify(enc) };
        }

        (0, _nets2.default)({
          uri: PUTUTU_URL + endpoint,
          json: payload,
          method: 'POST',
          withCredentials: false,
          headers: {
            Authorization: 'Bearer ' + token
          }
        }, function (error, res, body) {
          if (error) return reject(error);
          if (res.statusCode === 200) {
            resolve(body);
          }
          if (res.statusCode === 403) {
            return reject(new Error('Error sending push notification to user: Invalid Token'));
          }
          reject(new Error('Error sending push notification to user: ' + res.statusCode + ' ' + body.toString()));
        });
      });
    }

    /**
      *  Create a credential (a signed JSON Web Token)
      *
      *  @example
      *  credentials.attest({
      *   sub: '5A8bRWU3F7j3REx3vkJ...', // uPort address of user, likely a MNID
      *   exp: <future timestamp>,
      *   claim: { name: 'John Smith' }
      *  }).then( credential => {
      *   ...
      *  })
      *
      * @param    {Object}            [credential]           a unsigned credential object
      * @param    {String}            credential.sub         subject of credential (a uPort address)
      * @param    {String}            credential.claim       claim about subject single key value or key mapping to object with multiple values (ie { address: {street: ..., zip: ..., country: ...}})
      * @param    {String}            credential.exp         time at which this claim expires and is no longer valid (seconds since epoch)
      * @return   {Promise<Object, Error>}                   a promise which resolves with a credential (JWT) or rejects with an error
      */

  }, {
    key: 'attest',
    value: function attest(_ref2) {
      var sub = _ref2.sub,
          claim = _ref2.claim,
          exp = _ref2.exp;

      return (0, _JWT.createJWT)(this.settings, { sub: sub, claim: claim, exp: exp });
    }

    /**
      *  Look up a profile in the registry for a given uPort address. Address must be MNID encoded.
      *
      *  @example
      *  credentials.lookup('5A8bRWU3F7j3REx3vkJ...').then(profile => {
      *     const name = profile.name
      *     const pubkey = profile.pubkey
      *     ...
      *   })
      *
      * @param    {String}            address             a MNID encoded address
      * @return   {Promise<Object, Error>}                a promise which resolves with parsed profile or rejects with an error
      */

  }, {
    key: 'lookup',
    value: function lookup(address) {
      return this.settings.registry(address);
    }
  }]);

  return Credentials;
}();

var configNetworks = function configNetworks(nets) {
  Object.keys(nets).forEach(function (key) {
    var net = nets[key];
    if ((typeof net === 'undefined' ? 'undefined' : _typeof(net)) === 'object') {
      ['registry', 'rpcUrl'].forEach(function (key) {
        if (!net.hasOwnProperty(key)) throw new Error('Malformed network config object, object must have \'' + key + '\' key specified.');
      });
    } else {
      throw new Error('Network configuration object required');
    }
  });
  return nets;
};

/**
 *  Adds padding to a string
 *
 *  @param      {String}        the message to be padded
 *  @return     {String}        the padded message
 *  @private
 */
var padMessage = function padMessage(message) {
  var INTERVAL_LENGTH = 50;
  var padLength = INTERVAL_LENGTH - message.length % INTERVAL_LENGTH;

  return message + ' '.repeat(padLength);
};

/**
 *  Encrypts a message
 *
 *  @param      {String}        the message to be encrypted
 *  @param      {String}        the public encryption key of the receiver, encoded as base64
 *  @return     {String}        the encrypted message, encoded as base64
 *  @private
 */
var encryptMessage = function encryptMessage(message, receiverKey) {
  var tmpKp = _tweetnacl2.default.box.keyPair();
  var decodedKey = _tweetnaclUtil2.default.decodeBase64(receiverKey);
  var decodedMsg = _tweetnaclUtil2.default.decodeUTF8(message);
  var nonce = _tweetnacl2.default.randomBytes(24);

  var ciphertext = _tweetnacl2.default.box(decodedMsg, nonce, decodedKey, tmpKp.secretKey);
  return {
    from: _tweetnaclUtil2.default.encodeBase64(tmpKp.publicKey),
    nonce: _tweetnaclUtil2.default.encodeBase64(nonce),
    ciphertext: _tweetnaclUtil2.default.encodeBase64(ciphertext)
  };
};

exports.default = Credentials;