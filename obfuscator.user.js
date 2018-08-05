// ==UserScript==
// @name         VK Obfuscator
// @namespace    https://github.com/uhx/vk-mobf
// @version      1.0
// @description  autoselection planets/zones etc
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

    String.prototype.replaceAll = function(search, replaceto) {
        var target = this;
        return target.split(search).join(replaceto);
    };

    function setKeydownHook()
    {
        let im_chat_input = document.querySelector(".im-chat-input--txt-wrap");

        if( !im_chat_input )
        { return; }
        // change default placeholder
        document.querySelector(".ph_content").innerText += " and it will be obfuscated!";
        // message input box
        let im_editable = im_chat_input.getElementsByClassName( "im_editable" )[0]

        im_chat_input.addEventListener( "keydown", function(event){
            // skip Shift+ or Alt+ events
            if( event.key == "Enter"
               && !event.shiftKey && !event.ctrlKey )
            {
                var source_text = im_editable.innerText;
                // do not obfuscate links
                // todo: detect links in message body
                //       not only at the beginning
                if( source_text.startsWith( "http" ) )
                    return;

                //console.log( event );
                for( let x in replacement )
                {
                    source_text = source_text.replaceAll( x, replacement[x] );
                }

                var obfuscated_text = "";

                for (let x = 0; x < source_text.length; x++)
                {
                    obfuscated_text += invisible_char + source_text[x];
                }

                im_editable.innerText = obfuscated_text;
            }
        }, true );

        console.log( "im_chat_input hooked!" );
    }

    // track all changes
    const pmPageObserver = new MutationObserver(function(mutations){
        mutations.forEach(function(mutation)
                          {
            if( mutation.target.classList.contains("im-chat-input--txt-wrap") )
            {
                if( mutation.nextSibling.classList )
                {
                    setKeydownHook();
                }
            }
        });
    });
    //-- Don't run on frames or iframes
    if (window.top != window.self)
    { return; }

    var wrap3 = document.getElementById("wrap3");

    let options = {
        'childList': true,
        'subtree': true
    };
    // setup observer
    pmPageObserver.observe( wrap3, options );

    console.log( "obfs loaded!" );

    //setKeydownHook();
})();
