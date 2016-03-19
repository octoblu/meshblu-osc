'use strict';
var _            = require('lodash');
var util         = require('util');
var osc          = require('osc');
var EventEmitter = require('events').EventEmitter;
var debug        = require('debug')('meshblu-osc');

var MESSAGE_SCHEMA = {
  type: "object",
  properties: {
    address: {
      type: "string",
      required: true
    },
    number: {
      type: 'boolean',
      title: 'Is this a number?'
    },
    args: {
      type: "array",
      items: {
        type: "string"
      }
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
    sendToPort: {
      type: 'number',
      required: true,
      default: 3333
    },
     sendToIp: {
      type: 'string',
      required: true,
      default: '127.0.0.1'
    }
  }
};

function Plugin(){
  var self = this;
  self.options = {};
  self.messageSchema = MESSAGE_SCHEMA;
  self.optionsSchema = OPTIONS_SCHEMA;
  return self;
}
util.inherits(Plugin, EventEmitter);

Plugin.prototype.onMessage = function(message){
  var self = this;

  var payload = message.payload || {};
  if(payload.number == true){
    var args = []
    payload.args.forEach(function(val){
      args.push(parseInt(val));
    });
    payload.args = args;
  }
  debug('onMessage', payload);
  if(self.updPort){
    self.connectToUdp(self.options);
  }

  if(payload.bundle){
    self.udpPort.send(payload.bundle);
  }else{
    self.udpPort.send(payload);
  }
};

Plugin.prototype.onConfig = function(device){
  var self = this;
  debug('on config');
  self.setOptions(device.options);
  if(self.udpPort){
    debug('already connected to udp, clearing and trying again');
    self.udpPort.close()
    self.udpPort = null;
  }
  self.connectToUdp(self.options);
};

Plugin.prototype.connectToUdp = function(options){
  var self = this;
  debug('connecting to udp');
  options = {
    localAddress: options.ipAddress,
    remoteAddress: options.sendToIp,
    localPort: options.listenPort,
    remotePort: options.sendToPort
  };
  self.udpPort = new osc.UDPPort(options);
  self.udpPort.open();
  // Listen for incoming OSC bundles.
  self.udpPort.on('bundle', function (oscBundle) {
    debug('an osc bundle just arrived!', oscBundle);
    self.emit('message', {devices: ['*'], payload: oscBundle});
  });

  //Listen for regular messages
  self.udpPort.on('message', function (oscMsg) {
    debug('an osc message just arrived!', oscMsg);
    self.emit('message', {devices: ['*'], 'payload': oscMsg});
  });
};

Plugin.prototype.setOptions = function(options){
  var self = this;
  self.options = _.defaults(options, {
    ipAddress: '0.0.0.0',
    listenPort: 7400,
    sendToPort: 3333,
    sendToIp: '127.0.0.1'
  });
  debug('set options', self.options);
};

module.exports = {
  messageSchema: MESSAGE_SCHEMA,
  optionsSchema: OPTIONS_SCHEMA,
  Plugin: Plugin
};
