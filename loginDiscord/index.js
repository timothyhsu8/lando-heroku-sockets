import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import webstack from '../Webstack.js';
import '../tweeGaze.js';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let config_path = 'config.json'

if (fs.existsSync(__dirname + "/" + config_path)) {
	var { clientId, clientSecret, twinePath, port, redirectURL, herokuURL } = require('./' + config_path);
}

const CLIENT_ID = process.env.clientId || clientId
const CLIENT_SECRET = process.env.clientSecret || clientSecret
const TWINE_PATH = process.env.twinePath || twinePath
const REDIRECTURL = process.env.redirectURL || redirectURL
const PORT = process.env.PORT || port
const HEROKU_URL = process.env.herokuURL || herokuURL

const { app } = new webstack(PORT).get();

function returnTwine(userData, response) {
	let userDataScript =  `
	<script> let userData=${userData} </script>
	`
	let file = TWINE_PATH
	let fileContents = fs.readFileSync(file)
	return response.send(`${fileContents} ${userDataScript}`);
}

app.get('/', async ({ query }, response) => {
	const { code, state, test } = query;
	const htmlTemplate = './views/index.html'
	let userDataScript;
	
	if (test) {
		userDataScript = JSON.stringify({"id":"229035280496197642","username":"Tempith","avatar":null,"discriminator":"2739","public_flags":0,"flags":0,"banner":null,"banner_color":null,
		"accent_color":null,"locale":"en-US","mfa_enabled":false});
		return returnTwine(userDataScript, response);
	}

	if (code) {
		try {
			const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: CLIENT_ID,
					client_secret: CLIENT_SECRET,
					code,
					grant_type: 'authorization_code',
					redirect_uri: HEROKU_URL,
					scope: 'identify',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			const oauthData = await oauthResult.json();
			const userResult = await fetch('https://discord.com/api/users/@me', {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			});
			const userResultJson = await userResult.json();
			let userData = JSON.stringify(userResultJson);
			
			if (userResultJson.message) {
				return response.send(JSON.stringify(userResultJson));
				// file = path.join(__dirname, 'index.html')
			}

			// userDataScript = `
			// <script> let userData=${userData} </script>
			// `

			return returnTwine(userData, response);
			
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
		}
	}

	let htmlContents = fs.readFileSync(htmlTemplate, 'utf8')
	let foo = htmlContents.replace("redirectURL", REDIRECTURL)

	return response.send(foo);
});



