'use strict';

const mongoose = require('mongoose');
const SchemaOptions = require('../options');

/**
 * Represents a unique user & nonce
 * @constructor
 */
var UserNonceSchema = new mongoose.Schema({
  user: {
    type: mongoose.SchemaTypes.Email,
    ref: 'User',
    required: true
  },
  nonce: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: '5m'
  }
});

UserNonceSchema.plugin(SchemaOptions);

UserNonceSchema.index({ user: 1, nonce: 1 }, { unique: true });

UserNonceSchema.set('toObject', {
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret._id;
  }
});

module.exports = function(connection) {
  return connection.model('UserNonce', UserNonceSchema);
};

module.exports.Schema = UserNonceSchema;
