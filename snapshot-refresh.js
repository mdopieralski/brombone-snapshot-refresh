'use strict';

import Jsonfile from 'jsonfile';
import Prompt from 'prompt';
import rp from 'request-promise';
import colors from 'colors';

const paths = {
	userConfig: './src/config/user-config.json',
	appConfig: './src/config/app-config.json'
};

const UserConfig = Jsonfile.readFileSync(paths.userConfig, {
	throws: false
});
const AppConfig = Jsonfile.readFileSync(paths.appConfig);
const UserConfigRequiredFields = ['site_name', 'site_domain', 'api_key', 'callback_url'];

const MODE = _getMode();

function _userConfigValidator(config) {

	return !!config && UserConfigRequiredFields.every(field => !!config[field]);
}

function _getMode() {

	if (process.argv.indexOf('--update-config') > -1) {

		console.log('--update-config');

		return 'CONFIG_CREATE';
	} else if (process.argv.indexOf('--delete-config') > -1 || process.argv.indexOf('--reset-config') > -1) {

		console.log('--delete-reset-config');
		return 'CONFIG_RESET';
	} else {

		let isUserConfigValid = _userConfigValidator(UserConfig);


		if (isUserConfigValid) {

			console.log(`Cool ! Found some valid config.`.green);

			return 'SNAPSHOT_REFRESH';
		} else {

			console.log(`Ups ! Didn't found valid config. Let's create one.`.yellow);

			return 'CONFIG_CREATE';
		}
	}
}

function _runSnapshotRefresh() {

	console.log(`Please enter slug of your page, which you'd like to refresh in brobmone.`);

	Prompt
		.start()
		.get(['slug'], function(err, result) {

			_callBrombone({
				site_name: UserConfig.site_name,
				url: UserConfig.site_domain + '/' + result.slug,
				api_key: UserConfig.api_key,
				callback_url: UserConfig.callback_url
			});
		});
}

function _runConfigCreator() {

	Prompt
		.start()
		.get(UserConfigRequiredFields, function(err, result) {

			Jsonfile.writeFile(paths.userConfig, result, function(err) {

				console.error(err);
			});
		});
}

function _resetConfig() {

	Jsonfile.writeFile(paths.userConfig, {});
}

function _callBrombone(body) {

	console.log('Trying to call brombone...');

	let logingDotsInterval = setInterval(function() {

		console.log('...');
	}, 1000);

	let options = {
		method: 'POST',
		uri: AppConfig.bromboneApiUrl,
		headers: {
			'cache-control': 'no-cache',
			'content-type': 'application/json'
		},
		body: body,
		json: true
	};

	rp(options)
		.then(function(res) {

			console.log(res.green.bold);

			clearInterval(logingDotsInterval);
		})
		.catch(function(err) {

			console.log(err.red.bold);
			clearInterval(logingDotsInterval);
		});
}

switch (MODE) {

	case 'CONFIG_CREATE':

		_runConfigCreator();
		break;


	case 'CONFIG_RESSET':

		_resetConfig();
		break;

	case 'SNAPSHOT_REFRESH':

		_runSnapshotRefresh();
		break;
}