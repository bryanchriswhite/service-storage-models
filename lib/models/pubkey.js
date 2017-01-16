'use strict';

const assert = require('assert');
const mongoose = require('mongoose');
const SchemaOptions = require('../options');
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec(elliptic.curves.secp256k1);

/**
 * Represents a public key
 * @constructor
 */
var PublicKeySchema = new mongoose.Schema({
  _id: { // key
    type: String,
    required: true
  },
  user: {
    type: mongoose.SchemaTypes.Email,
    ref: 'User'
  },
  label: {
    type: String
  }
});

PublicKeySchema.plugin(SchemaOptions, {
  read: 'secondaryPreferred'
});

PublicKeySchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret._id;
  }
});

PublicKeySchema.virtual('key').get(function() {
  return this._id;
});

/**
 * Creates a public key
 * @param {storage.models.User} user
 * @param {String} pubkey
 * @param {Function} callback
 */
PublicKeySchema.statics.create = function(user, pubkey, label, callback) {
  let PublicKey = this, kp;

  if (typeof label === 'function') {
    callback = label;
  }

  try {
    kp = PublicKey.validate(pubkey);
  } catch (err) {
    return callback(new Error('Invalid public key supplied: ' + err.message));
  }

  let publicKey = new PublicKey({
    user: user._id,
    _id: pubkey,
    label: typeof label === 'string' ? label : ''
  });

  PublicKey.findOne({ _id: pubkey }, function(err, pubkey) {
    if (pubkey) {
      return callback(new Error('Public key is already registered'));
    }

    publicKey.save(function(err) {
      if (err) {
        return callback(err);
      }

      callback(null, publicKey);
    });
  });
};

/**
 * Validates a public key
 * @param {String} pubkey
 * @returns {Object}
 */
PublicKeySchema.statics.validate = function(pubkey) {
  assert(
    pubkey.length === pubkey.split(':').join('').length,
    'Must not contain non-hexidecimal characters like ":"'
  );

  pubkey = Buffer(pubkey, 'hex').toString('hex');
  pubkey = ecdsa.keyFromPublic(pubkey, 'hex');

  assert.ok(pubkey.pub, 'Invalid public key supplied');

  return pubkey;
};

module.exports = function(connection) {
  return connection.model('PublicKey', PublicKeySchema);
};

module.exports.Schema = PublicKeySchema;
