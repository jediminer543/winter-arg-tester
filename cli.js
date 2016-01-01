var tester = require('./main');
var fs = require('fs');

if (process.argv.length < 4 || process.argv[2] === 'help') {
	console.log('== help');
	console.log('Prints this message.');
	console.log('== password <password>');
	console.log('Check <password> against all app ids listed in app-list.txt');
} else if (process.argv[2] === 'password') {
	var appIDs = fs.readFileSync('app-list.txt').toString().split('\n');
	var currentAppID = 0;

	var password = process.argv.slice(3, process.argv.length).join(' ');

	var queries = 0;
	var elapsed = 0;
	var rateLimited = false;

	console.log();
	setInterval(function() {
		if (currentAppID === appIDs.length) {
			console.log('Done!');
			return;
		}

		elapsed++;
		process.stdout.write('\x1b[1000D\x1b[K\x1b[A');
		console.log((currentAppID + '/' + appIDs.length + '        ').substr(0,10) + ' ' + (queries + 'q/s       ').substr(0,8) + ' ' + elapsed + 's');
		queries = 0;
	}, 1000);

	process.on('SIGINT', function() {
		process.stdout.write('\n\r');
		process.exit();
	});

	function nextAppID() {
		if (currentAppID === appIDs.length) return;

		if (rateLimited) {
			return setTimeout(function() {
				nextAppID();
			}, 15000);
		}

		var appID = appIDs[currentAppID++];

		tester.tryPassword(password, appID, function(err, result) {
			queries++;
			if (err) {
				rateLimited = true;
				currentAppID--;
			} else {
				if (!result) {
				} else if (result.url) {
					console.log('[found url] app=' + appID + ', password=' + password + ', url=' + result.url);
				} else if (result.response) {
					console.log('[found response] app=' + appID + ', password=' + password + ', response=' + result.response);
				} else {
					console.log('[found weird] app=' + appID + ', password=' + password + ', result=' + JSON.stringify(result));
				}
				nextAppID();
			}
		});
	}

	for (var w = 0; w < 50; w++) nextAppID();
}
