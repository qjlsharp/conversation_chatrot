
'use strict';
// conversation variables
var conversation_id, client_id;
console.log('123');

var inputHistory = [];
var inputHistoryPointer = -1

var $chatInput = $('.chat-window--message-input'),
  $jsonPanel = $('#json-panel .base--textarea'),
  $information = $('.data--information'),
  $profile = $('.data--profile'),
  $loading = $('.loader');
//Further changes	
var $infoConfidence = $('.data--info_confidence');

$chatInput.keyup(function (event) {
  if (event.keyCode === 13) {
    converse($(this).val());
  }
});


$chatInput.keydown(function (event) {
  switch (event.which) {
    case 13: // enter
      inputHistory.push($chatInput.val());
      //inputHistory.push($leaveBtn.val());
      inputHistoryPointer = inputHistory.length;
      break;
    case 38: // up
      if (inputHistoryPointer > 0) {
        inputHistoryPointer--;
        $chatInput.val(inputHistory[inputHistoryPointer]);
      }

      break;
    case 40: // down
      if (inputHistory.length > 0 && inputHistoryPointer < inputHistory.length - 1) {
        inputHistoryPointer++;
        $chatInput.val(inputHistory[inputHistoryPointer]);
      }
      else if (inputHistoryPointer == inputHistory.length - 1) {
        $chatInput.val("");
        inputHistoryPointer++;
      }
      break;
  }
});

//语言模式设定
var speechToText = function () {
  var conMode = $('#conMode').val();
  if (conMode == '1') {
    sttCommon('ja-JP_BroadbandModel');
  } else {
    sttCommon('en-US_BroadbandModel');
    // sttCommon('zh-CN_BroadbandModel');
  }
}
//stt api 共通
var sttCommon = function (mode) {
  $.get('/speech-to-text/token')
    .done(function onSuccess(token) {
      console.log(token);
      var stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
        token: token,                       // Authorization token to use this service, configured from /speech/stt-token.js file
        continuous: false,                  // False = automatically stop transcription the first time a pause is detected
        outputElement: document.getElementById('input-text'),       // CSS selector or DOM Element
        inactivity_timeout: 3,              // Number of seconds to wait before closing input stream
        format: true,                       // Inhibits errors
        keepMicrophone: false,               // Avoids repeated permissions prompts in FireFox
        model: mode
      });
    })
    .fail(function (error) {
      talk('WATSON', error.responseJSON ? error.responseJSON.error : error.statusText);
    })
    .always(function always() {
      $loading.hide();
      scrollChatToBottom();
      $chatInput.focus();
    });
}


//选择语言模式
var getCommMode = function (mode) {
  $.get('/getCommMode?model=' + mode)
    .done(function onSuccess() {

    });
}

var getCommKbn = function (usertXt) {
  if (usertXt == '2') {
    $('#conMode').val('2');
    talk('WATSON', 'You have switched to english conversation mode'); // show
  } else {
    $('#conMode').val('1');
    talk('WATSON', '日本語チャットモードに切り替えました。'); // show
  }
  scrollChatToBottom();
}
var converse = function (userText) {
  console.log("In converse:", userText);

  $loading.show();
  // $chatInput.hide();

  // check if the user typed text or not
  if (typeof (userText) !== undefined && $.trim(userText) !== '')
    submitMessage(userText);

  // build the conversation parameters
  var params = { input: userText };

  // check if there is a conversation in place and continue that
  // by specifing the conversation_id and client_id
  if (conversation_id) {
    params.conversation_id = conversation_id;
    params.client_id = client_id;
  }

  //call NLC here first
  //If we get something not related to BYOD then return

  $.post('/mainflow', params)
    .done(function onSuccess(dialog) {
      $chatInput.val(''); // clear the text input
      var response = dialog;
      if (dialog.conversation)
        $jsonPanel.html(JSON.stringify(dialog.conversation, null, 2));

      // update conversation variables
      if (dialog.conversation) {
        conversation_id = dialog.conversation.conversation_id;
        client_id = dialog.conversation.client_id;
        var texts = dialog.conversation.response;
        response = texts.join('<br/>'); // &lt;br/&gt; is <br/>
      }
      $chatInput.show();
      $chatInput[0].focus();

      $information.empty();
      $infoConfidence.empty();

      if (dialog.conversation) {
        addProperty($information, 'Dialog ID: ', dialog.dialog_id);
        addProperty($information, 'Conversation ID: ', conversation_id);
        addProperty($information, 'Client ID: ', client_id);
        addProperty($infoConfidence, 'Confidence: ', dialog.confidence);
      }
      talk('WATSON', response); // show

      if (dialog.conversation)
        getProfile();
    })
    .fail(function (error) {
      talk('WATSON', error.responseJSON ? error.responseJSON.error : error.statusText);
    })
    .always(function always() {

      $loading.hide();
      scrollChatToBottom();
      $chatInput.focus();
    });

};

var getProfile = function () {
  var params = {
    conversation_id: conversation_id,
    client_id: client_id
  };

  $.post('/profile', params).done(function (data) {
    $profile.empty();
    data.name_values.forEach(function (par) {
      if (par.value !== '')
        addProperty($profile, par.name + ':', par.value);
    });
  }).fail(function (error) {
    talk('WATSON', error.responseJSON ? error.responseJSON.error : error.statusText);
  });
};

var scrollChatToBottom = function () {
  var element = $('.chat-box--pane');
  element.animate({
    scrollTop: element[0].scrollHeight
  }, 420);
};

var scrollToInput = function () {
  var element = $('.chat-window--message-input');
  $('body, html').animate({
    scrollTop: (element.offset().top - window.innerHeight + element[0].offsetHeight) + 20 + 'px'
  });
};

function getTagContent(text, tagName) {

  var linkRegexp = new RegExp("<" + tagName + ">(((?!<\/" + tagName + ">).)*)</" + tagName + ">", "g")
  var arr = [];
  var matchedLinks;

  while (matchedLinks = linkRegexp.exec(text)) {
    arr.push(matchedLinks[1]);
  }
  return arr;
}

function replaceMctLinksByHtmlLinks(text) {
  var text = text;
  var linksContent = getTagContent(text, "mct:link");

  linksContent.forEach(function (item) {
    var url = getTagContent(item, "mct:url")[0];
    var label = getTagContent(item, "mct:label")[0];

    var link = "<a href=\"" + url + "\" target=\"_blank\">" + label + "</a>";

    var regExp = new RegExp("<mct:link>" + item + "</mct:link>", "g");

    text = text.replace(regExp, link);

  });

  return text;
}

function replaceAutolearnItemsByButtons(text) {
  var output = text;
  var itemsContent = getTagContent(text, "mct:autolearnitems");

  itemsContent.forEach(function (itemGroup) {
    var itemsText = getTagContent(itemGroup, "mct:item");

    itemsText.forEach(function (innerText) {
      var regExp = new RegExp("<mct:item>" + innerText + "</mct:item>", "g");
      var button = "<button class=\"wds-input\">" + innerText + "</button><br/>";
      output = output.replace(regExp, button);
    });

  });
  output = output.replace(/<mct:autolearnitems>/g, "");
  output = output.replace(/<\/mct:autolearnitems>/g, "");
  return output;
}

//取得TTS的token
function getTtsToken() {
  return fetch('/api/text-to-speech/token')
    .then(function (response) {
      return response.text();
    });
}

//取得watson答案文字并转换语音
//TTS功能实现
var getWatsonMessageAndConvertToAudio = function (obj) {
  var conMode = $('#conMode').val();
  var languageKB;
  if (conMode == '1') {
    languageKB = 'ja-JP_EmiVoice'
  } else {
    languageKB = 'en-US_AllisonVoice'
  }

  getTtsToken().then(function (token) {
    WatsonSpeech.TextToSpeech.synthesize({
      text: obj,
      voice: languageKB,
      token: token
    });
  });
}

var postProcessOutput = function (text) {
  var output = text.replace(/<mct:input>/g, "<button class=\"wds-input\">");
  output = output.replace(/<\/mct:input>/g, "</button>");
  output = replaceMctLinksByHtmlLinks(output);
  output = replaceAutolearnItemsByButtons(output);
  return output;
};

var talk = function (origin, text) {
  var $chatBox = $('.chat-box--item_' + origin).first().clone();
  var $loading = $('.loader');
  var text = postProcessOutput(text);
  $chatBox.find('p').html($('<p/>').html(text).html());
  // $('.chat-box--pane').append($chatBox);
  $chatBox.insertBefore($loading);
  setTimeout(function () {
    $chatBox.removeClass('chat-box--item_HIDDEN');
  }, 100);

  $chatBox.find('button.wds-input').click(function () {
    var text = $(this).text();
    converse(text);
    inputHistory.push(text);
    inputHistoryPointer = inputHistory.length;
  });
  //Watsonの回答に、ＴＴＳで出力する
  if(origin == "WATSON"){
    // getCommMode($('#conMode').val());
    getWatsonMessageAndConvertToAudio(text);
  }
};

var addProperty = function ($parent, name, value) {
  var $property = $('.data--variable').last().clone();
  $property.find('.data--variable-title').text(name);
  $property.find('.data--variable-value').text(value);
  $property.appendTo($parent);
  setTimeout(function () {
    $property.removeClass('hidden');
  }, 100);
};

var submitMessage = function (text) {
  talk('YOU', text);
  scrollChatToBottom();
  clearInput();
};

var clearInput = function () {
  $('.chat-window--message-input').val('');
};

$('.tab-panels--tab').click(function (e) {
  e.preventDefault();
  var self = $(this);
  var inputGroup = self.closest('.tab-panels');
  var idName = null;

  inputGroup.find('.active').removeClass('active');
  self.addClass('active');
  idName = self.attr('href');
  $(idName).addClass('active');
});

$(document).ready(function () {
  // Initialize the conversation
  converse();
  scrollToInput();
});