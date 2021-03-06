/* node UPNP port forwarding PoC 
This is a simple way to forward ports on NAT routers with UPNP.
This is a not-for-production hack that I found useful when testing apps
on my home network behind ny NAT router.
-satori / edited by smolleyes for freebox v6
usage: (install/clone node-ip from https://github.com/indutny/node-ip)
================================================================================

================================================================================
*/
var url     = require("url");
var http    = require("http");
var dgram   = require("dgram");
var Buffer = require("buffer").Buffer;
 
// some const strings - dont change
const SSDP_PORT = 1901;
const bcast = "239.255.255.250";   
const ST    = "urn:schemas-upnp-org:device:InternetGatewayDevice:1";      
const req   = "M-SEARCH * HTTP/1.1\r\nHost:239.255.255.250:1900\r\n\
ST:"+ST+"\r\nMan:\"ssdp:discover\"\r\nMX:3\r\n\r\n";
const WANIP = "urn:schemas-upnp-org:service:WANIPConnection:1";
const OK    = "HTTP/1.1 200 OK";
const SOAP_ENV_PRE = "<?xml version=\"1.0\"?>\n<s:Envelope \
xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" \
s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body>\n";
const SOAP_ENV_POST = "</s:Body>\n</s:Envelope>\n";
 
function searchGateway(timeout, callback) {
  
  var self    = this;
  var reqbuf  = new Buffer(req, "ascii");
  var socket  = new dgram.Socket('udp4');
  var clients = {};
  var t;
  
  if (timeout) {
    t = setTimeout(function() { 
      onerror(new Error("searchGateway() timed out"));
    }, timeout);
  }
  
  var onlistening = function() {
  
    socket.setBroadcast(socket.fd, true);
    // send a few packets just in case.
    socket.send(reqbuf, 0, reqbuf.length, SSDP_PORT,bcast);
 
  }
  
  var onmessage = function(message, rinfo) {
  
		console.log('message?')
    message = message.toString();
    
    if (message.substr(0, OK.length) !== OK || 
       !message.indexOf(ST) ||
       !message.indexOf("location:")) return;
       
    var l = url.parse(message.match(/location:(.+?)\r\n/i)[1].trim());
    if (clients[l.href]) return;
    
    var client = clients[l.href] = http.createClient(l.port, l.hostname);
    var request = client.request("GET", l.pathname, {"host": l.hostname});
    request.end();
    request.addListener('response', function (response) {
      if (response.statusCode !== 200) return;
      var resbuf = "";
      response.addListener('data', function (chunk) { resbuf += chunk });
      response.addListener("end", function() {
        resbuf = resbuf.substr(resbuf.indexOf(WANIP) + WANIP.length);
        var ipurl = resbuf.match(/<controlURL>(.+?)<\/controlURL>/i)[1].trim()
        socket.close();
        clearTimeout(t);
        callback(null, new Gateway(l.port, l.hostname, ipurl));
      });
    });
  }
  
  var onerror = function(err) {
    socket.close() ;
    clearTimeout(t);
    callback(err);
  }
  
  var onclose = function() {
    socket.removeListener("listening", onlistening);
    socket.removeListener("message", onmessage);
    socket.removeListener("close", onclose);
    socket.removeListener("error", onerror);
  }
  
  socket.addListener("listening", onlistening);
  socket.addListener("message", onmessage);
  socket.addListener("close", onclose);
  socket.addListener("error", onerror);
  
  socket.bind(SSDP_PORT);
  
}
exports.searchGateway = searchGateway;
 
function Gateway(port, host, path) {
  this.port = port;
  this.host = host;
  this.path = path;
}
 
Gateway.prototype.getExternalIP = function(callback) {
 
  var s = 
    "<u:GetExternalIPAddress xmlns:u=\"" + WANIP + "\">\
    </u:GetExternalIPAddress>\n";
    
  this._getSOAPResponse(s, "GetExternalIPAddress", function(err, xml) {
    if (err) callback(err);
    else callback(null, 
      xml.match(/<NewExternalIPAddress>(.+?)<\/NewExternalIPAddress>/i)[1]);
  });
  
}
 
Gateway.prototype.AddPortMapping = function(protocol
                                            , extPort
                                            , intPort
                                            , host
                                            , description
                                            , callback) {
  var s = 
  "<u:AddPortMapping \
    xmlns:u=\""+WANIP+"\">\
    <NewRemoteHost></NewRemoteHost>\
    <NewExternalPort>"+extPort+"</NewExternalPort>\
    <NewProtocol>"+protocol+"</NewProtocol>\
    <NewInternalPort>"+intPort+"</NewInternalPort>\
    <NewInternalClient>"+host+"</NewInternalClient>\
    <NewEnabled>1</NewEnabled>\
    <NewPortMappingDescription>"+description+"</NewPortMappingDescription>\
    <NewLeaseDuration>0</NewLeaseDuration>\
  </u:AddPortMapping>";
  this._getSOAPResponse(s, "AddPortMapping", callback);
}
 
Gateway.prototype._getSOAPResponse = function(soap, func, callback) {
  var s = [SOAP_ENV_PRE, soap, SOAP_ENV_POST].join("");
  var client = http.createClient(this.port, this.host);
  var hdrs = { "host"           : this.host
              , "SOAPACTION"     : "\"" + WANIP + "#" + func + "\""
              , "content-type"   : "text/xml"
              , "content-length" : s.length };
  var request = client.request("POST", this.path, hdrs);
  request.end(s);
  request.addListener('response', function (response) {
    if (response.statusCode !== 200) {
      response.close();
      callback(new Error("Invalid SOAP action"));
      return;
    }
    var buf = "";
    response.addListener('data', function (chunk) { buf += chunk });
    response.addListener('end', function () { callback(null, buf) });
  });
}
