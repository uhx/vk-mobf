// ==UserScript==
// @name         VK Interceptor
// @namespace    https://github.com/uhx
// @version      2.0
// @description  idk
// @author       uhx
// @grant        GM_xmlhttpRequest
// @include      *vk.com*
// @include      *instagram.com*
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/uhx/vk-mobf/master/interceptor.user.js
// @updateURL    https://raw.githubusercontent.com/uhx/vk-mobf/master/interceptor.user.js
// ==/UserScript==

function Main() {
  // some helper functions
  function getParameterByName(url, name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
  
  function setParameterByName(url, name, value) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';

    name += "=";

    return url.replace(name + results[2], name + encodeURIComponent(value));
  }
  // hooks
  function addXMLSendRequestCallback(callback){
    var oldSend, i;
    if( XMLHttpRequest.send_callbacks ) {
      // we've already overridden send() so just add the callback
      XMLHttpRequest.send_callbacks.push( callback );
    } else {
      // create a callback queue
      XMLHttpRequest.send_callbacks = [callback];
      // store the native send()
      oldSend = XMLHttpRequest.prototype.send;
      // override the native send()
      XMLHttpRequest.prototype.send = function(){
        // process the callback queue
        // the xhr instance is passed into each callback but seems pretty useless
        // you can't tell what its destination is or call abort() without an error
        // so only really good for logging that a request has happened
        // I could be wrong, I hope so...
        // EDIT: I suppose you could override the onreadystatechange handler though
        for( i = 0; i < XMLHttpRequest.send_callbacks.length; i++ ) {
          var result = undefined;
          
          // return true if you want to block sending
          // return some str to change send body
          // return undefined otherwise
          if( arguments.length )
          {
            result = XMLHttpRequest.send_callbacks[i](this, arguments[0]);
          }
          else
          {
            XMLHttpRequest.send_callbacks[i](this, arguments[0]);
          }
          
          if( result === true )
          {
            return;
          }
          else if( !(result === undefined) )
          {
            // console.log( arguments[0] + " changed to " + result );
            arguments[0] = result;
          }
        }
        // call the native send()
        oldSend.apply(this, arguments);
      }
    }
  }
  
  function addXMLOpenRequestCallback(callback){
    var oldOpen, i;
    if( XMLHttpRequest.open_callbacks ) {
      XMLHttpRequest.open_callbacks.push( callback );
    } else {

      XMLHttpRequest.open_callbacks = [callback];

      oldOpen = XMLHttpRequest.prototype.open;

      XMLHttpRequest.prototype.open = function(){
        for( i = 0; i < XMLHttpRequest.open_callbacks.length; i++ ) {
          XMLHttpRequest.open_callbacks[i](this, arguments);
        }

        oldOpen.apply(this, arguments);
      }
    }
  }

  addXMLOpenRequestCallback( function(xhr, args) {
    xhr.method = args[0];
    xhr.url = args[1];
  });
  
  /* chars to replace
     cyrillic on the left side
     latin on the right        */
  let replacement = {
    "а" : "a",
    "А" : "A",
    "о" : "o",
    "О" : "O",
    "е" : "e",
    "Е" : "E",
    "с" : "c",
    "С" : "C",
    "р" : "p",
    "Р" : "P",
    "у" : "y",
    "У" : "y",
    "х" : "x",
    "Х" : "X",
  }
  /* zero-width char that will be
     inserted between message characters */
  var invisible_char = "\u2064"
  
  String.prototype.replaceAll = function( search, replaceto ){
    var target = this;
    return target.split(search).join(replaceto);
  };
  
  function obfuscateText( text )
  {
    var obfuscated_text = "";
    var source_text = text;

    for( let x in replacement )
    {
      source_text = source_text.replaceAll( x, replacement[x] );
    }

    for( let x = 0; x < source_text.length; x++ )
    {
      obfuscated_text += invisible_char + source_text[x];
    }

    return obfuscated_text;
  }
  // messages obfuscation
  addXMLSendRequestCallback( function(xhr, body) {
    if( xhr.url === "/al_im.php" && xhr.method === "POST" ) {
      if( body.startsWith("act=a_send") ) {
        
        var msg = getParameterByName(body, "msg");
        
        if(!msg) return;
        
        var obfuscated_msg = msg;
        
        var regexp = /(?:\w+?:\/\/[^\s/$.?#]*.[^\s]*)|(?:@id\d+? \(.*?\))/
        // exclude URLS
        var parts = msg.split( regexp );

        parts.forEach(function(part){
          obfuscated_msg = obfuscated_msg.replace( part, obfuscateText(part) );
        });
        
        //console.log( "Obfuscated '" + msg + "' to '" + obfuscated_msg + "'" );
        
        return setParameterByName(body, "msg", obfuscated_msg);
      }
    }
  });
  // block read marks
  addXMLSendRequestCallback( function(xhr, body) {
    if( xhr.url === "/al_im.php" && xhr.method === "POST" ) {
      if( body.startsWith("act=a_mark_read") ) {
        return true;
      }
    }
  });
  // block 'typing' status in dialogs
  addXMLSendRequestCallback( function(xhr, body) {
    if( xhr.url === "/al_im.php" && xhr.method === "POST" ) {
      if( body.startsWith("act=a_activity") && body.endsWith("type=typing") ) {
        return true;
      }
    }
  });
  
  addXMLSendRequestCallback( function(xhr, body) {
    if( xhr.url === "/im624" && xhr.method === "POST" ) {
      if( body.startsWith("act=a_release") ) {
        return true;
      }
    }
  });
  
  // this url looks suspicious so I blocked it xD
  addXMLSendRequestCallback( function(xhr, body) {
    if( xhr.url.startsWith("/ads_rotate.php") && xhr.method === "POST" ) {
      return true;
    }
  });
  
  // instagram story (reel) seen-mark
  addXMLSendRequestCallback( function(xhr, body) {
    if( xhr.url === "/stories/reel/seen" && xhr.method === "POST" ) {
      return true;
    }
  });

  console.log("Interceptor loaded!");
}


if( window.top === window.self )
{
	window.setTimeout("(" + Main.toString() + ")()", 0);
}
