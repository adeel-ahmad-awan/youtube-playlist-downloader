require('dotenv').config()
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');
const {	google } = require('googleapis');
const youtube = google.youtube('v3');

console.log(process.env.downloadDir);

let playlistID = process.env.playlistURL.substring('https://www.youtube.com/playlist?list='.length)

youtube.playlistItems.list({
	key: process.env.apiKey,
	part: 'id,snippet',
	playlistId: playlistID,
	maxResults: 200,
}, async (err, results) => {
	if (err) return console.log(err.message)
	let data = results.data.items;


	// note: you have to install this dependency manually since it's not required by cli-progress
	const colors = require('ansi-colors');
	
	// create new progress bar
	const b1 = new cliProgress.SingleBar({
		format: 'CLI Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true
	});
	
	

	b1.start(data.length, 0, {
		speed: "N/A"
	});

	for (let video of data) {
		try {
			await new Promise((resolve, reject) => {
				console.clear();
				console.log(`Downloading: ${video.snippet.title}`)
				let file = ytdl(`https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`, {
					format: 'mp4'
				}).pipe(fs.createWriteStream(path.join(__dirname, process.env.downloadDir, `${video.snippet.title}.mp4`)));
				file.on('error', err => {
					console.log('\x1b[32m', `x Error Downloading: ${video.snippet.title}`)
					console.log("\x1b[0m", '\n')
					reject()
				})
				file.on('close', () => {
					console.log("\x1b[32m", `! Downloaded: ${video.snippet.title}`);
					console.log("\x1b[0m", '\n')
					resolve()
				})
				b1.increment();			
			})
		} catch (err) {
			console.log('\x1b[42m', `x Error Downloading: ${video.snippet.title}`)
			console.log("\x1b[0m", '\n')
		}
	}
	console.log('\x1b[42m', `Downloading completed, Please check : ${process.env.downloadDir}`)
	b1.stop();
});