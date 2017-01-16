'use strict';

const ms = require('ms');
const mongoose = require('mongoose');
const mimetypes = require('mime-db');
const SchemaOptions = require('../options');
const storj = require('storj-lib');

/**
 * Represents a bucket entry that points to a file
 * @constructor
 */
var BucketEntrySchema = new mongoose.Schema({
  frame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Frame'
  },
  bucket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bucket'
  },
  mimetype: {
    type: String,
    enum: Object.keys(mimetypes),
    default: 'application/octet-stream',
    required: true
  },
  name: {
    type: String
  },
  renewal: {
    type: Date,
    default: function() {
      return Date.now() + ms('90d');
    }
  },
  created: {
    type: Date,
    default: Date.now
  }
});

BucketEntrySchema.virtual('filename').get(function() {
  return this.name || this.frame;
});

BucketEntrySchema.index({ bucket: 1 });

BucketEntrySchema.plugin(SchemaOptions, {
  read: 'secondaryPreferred'
});

BucketEntrySchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret._id;
    delete ret.name;
  }
});

/**
 * Creates a BucketEntry
 * @param {String} bucket - Bucket id
 * @param {String} frame - Frame id
 * @param {String} mimetype - Mime type of file
 * @param {String} name - File name
 * @param {Function} callback
 */
BucketEntrySchema.statics.create = function(data, callback) {
  var BucketEntry = this;

  var id = storj.utils.calculateFileId(data.bucket, data.name);

  var query = {
    _id: id,
    bucket: data.bucket
  };

  var update = {
    _id: id,
    frame: data.frame,
    bucket: data.bucket,
    name: data.name
  };

  if (data.mimetype) {
    if (Object.keys(mimetypes).indexOf(data.mimetype) === -1) {
      return callback(new Error('Invalid mimetype supplied'));
    }

    update.mimetype = data.mimetype;
  }

  var options = { upsert: true, 'new': true, setDefaultsOnInsert: true };

  BucketEntry.findOneAndUpdate(query, update, options, function(err, entry) {
    if (err) {
      return callback(err);
    }

    callback(null, entry);
  });

};

module.exports = function(connection) {
  return connection.model('BucketEntry', BucketEntrySchema);
};

module.exports.Schema = BucketEntrySchema;
