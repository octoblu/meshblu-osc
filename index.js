'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var osc = require('osc');


var MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    address: {
      type: 'string',
      required: true
    },
    args: {
      type: 'array',
      required: true
    }
  }
};

var OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    ipAddress: {
      type: 'string',
      required: true,
      default: '0.0.0.0'
    },
    listenPort: {
      type: 'number',
      required: true,
      default: 7400
    },
    sendPort: {
      type: 'number',
      required: true,
      default: 3333
    }
  }
};

function Plugin(){
  this.options = {};
  this.messageSchema = MESSAGE_SCHEMA;
  this.optionsSchema = OPTIONS_SCHEMA;
  return this;
}
util.inherits(Plugin, EventEmitter);




 var udpPort;



Plugin.prototype.onMessage = function(message){
  var payload = message.payload;
  if(payload.bundle){
  udpPort.send(payload.bundle);
}else{

  udpPort.send(payload);  

}
  
  };

Plugin.prototype.onConfig = function(device){
  var self = this;
  this.setOptions(device.options||{});


  udpPort = new osc.UDPPort({
    localAddress: (this.options.ipAddress || "0.0.0.0"),
    localPort: (this.options.listenPort || 7400),
    remotePort: (this.options.sendPort || 3333),
    remoteAddress: "127.0.0.1"
});

 udpPort.open();

// Listen for incoming OSC bundles.
udpPort.on("bundle", function (oscBundle) {
    console.log("An OSC bundle just arrived!", oscBundle);

      self.emit("message", {devices: ['*'], "payload": oscBundle
             });

});

//Listen for regular messages
udpPort.on("message", function (oscMsg) {

      self.emit("message", {devices: ['*'], "payload": oscMsg
             });

});

// Open the socket.


    

};

Plugin.prototype.setOptions = function(options){
  this.options = options;
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
