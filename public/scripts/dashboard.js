$( document ).ready(function() {
    var val = localStorage.getItem("avatar");
    var values  = JSON.parse(localStorage.getItem('cred'));
    $("#avatar").html(val.avatar);
    $("#yourname").html(values.name);
    $("#country").html(values.country);
    $("#address").html(values.address);
    $("#phone").html(values.phone);
    $("#email").html(values.email);
})
