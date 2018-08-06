// ==UserScript==
// @name         VK Obfuscator
// @namespace    https://github.com/uhx/vk-mobf
// @version      1.2a
// @description  obfuscate private messages
// @author       uhx
// @match        https://vk.com/*
// @downloadURL  https://raw.githubusercontent.com/uhx/vk-mobf/master/obfuscator.user.js
// @updateURL    https://raw.githubusercontent.com/uhx/vk-mobf/master/obfuscator.user.js
// ==/UserScript==

(function() {
    /* chars to replace
       cp1251 on the left side
       ansi on the right (english) */
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
       added between message characters */
    var invisible_char = "\u2064"

    String.prototype.replaceAll = function( search, replaceto ){
        var target = this;
        return target.split(search).join(replaceto);
    };

    function ObfuscateText( text )
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

    function setKeydownHook()
    {
        let im_chat_input = document.querySelector(".im-chat-input--txt-wrap");

        if( !im_chat_input )
            return;
        // change default placeholder
        document.querySelector(".ph_content").innerText += " and it will be obfuscated!";
        // message input box
        let im_editable = im_chat_input.getElementsByClassName( "im_editable" )[0]

        im_chat_input.addEventListener( "keydown", function(event){
            // skip Shift+ or Alt+ events
            if( event.key == "Enter"
               && !event.shiftKey && !event.ctrlKey )
            {            
                var new_text = im_editable.innerText;
                var regexp = /\w+?:\/\/[^\s/$.?#]*.[^\s]*/
                // exclude URLS
                var parts = new_text.split( regexp );

                parts.forEach(function(part){
                    new_text = new_text.replace( part, ObfuscateText(part) );
                });

                im_editable.innerText = new_text;
            }
        }, true );
    }

    /* track all changes */
    const pmPageObserver = new MutationObserver(function(mutations){
        mutations.forEach(function(mutation)
        {
            if( mutation.target
                && mutation.target.classList.contains("im-chat-input--txt-wrap") )
            {
                if( mutation.nextSibling
                    && mutation.nextSibling.classList )
                {
                    setKeydownHook();
                }
            }
        });
    });
    
    if( window.top != window.self )
        return;

    var wrap3 = document.getElementById("wrap3");

    let options = {
        'childList': true,
        'subtree': true
    };
    /* setup observer */
    pmPageObserver.observe( wrap3, options );

    console.log( "vk-mobf loaded!" );
})();
