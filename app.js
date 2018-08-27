
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var querystring = require('querystring');
var watson = require('watson-developer-cloud');
const AuthorizationV1 = require('watson-developer-cloud/authorization/v1');
var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const vcapServices = require('vcap_services');
var fs = require('fs');
var path = require("path");
var conversation;
var conMode = '1';
conversation = watson.conversation({
	//JP
	username: "79cd0712-482b-4fb3-8ea3-0710eada5e99",
	password: "g3Ntt7PHu4Ze",
	path: { workspace_id: '0734c777-95ed-4200-ae42-869614ec34a1' },
	version: 'v1',
	version_date: '2017-04-21'
});

var authorization1 = new watson.AuthorizationV1({
	//EN
	username: "27d0e5e4-5399-42be-b706-c0172c1afe6a",
	password: "85ve32lfOOak"
});

var textToSpeech = new TextToSpeechV1({
	username: '022baded-9eeb-4fcf-af7d-514e997f2746',
	password: 'Ob0s40UsOJ5y'
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var toshow = '';

function processResponse(err, response) {
	if (err) {
		console.error('EROR:' + err); // something went wrong
		return;
	}

	// If an intent was detected, log it out to the console.
	if (response.intents.length > 0) {
		console.log('Detected intent: #' + response.intents[0].intent);
	}

	// Display the output from dialog, if any.
	if (response.output.text.length != 0) {
		//	      console.log(response.output.text[0]);
		toshow = response.output.text;
		console.log("************" + toshow);
	}
}

//言語切替
app.get('/getCommMode', function (req, res, next) {
	conMode = req.query.model;
	if (conMode == 2) {
		conversation = watson.conversation({
			//EN
			username: '339a3675-d104-4a05-85eb-d904c5ea435b', // replace with username from service key
			password: 'LWURiQPWFQQA',
			path: { workspace_id: '84948310-3f00-4e3b-a0b3-78260ff6168c' },
			version: 'v1',
			version_date: '2017-04-21'
		});
	} else {
		conversation = watson.conversation({
			//JP
			username: "79cd0712-482b-4fb3-8ea3-0710eada5e99",
			password: "g3Ntt7PHu4Ze",
			path: { workspace_id: '0734c777-95ed-4200-ae42-869614ec34a1' },
			version: 'v1',
			version_date: '2017-04-21'
		});
		return res.send('this is my commMode');
	}
})

var context = null;
app.post('/mainflow', function (req, res, next) {
	console.log('$$$$$$$$$$$$$$$$$$ In mainflow:');

	if (null == context) {
		context = req.body.context;
	}
	var url = req.headers.referer;
	var param = url.split("?");
	console.log("url:" + url + " type:" + typeof (url) + " length:" + param.length);

	var username = '';
	if (param.length == 2) {
		var params = querystring.parse(param[1]);
		if (null != params.username) {
			username = params.username + ',';
		}
		console.log("params:" + JSON.stringify(params, null, 4));
	}
	var client_input = req.body.input;
	//jp模式
	if (conMode == '1') {
		conversation.message({
			// EN 
			// workspace_id: '84948310-3f00-4e3b-a0b3-78260ff6168c',
			//JP
			workspace_id: '0734c777-95ed-4200-ae42-869614ec34a1',
			input: { text: client_input },
			context: context
		}, function (err, response) {
			if (err) {
				console.error(err);
			} else {
				//		    	 console.log("DDDDDDD:"+context.conversation_id);
				console.log(JSON.stringify(response, null, 2));
				context = response.context;//多轮对话需要将res的context赋给请求context
				if (null == req.body.input) {
					// EN
					// res.json('Hello, I am Watson, How can I help you? (Get more about us in <a href=\'#\' onclick=\'window.open("http://www.ibm.com/watson"); return;\'> IBM Watson</a>)');
					// JP
					res.json('こんにちは、私はWatsonですが、お手伝いできますか。? (チャット言語 <a href=\'#2\' onclick=getCommKbn(\'1\');getCommMode(\'1\')> Japanese</a> Or <a href=\'#2\' onclick=getCommKbn(\'2\');getCommMode(\'2\')> English</a>)');
				}
				else {
					res.json(response.output.text[0]);
				}
			}
		});
		//EN模式
	} else {
		conversation.message({
			// EN 
			workspace_id: '84948310-3f00-4e3b-a0b3-78260ff6168c',
			//JP
			// workspace_id: '0734c777-95ed-4200-ae42-869614ec34a1',
			input: { text: client_input },
			context: context
		}, function (err, response) {
			if (err) {
				console.error(err);
			} else {
				//		    	 console.log("DDDDDDD:"+context.conversation_id);
				console.log(JSON.stringify(response, null, 2));
				context = response.context;//多轮对话需要将res的context赋给请求context
				if (null == req.body.input) {
					// EN
					// res.json('Hello, I am Watson, How can I help you? (Get more about us in <a href=\'#\' onclick=\'window.open("http://www.ibm.com/watson"); return;\'> IBM Watson</a>)');
					// JP
					res.json('こんにちは、私はWatsonですが、お手伝いできますか。? (チャット言語 <a href=\'#2\' onclick=getCommKbn(\'1\');getCommMode(\'1\')> Japanese</a> Or <a href=\'#2\' onclick=getCommKbn(\'2\');getCommMode(\'2\')> English</a>)');
				}
				else {
					res.json(response.output.text[0]);
				}
			}
		});
	}
});

app.get('/speech-to-text/token', function (req, res, next) {
	console.log('-----------speech to text to get token--------------------');
	authorization1.getToken({
		url: watson.SpeechToTextV1.URL
	}, function (err, token) {
		if (!token) {
			console.log('error:', err);
		} else {
			return res.send(token);
		}
	});
})

// deleteFolderRecursive = function (url) {
// 	var files = [];
// 	//判断给定的路径是否存在
// 	if (fs.existsSync(url)) {
// 		//返回文件和子目录的数组
// 		files = fs.readdirSync(url);
// 		files.forEach(function (file, index) {
// 			// var curPath = url + "/" + file;
// 			var curPath = path.join(url, file);
// 			//fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
// 			if (fs.statSync(curPath).isDirectory()) { // recursee
// 				deleteFolderRecursive(curPath);
// 				// 是文件delete file
// 			} else {
// 				fs.unlinkSync(curPath);
// 			}
// 		});
// 		//清除文件夹
// 		//   fs.rmdirSync(url);
// 	} else {
// 		console.log("给定的路径不存在，请给出正确的路径");
// 	}
// };

// var synthesizeParams;
// //tts功能实现
// app.get('/text-to-speech', function (req, res, next) {
// 	deleteFolderRecursive('.\\voice');

// 	var ttsText = req.query.ttsText;
// 	var conMode = req.query.model;
// 	console.log('-----------' + conMode + '--------------------');
// 	if (conMode == '1') {
// 		synthesizeParams = {
// 			text: ttsText,
// 			accept: 'audio/wav',
// 			voice: 'ja-JP_EmiVoice'
// 		};
// 		console.log('-----------日文模式--------------------');
// 	} else {
// 		synthesizeParams = {
// 			text: ttsText,
// 			accept: 'audio/wav',
// 			voice: 'en-US_AllisonVoice'
// 		};
// 		console.log('-----------英文模式--------------------');
// 	}

// 	console.log('-----------text-to-speech--------------------');
// 	// Pipe the synthesized text to a file.
// 	textToSpeech.synthesize(synthesizeParams).on('error', function (error) {
// 		console.log(error);
// 	}).pipe(fs.createWriteStream('.\\voice\\voice.wav'));
// })

//TTS功能的api用户名和密码
var ttsAuthService = new AuthorizationV1(
	Object.assign(
	  {
		username: '022baded-9eeb-4fcf-af7d-514e997f2746', // or hard-code credentials here
		password: 'Ob0s40UsOJ5y'
	  },
	  vcapServices.getCredentials('text_to_speech') // pulls credentials from environment in bluemix, otherwise returns {}
	)
  );
//取得TTS的token
  app.use('/api/text-to-speech/token', function(req, res) {
	ttsAuthService.getToken(
	  {
		url: TextToSpeechV1.URL
	  },
	  function(err, token) {
		if (err) {
		  console.log('Error retrieving token: ', err);
		  res.status(500).send('Error retrieving token');
		  return;
		}
		res.send(token);
	  }
	);
  });

http.createServer(app).listen(app.get('port'), function () {
	console.log('Express server listening on port ' + app.get('port'));
});
