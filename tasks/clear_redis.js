/*
 * Copyright (c) 2016 Urbanhire.com
 * Licensed under the MIT license.
 */

'use strict';

var redis = require('redis');

module.exports = function(grunt)
{
	grunt.registerMultiTask('clear_redis', 'Grunt plugin to delete keys in Redis automatically.', function(){
		var done = this.async();

		if (isNaN(this.data.database))
		{
			this.data.database = 0;
		}

		if (this.data.keys.constructor !== Array)
		{
			this.data.keys = [];
		}

		if (this.data.keys.length === 0)
		{
			grunt.log.writeln('No keys provided for clear-redis.');

			return done();
		}

		this.port = this.data.options.port || '6379';
		this.host = this.data.options.host || 'localhost';
		this.auth_pass = this.data.options.auth_pass;

		var db_prefix = this.data.database === 0 ? '' : 'DB[' + this.data.database + '] ';
		var total_keys = this.data.keys.length;

		var client = redis.createClient(this.port, this.host, { auth_pass: this.data.options.auth_pass });

		var delete_keys = function(key_pattern)
		{
			client.keys(key_pattern, function(err, keys){
				for (var n = 0; n < keys.length; n++)
				{
					grunt.verbose.writeln('Deleting: ' + keys[n]);
					client.del(keys[n]);
				}

				grunt.log.ok(db_prefix + 'Deleted ' + keys.length + ' keys on pattern: ' + key_pattern);

				if ((--total_keys) === 0)
				{
					client.quit();
					done();
				}
			});
		};

		grunt.verbose.writeln('Selecting database: ' + this.data.database);

		client.select(this.data.database, function() {
			grunt.log.writeln('Deleting keys...');

			for (var i = 0; i < this.data.keys.length; i++)
			{
				delete_keys(this.data.keys[i]);
			}
		}.bind(this));

		client.on('error', function(err) {
			grunt.warn('Redis client, error: ' + err);
			throw err;
		});
	});
};
