//
//  app.js
//
//  Created by Michael LeMay on 11/1/14.
//

/*jslint browser:true, plusplus:true */
/*global $ */

(function (window, document, $) {
    'use strict';

    // constants for our selectors
    var applicationCtrl,
        section = ['home', 'list', 'record'],
        activeSection = 'home',
        requests = 'get',
        pages = [],
        currentPage = 0,
        currentSubmenu = {
            'get':'collection'
        },
        isLoggedIn = false,
        isWritingForm = false;

    var jsonURl = 'https://infinite-plateau-8296.herokuapp.com/';

    //this var holds JSON rils and is a palcehodler for returned data
    var apiData = {
        'records': {
            'uri': 'api/stories',
            'itemtype': 'record'
        },
        'record': {
            'uri': 'api/story/'
        },
         'characters': {
            'uri': 'api/characters',
            'itemtype': 'character'
        },
        'character': {
            'uri': 'api/character/'
        },
        'tribes': {
            'uri': 'api/tribes',
            'itemtype': 'tribe'
        },
        'tribe': {
            'uri': 'api/tribe/'
        },
        'login': {
            'uri': 'user/login'
        },
        'signup': {
            'uri': 'user/signup'
        }
    }
  

    //keypress tables to determine which keys you pressed
    var _to_ascii = {
        '188': '44',
        '109': '45',
        '190': '46',
        '191': '47',
        '192': '96',
        '220': '92',
        '222': '39',
        '221': '93',
        '219': '91',
        '173': '45',
        '187': '61', //IE Key codes
        '186': '59', //IE Key codes
        '189': '45'  //IE Key codes
    }

    var shiftUps = {
        "96": "~",
        "49": "!",
        "50": "@",
        "51": "#",
        "52": "$",
        "53": "%",
        "54": "^",
        "55": "&",
        "56": "*",
        "57": "(",
        "48": ")",
        "45": "_",
        "61": "+",
        "91": "{",
        "93": "}",
        "92": "|",
        "59": ":",
        "39": "\"",
        "44": "<",
        "46": ">",
        "47": "?"
    };

    //simple command list
    var simpleCommands = [
        'home',
        'signup',
        'login',
        'prev',
        'next',
        'list'
    ];

    //display keys to render. Order determines display order
    var displayKeys = {
        'title': '',
        'name': 'Name',
        'body': '',
        'background': '',
        'origin': 'Origin',
        'strength':'Known Strengths',
        'weakness': 'Vulnerabilities',
        'likes': 'Likes',
        'dislikes': 'Dislikes',
        'goals': 'Goals',
        'inspirations': 'Inspirations',
        'girth': 'Note'
    };

    //form objects
    var formLabels = {};
    var formInputs = {};

    var emailSignupLabels = {
        'email': 'What is your email address?',
        'password': 'What do you want your password to be?'
    }

    function capitalize(s) {
        return s && s[0].toUpperCase() + s.slice(1);
    }

    function loginCheck(isLoggedIn) {
        var textString = 'login'
        if (isLoggedIn) {
            textString = 'logout'
        } 
        return textString;
    }

    function generic(fCallback) {

    }

    function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    }

    function notFound() {
        $('#display_pane').append('command not found: ' + command + '<br />');
    }

    function expandAndSuggest(commandArray){
        console.log('expandAndSuggest([' + commandArray.join() + '])');
        if (activeSection !== 'home' &&
            commandArray.length == 2) {
            var commandString = '';

            commandArray.splice(1, 0, apiData[activeSection].itemtype);
            commandString = commandArray.join(' ');
            parseCommand(commandString)
        }
    }
    
    function parseCommand(command) {
        var loginText = loginCheck(isLoggedIn);
        console.log('parseCommand(' + command + ')');
        var commandArray = command.split(' ');
        var request = commandArray[0];
        var collections = Object.keys(apiData);
        var collection = commandArray[1];
        var item = commandArray[commandArray.length - 1];
        var isInvalid = false;
        var isSimpleCommand = false;


        if (simpleCommands.indexOf(request) > -1) {
            isSimpleCommand = true;
        }

        // validates command paramaters
        if (collections.indexOf(collection) === -1) {
            collection = undefined;
        }
        if (typeof collection === 'undefined') {
            isInvalid = true;
        }

        if ($.isNumeric(item) && request === 'page') {
            isInvalid = false;
        }
        
        //ignores and updates inputFieldObj 
        if (isWritingForm) {
            parseForm(command);
        } else if (isInvalid && !isSimpleCommand) {
            expandAndSuggest(commandArray);
        } else {
            if (typeof apiData[collection] !== 'undefined'
                && typeof apiData[collection].itemtype !== 'undefined') {
                item = undefined;
            }

            switch(request) {
                case 'home':
                    cleanCommand();
                    homeCommand();
                    currentSubmenu = {
                        'get':'collection'
                    };
                    updateSubMenu();
                    break;
                case 'signup':
                    initForm('signup', emailSignupLabels);
                    break;
                case 'login':
                    loginCommand(commandArray);
                break    
                case 'get':
                    cleanCommand();
                    getData(collection, item);
                    break;
                case 'page':
                    displayPage(item);
                    break;
                case 'prev':
                case 'next':
                    displayPage(request);
                    break;
                case 'list':
                    backCommand();
                    break;
                default:
                    cleanCommand();
                    notFound();
            }
        }
    }
    
    function cleanCommand() {
        $('#display_pane').html('');
        $('#submenu_pane').html('');
        $('#title_panel').html('');
        $('#pages_panel').html('');
        $('.active').removeClass();
    }
    
    function errorCommand(error) {
        $('#display_pane').html('ERR: ' + error + '<br />');
    }
    
    function homeCommand(short) {
        $('#display_pane').html('DATABASE: Activated<br/>RECORDS: Pending<br/>ROM MASTER: 4.2MB<BR/>ROM SLAVE 1:4.12MB<br/>ROM SLAVE 2:###<br/><br/>'
            + 'Thank you for accessing the core database library. Your resource into the history and information on local tribes, survivors, and corporations.<br/><br/>'
            + 'ERR: Please note data is still fragmented and further reclamation is required. Proceed with patience. SKU64#$%&BFD9CC<br/><br/><br>'
            + 'Collections to [GET]:<br />Type "get records" for records directory'
            + '<br />Type "get characters" for characters'
            + '<br />Type "get tribes" for tribal directory');
    }

    function loginCommand(commandArray) {
        console.log(commandArray);
        if (commandArray.length > 1) {
            postData('login', commandArray);
        } else {
        $('#display_pane').html('LOGIN INFORIMATION:<br />'
            + '<br />To [SIGNUP] for a login, type "signup"'
            + '<br />To [LOGIN] with an account, type<br/> "login email@account.com:password"'
            + '<br /><br />To [SIGNUP] with Facebook, type<br/>  "signup facebook"'
            + '<br />To [LOGIN] with Facebook, type<br/>  "login facebook"');
        }
        currentSubmenu = {
            'home': '',
            'login': 'method'
        };
        updateSubMenu();
    }

    function backCommand() {
        getData(activeSection);
        delete currentSubmenu.list;
    }


    function updateHeader(msg) {
        var shortMsg = msg.slice(0, 25);
        if (msg.length > 25) {
             shortMsg += '...';
        }
        $('#header_pane').addClass('active');
        $('#title_panel').html(shortMsg);
    }

        function updateSubMenu() {
            var menuString = '';
            for (var key in currentSubmenu) {
                if (currentSubmenu.hasOwnProperty(key)) {
                    menuString += '<span>[' + key + ']</span>' + currentSubmenu[key] + ' ';
                }
            }
        $('#submenu_pane').html(menuString);
    }

    function updatePageCount() {
        if (pages.length >= 2) {
            $('#header_pane').addClass('active');
            $('#pages_panel').html('[Page ' + (currentPage + 1) + ' of ' + pages.length + ']').addClass('active');
        } else {
            $('#pages_panel').removeClass('active');
            delete currentSubmenu.next;
            delete currentSubmenu.prev;
            delete currentSubmenu.page;
        }
    }

    function initForm(category, inputLabelObj) {
        cleanCommand();
        isWritingForm = true;
        formLabels = inputLabelObj;
        activeSection = category;
        updateHeader(category);
        console.log(inputLabelObj);
        updateBody(inputLabelObj[Object.keys(inputLabelObj)[0]], 0);
    }

    function validInput(key, value) {
        var validation = true;

        if (key === 'email') {
            //thank you nerdsville for the regex!!
            var emailRegex = /^.*@[A-z0-9]*\.*/;
            validation = emailRegex.test(value);
        }

        return validation;
    }

    function parseForm(field) {
        var valid = true, 
        totalLabels = Object.keys(formLabels).length,
        totalInputedFields = Object.keys(formInputs).length,
        lastKey = Object.keys(formLabels)[totalInputedFields],
        nextkey = Object.keys(formLabels)[(totalInputedFields + 1)];

        if (validInput(lastKey, field)) {
            formInputs[lastKey] = field;
            //check to see if the inputFieldObj has the same number of keys as inputLabelObj
            if (totalLabels > (totalInputedFields + 1)) {
                //update the terminal sceen to show a label that is not answerd
                updateBody(formLabels[nextkey], 0);
            } else {
                console.log('done!');
                cleanCommand();
                postData(activeSection, formInputs);
                isWritingForm = false;
                formInputs = formLabels = {};
            }
        } else {
            currentSubmenu = {
                '##ERROR##': '###INVALID INPUT!###'
            } 
            updateSubMenu();
        }
    }

    function updateBody(bodyText, page) {
        var generatedPages = [],
            initalChunkAmount = 400,
            chunkAmount = initalChunkAmount,
            avgChunkAmount = initalChunkAmount,
            remainingText = bodyText,
            pageChunk = '',
            pregnantPageChunk = '',
            pageOrphans = [],
            $paginatorBox = $('#paginator_box'),
            $displayPane = $('#display_pane');


        for (var i = remainingText.length; i >= 1;) {
            console.log('loop i ' + i);
            if (remainingText.length <= avgChunkAmount) {
                console.log(remainingText.length + ' <=  ' + avgChunkAmount);
                pageChunk = remainingText;
                remainingText = '';
                i = 0;
            } else {
                console.log(remainingText.length + ' >  ' + avgChunkAmount);
                pregnantPageChunk = remainingText.slice(0, chunkAmount);
                remainingText = remainingText.slice(chunkAmount);
                pageOrphans = remainingText.split(' ');

                for (var j = pageOrphans.length; j > 0;) {
                    var orphan = pageOrphans[0];
                    console.log('loop j ' + j);
                    pregnantPageChunk += ' ' + orphan;  //adds spaces to a broken word;
                    pageOrphans.shift();
                    $paginatorBox.html(pregnantPageChunk);
                    if ($paginatorBox[0].offsetHeight < $paginatorBox[0].scrollHeight) {
                        console.log('paginating on ' + orphan);
                        pageOrphans.unshift(orphan);
                        remainingText = pageOrphans.join(' ');
                        console.log('remainingText: ' + remainingText);
                        i = remainingText.length;
                        pageChunk = '';
                        j = 0;
                    } else {
                        console.log('adding to chunk');
                        pageChunk = pregnantPageChunk;
                        j--;
                        console.log(j, remainingText);
                        if (j <= 0) {
                            ///some logic goes here
                        }
                    }
                }
                i = remainingText.length;
            }
                generatedPages.push(pageChunk);
            if (avgChunkAmount !== initalChunkAmount) {
                avgChunkAmount = (avgChunkAmount + pageChunk.length) / 2;
            } else {
               avgChunkAmount =  pageChunk.length;
            }
        }
        pages = generatedPages;
        $displayPane.html(pages[page]);
        updatePageCount();
    }

    function updateTerminal(data) {
        cleanCommand();
        var headerDisplay ='',
            bodyDisplay = '',
            helpDisplay = '',
            displayString = '';

        if (data.status == 404) {
           errorCommand('File not found.');
        } else {
            if (data.length >= 2) {
                //this is a list page so do special list page stuff
                console.log(data);
                var sectionCount = data.length,
                    headerDisplay = ' ' + sectionCount + ' ' + capitalize(activeSection) + ' found.',
                    slugList = [];
                    displayString = '<br><br>' + capitalize(activeSection) + ' available:  ';
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        slugList.push(data[key].slug);
                    }
                }
                //sets up alphabetized list of slugs for display
                slugList = slugList.sort();
                console.log(slugList);
                for (var i = 0; i < slugList.length; i++ ) {
                    if (typeof slugList[i] !== 'undefined') {
                        var display_slug = slugList[i].replace(/%20/g, '_');
                        displayString += display_slug + ', ';
                    }
                }
                displayString = displayString.slice(0,-2);
            } else {
                headerDisplay = ' ' + (data.title || data.name);

                //displayString = '<br><br>' + data.body;

                for (var key in displayKeys) {
                    if (displayKeys.hasOwnProperty(key)) {
                       if (typeof data[key] !== 'undefined') {
                            var divider = '';
                            if (displayKeys[key].length > 1) {
                                divider = ': ';
                            }
                            displayString += '<br><br>' + displayKeys[key] + divider + data[key];
                       }
                    }
                }
            }
            updateHeader(headerDisplay);
            updateBody(displayString, 0);
        }
    }

    function displayPage(page) {
        var pageData = pages[page],
            newPage = page,
            $displayPane = $('#display_pane');

        if (newPage === 'next') {
            newPage = currentPage + 1;
        } else if (newPage === 'prev') {
            if (currentPage !== 0) {
                newPage = currentPage - 1;
            }
        } else {
            newPage = page - 1;
        }

        if (typeof pages[newPage] == 'undefined') {
            newPage = 0;
        }

        pageData = pages[newPage];
        currentPage = newPage;
        $displayPane.html(pages[currentPage]);
         updatePageCount();
    }
    
    function bindKeys() {
        var $inputBox = $('#input_box .input'),
            $displayBox = $('#display_box'),
            $displayPane = $('#display_pane'),
            command;
        
        // Prevent the backspace key from navigating back.
        $(document).unbind('keydown').bind('keydown', function (event) {
            var doPrevent = false;
            if (event.keyCode === 8) {
                var d = event.srcElement || event.target;
                if ((d.tagName.toUpperCase() === 'INPUT' && 
                     (
                         d.type.toUpperCase() === 'TEXT' ||
                         d.type.toUpperCase() === 'PASSWORD' || 
                         d.type.toUpperCase() === 'FILE' || 
                         d.type.toUpperCase() === 'SEARCH' || 
                         d.type.toUpperCase() === 'EMAIL' || 
                         d.type.toUpperCase() === 'NUMBER' || 
                         d.type.toUpperCase() === 'DATE' )
                     ) || 
                     d.tagName.toUpperCase() === 'TEXTAREA') {
                    doPrevent = d.readOnly || d.disabled;
                }
                else {
                    doPrevent = true;
                }
            }

            if (doPrevent) {
                event.preventDefault();
            }
        });



        //binds any key press to the document
        $(document).keydown(function (event) {
            var updatedString = '';

            if (event.keyCode === 13) {
                command = $inputBox.html();
                $inputBox.empty();
                parseCommand(command);
            } else if (event.keyCode === 8) {
                updatedString = $inputBox.text().slice(0,-1);
                $inputBox.empty().append(updatedString);
            } else {
                var c = event.which;
                if (_to_ascii.hasOwnProperty(c)) {
                    c = _to_ascii[c];
                }
                if (!event.shiftKey && (c >= 65 && c <= 90)) {
                    c = String.fromCharCode(c + 32);
                } else if (event.shiftKey && shiftUps.hasOwnProperty(c)) {
                    c = shiftUps[c];
                } else {
                    c = String.fromCharCode(c);
                }
                $inputBox.append(c);
            }
        });
    }
    
    function resizeElements() {
        //get window vars and manipulate the screen
        var $body = $('body'),
            $inputBox = $('#input_box'),
            $displayBox = $('#display_box'),
            $displayPane = $('#display_pane'),
            $submenuPane = $('#submenu_pane'),
            $headerPane = $('#header_pane'),
            $paginatorBox = $('#paginator_box'),
            mesurements = {},
            maxLines = 32;
        mesurements.windowWidth = $(window).width();
        mesurements.windowHeight = $(window).height();
        mesurements.lineHeight = mesurements.windowHeight / maxLines;
        if (mesurements.windowWidth >= mesurements.windowHeight) {
            mesurements.terminalWidth = mesurements.windowHeight;
            mesurements.terminalLeftMargin =  (mesurements.windowWidth - mesurements.terminalWidth) / 2;
        } else {
            mesurements.terminalWidth = mesurements.windowWidth;
            mesurements.terminalLeftMargin = 0;
        }
        
        //sets styles for sizing
        $body.css({
            'font-size': (mesurements.lineHeight - (mesurements.lineHeight * .25)) + 'px',
            'line-height': mesurements.lineHeight + 'px'
        });
        $inputBox.css({
            'height': (mesurements.lineHeight * 2) + 'px',
            'line-height': (mesurements.lineHeight * 2) + 'px',
            'width': mesurements.terminalWidth + 'px',
            'margin-left': mesurements.terminalLeftMargin + 'px'
        });
        $submenuPane.css({
            'height': ((mesurements.lineHeight * 2) - 4) + 'px',
            'line-height': (mesurements.lineHeight * 2) + 'px',
            'margin-top': mesurements.lineHeight + 'px',
            'width': (mesurements.terminalWidth - 4) + 'px',
        });
         $headerPane.css({
            'height': ((mesurements.lineHeight * 2) - 4) + 'px',
            'line-height': (mesurements.lineHeight * 2) + 'px',
            'width': mesurements.terminalWidth + 'px',
        });
        $displayPane.css({
            'height': (mesurements.lineHeight * (maxLines - 8)) + 'px',
            'margin-top': mesurements.lineHeight + 'px',
            'width': mesurements.terminalWidth + 'px',
        });

        $paginatorBox.css({
            'height': (mesurements.lineHeight * (maxLines - 8)) + 'px',
            'width': mesurements.terminalWidth + 'px',
        });
        $displayBox.css({
            'height': (mesurements.lineHeight * (maxLines - 2)) + 'px',
            'width': mesurements.terminalWidth + 'px',
            'margin-left': mesurements.terminalLeftMargin + 'px'
        });
    }

    // Create a public interface and set it on the window object
    applicationCtrl = {
        generic: generic
    };

    if (typeof window.applicationCtrl === 'undefined') {
        window.applicationCtrl = applicationCtrl;
    } else {
        if (window.console !== undefined) {
            window.console.error('applicationCtrl is already defined on window');
        }
    }


    //contructs a full uri to hit for jspon data and retrived the data
    function getData(collection, item) {
        console.log('getData(' + collection + ', ' + item + ')');
        var uri = apiData[collection].uri,
        urlQuery = '';


        if (typeof uri === 'undefined') {
            errorCommand(message);
            return;
        }
        if (typeof item !== 'undefined') {
            var uriItem = encodeURIComponent(item).replace(/%10/g, '');
            uri += uriItem;
        }

        urlQuery = jsonURl + uri + '?callback=?'; // callback is for jsonp
        
        $.getJSON(urlQuery).done(function(data) {
            apiData[collection].data = data;
            if (typeof apiData[collection] !== 'undefined'
                && typeof apiData[collection].itemtype !== 'undefined') {
                activeSection = collection;
                currentPage = 0;
                currentSubmenu = {
                    'home': '',
                    'get': 'name'
                };
            } else {
                currentSubmenu = {
                    'home': '',
                    'next': '',
                    'prev': '',
                    'page':'num',
                    'list': ''
                };
            }
            console.log('SUCCESS');
            console.log(apiData);
            var loginText = loginCheck(isLoggedIn);
            updateTerminal(apiData[collection].data);
            updateSubMenu();
        }).fail(function(message) {
            console.log('ERROR');
            console.log('error', message);
            updateTerminal(message);
        }).always(function() {
            console.log('COMPLETE');
        });
    }

    //post Data
    function postData(collection, params) {
        console.log('postData(' + collection +' , params)');
        console.log('params', params);
        var parsedParams = params,
        uri = apiData[collection].uri,
        parsedUri = jsonURl + uri;

        $.ajax({
            type: 'POST',
            url: parsedUri,
            crossDomain: true,
            data: parsedParams,
            dataType: 'json',
            success: function(responseData, textStatus, jqXHR) {
                console.log(responseData);
            },
            error: function (responseData, textStatus, errorThrown) {
                console.log('POST failed. VVVVV');
                console.log(responseData);
                console.log(textStatus);
                console.log(errorThrown);
            }
        });
/*
        $.post(parsedUri, parsedParams)
          .done(function(data) {
            console.log('SUCCESS');
            console.log(data);
          });

*/
    }

    
    // All the things that need to happen after the document loads
    function onDocumentReady() {
        resizeElements();
        bindKeys();
        homeCommand();
        updateSubMenu();
    }
    
    // Stuff that happens on window resize
    $(window).resize(function () {
        resizeElements();
    });

    // This is where it all starts!
    $(onDocumentReady);

}(window, window.document, $));
