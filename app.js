
var express = require('express');
var uport = require('./lib/index.js');
var jsontokens = require('jsontokens');
var path = require('path');

var app = express();
console.log(__dirname);
var signer = uport.SimpleSigner('4c443544cdeeb2d50402b8b573c9225f0d334f79e288ccd065ca4e4e148f0789')
app.use('/public', express.static(path.join(__dirname + '/public')));
app.set('view engine','hbs');
const port = process.env.PORT || 8082;
var credentials = new uport.Credentials({
  appName: 'Kauri-Id',
  address: '2ogA1tvwEU4e1VDKQ3TX9CEfxX5jb5Rhzsg',
  signer: signer
  // networks: {'0x4': {'registry' : '0x2cc31912b2b0f3075a87b3640923d45a26cef3ee', 'rpcUrl' : 'https://rinkeby.infura.io'}}
  // Note: we use Rinkeby by default, the above is the explicit format for selecting a network
})

app.get('/dashboard', function (req, res) {
    var uri;
    var qrurl;
    var mobileUrl;

    credentials.attest({
        sub: '2ogA1tvwEU4e1VDKQ3TX9CEfxX5jb5Rhzsg',
        exp: 1552046024,
        claim: {'ASB Claim' : {'Type':'Streamline-Account', 'Name' : 'Vishnu Devarajan', 'PassportNumber' : "G9191919", 'mobile': "+642108373286", 'email' :'vish@asb.com'} }
        // Note, the above is a complex claim. Also supported are simple claims:
        // claim: {'Key' : 'Value'}
    }).then(function (att) {
        console.log(att);
        console.log(jsontokens.decodeToken(att));
        uri = 'me.uport:add?attestations=' + att;
        qrurl = 'http://chart.apis.google.com/chart?cht=qr&chs=400x400&chl=' + uri;
        mobileUrl = 'https://id.uport.me/add?attestations=' + att;
        // uri = 'me.uport:me?requestToken=' + att + '%26callback_type=post';
        // qrurl = 'http://chart.apis.google.com/chart?cht=qr&chs=400x400&chl=' + uri;
        // mobileUrl = 'https://id.uport.me/me?requestToken=' + att + '&callback_type=post';
        console.log(uri);
        res.render('dashboard', {
            QR: '<div><img src=' + qrurl + '></img></div><div><a href=' + mobileUrl + '>Scan here and you are good!</a></div>'
        })
  })

    // credentials.createRequest({
    //     verified: ['Custom Attestation'],
    //     callbackUrl: 'http://192.168.1.34:8081/callback',
    //     exp: new Date().getTime() + 60000
    // }).then(function(requestToken) {
    //     // send requestToken to browser
    //     console.log('GOT REQ TOKEN');
    //     console.log(requestToken)
    // })

})

app.get('/', function (req, res) {
    res.render('home.hbs');

})

var server = app.listen(port, function () {
  console.log("KauriID app running in 8082...")
})
