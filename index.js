'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var osc = require('osc');

var inport = 3333;
var outport = 7400;






var MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    address: {
      type: 'string',
      required: true
    },
    args: {
      type: 'string',
      required: true
    }
  }
};

var OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    firstExampleOption: {
      type: 'string',
      required: true
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




 var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 7400
});

udpPort.open();

Plugin.prototype.onMessage = function(message){
  var payload = message.payload;
  if(payload.port){ inport = payload.port;}
  if(payload.bundle){
  udpPort.send(payload.bundle, "127.0.0.1", inport);
}else{

  udpPort.send(payload, "127.0.0.1", inport);  
}
  
  };

Plugin.prototype.onConfig = function(device){
  var self = this;
  this.setOptions(device.options||{});

 

// Listen for incoming OSC bundles.
udpPort.on("bundle", function (oscBundle) {
    console.log("An OSC bundle just arrived!", oscBundle);

      self.emit("message", {devices: ['*'], "payload": oscBundle
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
