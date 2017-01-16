'use strict';

const mongoose = require('mongoose');
const SchemaOptions = require('../options');

/**
 * Represents a pool of contacts who can mirror a shard
 * @constructor
 */
var MirrorSchema = new mongoose.Schema({
  shardHash: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    ref: 'Contact',
    required: true
  },
  contract: {
    type: Object,
    required: true
  },
  isEstablished: {
    type: Boolean,
    default: false
  }
});

MirrorSchema.index({ shardHash: 1, isEstablished: -1 });

MirrorSchema.plugin(SchemaOptions);

MirrorSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret._id;
  }
});

MirrorSchema.statics.create = function(contract, contact, callback) {
  var self = this;

  var mirror = new self({
    shardHash: contract.data_hash,
    contact: contact.nodeID,
    contract: contract
  });

  mirror.save(callback);
};

module.exports = function(connection) {
  return connection.model('Mirror', MirrorSchema);
};

module.exports.Schema = MirrorSchema;
