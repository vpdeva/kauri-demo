$("#login").click(function(){

const SimpleSigner = window.uportconnect.SimpleSigner;
const Connect = window.uportconnect.Connect;
const appName = 'Kauri-demo';

const uport = new Connect("Kauri-ID", {
    clientId: "2ogA1tvwEU4e1VDKQ3TX9CEfxX5jb5Rhzsg",
    signer: SimpleSigner("4c443544cdeeb2d50402b8b573c9225f0d334f79e288ccd065ca4e4e148f0789"),
    network: 'rinkeby'
});
const web3 = uport.getWeb3();

  // uPort connect
  uport.requestCredentials({
    requested: ['name','country','phone', 'avatar','email'],
    notifications: true // We want this if we want to recieve credentials
  })
  .then((credentials) => {
        localStorage.setItem("avatar", credentials.avatar.uri);
        localStorage.setItem("cred", JSON.stringify(credentials));
        // console.log(credentials);
        window.location = '/dashboard';
    });
});

    // // // Attest specific credentials
    // connect.attestCredentials({
    //   sub: '2ozjC5Gn6DtBGkfoyHdNRVRYMVAvd77NXK8',
    //   claim: {
    //     name: 'Vishnu'
    //   },
    //   exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    // })

