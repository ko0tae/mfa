#!/usr/bin/env node

const spawnSync = require('child_process').spawnSync;
const fs = require('fs');
const ini = require('./node_modules/ini');
const inquirer = require('inquirer');
const os = require("os");

const CRED_FILE_PATH = os.homedir() + '/.aws/credentials';

var config = ini.parse(fs.readFileSync(CRED_FILE_PATH, 'utf-8'));

function main() {

	var pfs = list_mfa_profile();

	var questions = [{
		type: 'list',
		name: 'profile',
		pageSize: 16,
		message: "profile",
		loop: false,
		choices: pfs,
		filter: function(val) {
			return val;
		}
	},
	{
		type: 'input',
		name: 'number'
	}
	];

	inquirer.prompt(questions).then((answers) => {
		var profile = answers.profile;
		var number = answers.number;

		login(profile, number);

		var profile_new = list_mfa_profile();
		for (var i = 0; i < profile_new.length; i++) {
			console.log(profile_new[i].name);
		}
	});

}

function login(profile, number) {

	var obj = sts(profile, number);

	if (!obj) {
		return 1;
	}

	//  console.log("\n\n### sts");
	//  console.log(obj);

	var id = obj.Credentials.AccessKeyId;
	var key = obj.Credentials.SecretAccessKey;
	var token = obj.Credentials.SessionToken;
	var exp = obj.Credentials.Expiration;

	//	console.log("\n\n### before");
	//	console.log(ini.stringify(config));

	add(profile.replace('mfa@', ''), id, key, token, exp);

	//	console.log("\n\n### after");
	//	console.log(ini.stringify(config));

	fs.writeFileSync(CRED_FILE_PATH, ini.stringify(config));
}

function list_mfa_profile() {
	var profiles = [];
	for (var key of Object.keys(config)) {
		if (key.startsWith('mfa@')) {
			var expire_info = "";
			var profile_old = config[key.replace('mfa@', '')];
			if (profile_old && profile_old['mfa@expiration']) {
				var now = new Date();
				var expire = new Date(profile_old['mfa@expiration']);
				var diff = parseInt((expire - now) / 1000);
				if (diff > 0) {
					var h = parseInt((diff / 3600));
					var m = parseInt((diff % 3600) / 60);
					var s = parseInt(diff % 60);
					expire_info = "\t: " + h + " hour " + m + " min " + s + " sec remains";
				} else {
					expire_info = "\t: expired!";
				}
			} else {
				expire_info = "\t: unknown";
			}
			profiles.push({ name: key + expire_info, value: key });
		}
	}

	return profiles;
}


function add(profile, id, key, token, exp) {
	if (!config[profile]) {
		config[profile] = {};
	}
	config[profile]["aws_access_key_id"] = id;
	config[profile]["aws_secret_access_key"] = key;
	config[profile]["aws_session_token"] = token;
	config[profile]["mfa@expiration"] = exp;
}

function sts(profile, mfa) {
	var mfa_arn = config[profile]['mfa@arn'];
	var cmdrun = spawnSync('aws',
		['sts', 'get-session-token',
			'--serial-number', mfa_arn,
			'--token-code', mfa,
			'--profile', profile
		]);
	if (cmdrun.status == 0) {
		return JSON.parse(cmdrun.stdout.toString('utf-8'));
	} else {
		console.log(cmdrun.stdout.toString('utf-8'));
		console.log(cmdrun.stderr.toString('utf-8'));
		return null;
	}

}

main();
