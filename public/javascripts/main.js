var noteMe = noteMe || {}; // namespace aplikacie

$(function() {

    // aplikacia :)

    (function() {  // .apply(noteMe)
        var _self = this,
            gtClass = "global-message ",
            globalTooltip = $("body").tooltip({
                content: "správa",
                items:"body",
                disabled: true,
                tooltipClass: "global-message",
                show:{effect:"slideDown",duration:500,easing:"swing"},
                hide:{effect:"slideUp",duration:500,easing:"swing"},
                position:{my:"center top+2", at:"center top", collision:"none"},
                close: function(){

                },
                open: function(){
                    var self = $(this);
                    setTimeout(function(){self.tooltip("close");}, 7000);
                }   
            }),
            gtFunction = function(type) {
                return function(message) {
                    globalTooltip.tooltip("close");
                    globalTooltip.tooltip({tooltipClass: gtClass+type});
                    globalTooltip.tooltip({content: message, items: "body"}).tooltip("open");
                };
            },
            lastRename = {
                element: null,
                value: null
            };
        
        this.manage = {
            /**
             * Funkcia umoznuje premenovanie nazvov objektov (poznamka, blok, znacka)
             * @param {type} cb callback funkcia po premenovani - ako argument ziska objekt obshujuci boolean saved, ktory
             * je true, ak novy nazov bol potvrdeny a false, ak bolo premenovavanie pouzivatelom zrusene
             * @returns vylsedok premenovania {saved: true/false} 
             */
            rename : function(cb) {
                var oldText = $(this).text(),
                    result = {
                        saved : false
                    };
                $(this).off(".rename").off("keydown");
                $(this).on("focus.rename", function() {
                    if($.browser.opera){
                        // opera zrusi selekciu kvoli zmene stylu elementu, treba ju preto zopakovat
                        var self = $(this);
                        setTimeout(function(){self.selectText();},10);
                    } else {
                        // inak vyber text hned
                        $(this).selectText();
                    }
                }).on("blur.rename", function() {
                    if(!result.saved){
                        $(this).text(oldText);
                    } 
                    lastRename.element = $(this);
                    lastRename.value = oldText;
                    $(this).removeAttr("contenteditable");
                    if(typeof cb === "function"){
                        cb.call($(this),result);
                    }
                    return result;
                }).enterKey(function() {
                    result.saved = true;
                    $(this).blur();
                },"on").escKey(function() {
                    $(this).blur();
                },"on");

                $(this).attr("contenteditable",true).focus();
            },
            /**
             * Zmeni text posledneho premenovania spat na text pre premenovanim (akcia sa tyka len UI)
             */
            revertLastRename: function(){
                lastRename.element.text(lastRename.value);
            }
        };
        this.opened  = {
            note: {
                id: null,
                edited: false,
                setEdited : function(e,c){
                    this.edited = e;
                },
                close: function() {
                    this.id = null;
                    $(".right-column.note").remove();
                    window.location.hash = "";
                }
            }
        };
        /**
         * Hooks objekty - polia pre ukladanie funkcí, tore sa maju vykonat po urcitej udalosti
         */
        this.addNoteHooks = [];
        this.addTagHooks = [];
        this.showNoteHooks = [];
        this.showNoteEditorHooks = [];
        this.executeHooks = function(hooks){
            for (var i in hooks){
                hooks[i]();
            }
        };
        /**
         * Zobrazi bud detail poznamky (sekcia spravy) alebo editor (sekcia editacie)
         * vykonava showNoteEditorHooks (pre zobrazenie editora) a showNoteHooks (pre zobrazenie detailu)
         * @param {type} noteId id poznamky
         */
        this.showNote = function(noteId){
            if($("body").hasClass("section-edit")){
                noteMe.jsRoutes.editNote.ajax({
                    urlParams : {
                        id: noteId
                    },
                    beforeSend : function() {
                        noteMe.edit.removeAllInstances();
                    },
                    success : function(data){
                        $("#right-column-wrapper .note").remove();
                        $("#right-column-wrapper").prepend(data);
                        noteMe.opened.note.id = $("#right-column-wrapper .note").data("id");
                        noteMe.opened.note.setEdited(false,1);
                        noteMe.edit.init();
                        noteMe.executeHooks(noteMe.showNoteEditorHooks);
                    },
                    error : function(err) {
                    }
                });
            } else if($("body").hasClass("section-manage")){
                noteMe.jsRoutes.viewNote.ajax({
                    urlParams : {
                        id: noteId
                    },
                    success : function(data){
                        $("#right-column-wrapper .note").remove();
                        $("#right-column-wrapper").prepend(data);
                        $(".right-column button, .right-column a").iconButton();
                        noteMe.opened.note.id = $("#right-column-wrapper .note").data("id");
                        noteMe.executeHooks(noteMe.showNoteHooks);
                    },
                    error : function(err) {

                    }
                });
            } else {
                return;
            }   
        };
        /**
         * vytvara podporne funkcie pre editor poznamok
         */
        this.edit = (function(){
            var noteMeEdit = this;
            if(typeof nicEditor === "undefined"){
                return null;
            }
            var editorPanel = $("#editor-panel"),
                editorSpace = $("#editor-space"),
                newBlockGrid = [10,10],
                draggableSettings = {
                    cancel: ".note-block",
                    handle: "> .handle",
                    grid: [10,10]
                },
                resizebleSettings = {
                    handles: "e,w",
                    maxWidth:1500,
                    grid: [10,10],
                    resize : function(event, ui) {
                        ui.element.css({height:"",maxWidth:1500});
                    }
                },
                editorInstances = [],
                editor = null,
                saveNote = function(c){
                    var content = $(editorSpace).clone();
                    noteMe.opened.note.setEdited(false,2);
                    content.find(".note-block-wrapper").attr("class","note-block-wrapper").find(".handle").hide();
                    content.find(".ui-resizable-handle").remove();
                    content.find(".note-block").removeAttr("contenteditable");
                    noteMe.jsRoutes.saveNote.ajax({
                        urlParams: {
                            id: $(".right-column.note").data("id")
                        },
                        data : {
                            content: content.html()
                        },
                        success : function(data) {
                            noteMe.message.info("Poznámka uložená");
                            noteMe.opened.note.setEdited(false,3);
                        },
                        error : function(err) {
                            noteMe.message.error("Chyba pri ukladaní poznámky");
                        }
                    });
                },
                createEditor = function(){
                    return new nicEditor({
                        onSave : saveNote
                    });
                },
                blockCount = null;
                
            editor = createEditor();  
            
            return {
                saveNote: saveNote,
                removeAllInstances : function(){
                    for(var i in editorInstances){
                        editor.removeInstance(editorInstances[i].attr("id"));
                        blockCount = null;
                    }
                },
                createBlock : function(x,y) {
                    blockCount++;
                    var block = $("<div>").addClass("note-block").attr("id","note-block-"+blockCount),
                        handle = $("<div>").addClass("handle"),  
                        wrapper = $("<div>").addClass("note-block-wrapper").append(handle).append(block).addClass("ui-corner-all"),
                        offset = [x-(x%newBlockGrid[0]), y-(y%newBlockGrid[1])];
                    editorSpace.append(wrapper);
                    wrapper.position({
                        my: "left-5 center",
                        at: "left top",
                        offset: offset[0] + " " + offset[1],
                        of: document,
                        collision:"none"
                    }).css({maxWidth: $("#editor-space").width()/2}).draggable(draggableSettings).resizable(resizebleSettings);
                    editor.addInstance(block.attr("id"));
                    editorInstances.push(block);
                    block.add(wrapper).on("click resize drag",function(){
                        // zaregistruj editaciu poznamky
                        noteMe.opened.note.setEdited(true,4);
                    });
                    return block;
                },
                init : function() {
                    //editor = createEditor();
                    editorPanel = $("#editor-panel");
                    editorSpace = $("#editor-space");
                    editor.setPanel(editorPanel.attr("id"));

                    editor.addEvent("focus", function() {
                        $(this.selectedInstance.elm).parent().addClass("selected-editor");
                    });
                    editor.addEvent("blur", function() {
                        if(this.selectedInstance) {
                            var jqe = $(this.selectedInstance.elm);
                            jqe.parent().removeClass("selected-editor");
                            if(!jqe.text() && !jqe.find("img").length){
                                editor.removeInstance(jqe.attr("id"));
                                jqe.parent().remove();
                            }
                        }
                    });
                
                    // zisti najvacsie id bloku
                    var pm;
                    var idPattern = /[0-9]+/;
                    editorSpace.find(".note-block").each(function(){
                        pm = parseInt(idPattern.exec($(this).attr("id"))[0],10);
                        blockCount = pm>blockCount?pm:blockCount;
                    });
                
                    editorSpace.find(".note-block-wrapper").draggable(draggableSettings).resizable(resizebleSettings);
                    editorSpace.find(".handle").show();
                    editorSpace.find(".note-block-wrapper").on("click resize drag",function(event){
                        // zaregistruj editaciu poznamky
                        noteMe.opened.note.setEdited(true,5);
                    });
                    editorSpace.find(".note-block").each(function(){
                        editor.addInstance($(this).attr("id"));
                        editorInstances.push($(this));
                    });
                    
                    editorSpace.on("click",function(e){
                        if(e.target!==this){
                            e.stopPropagation();
                            return;
                        }
                        noteMe.edit.createBlock(e.pageX,e.pageY).focus();
                    }); 
                },
                uploadImage: function(image, noteId,callback){
                    var formData = new FormData();
                    formData.append("image",image);
                    formData.append("id", noteId || noteMe.opened.note.id);
                    var progressHandler = function(){
                        
                    };
                    
                    noteMe.jsRoutes.imageUpload.ajax({
                        xhr: function(){
                            var myXhr =$.ajaxSettings.xhr();
                            if(myXhr.upload) {
                                myXhr.upload.addEventListener("progress",progressHandler);
                            }
                            return myXhr;
                        },
                        data: formData,
                        processData: false,
                        cache: false,
                        contentType: false,
                        success: function(data) {
                            if(typeof callback === "function"){
                                callback(data);
                            }
                        },
                        error: function(){
                            noteMe.message.error("Nepodarilo sa nahrať obrázok na server.");
                            if(typeof callback === "function"){
                                callback(null);
                            }
                        }
                    });
                }
            };
        }());
        /**
         * funkcie pre zobrazenie globalnych sprav v rozhrani
         */
        this.message = {
            info: gtFunction(""),
            error: gtFunction("ui-state-error"),
            close: function(){
                globalTooltip.tooltip("close");
            }
        };
        this.search = (function() {
            if($("body").hasClass("section-public")){
                return null;
            }
            /**
             * konstrukcia panela s informaciami o aktualnom hladani 
             */
            var searchInfoElement = $("<div>").appendTo("header").css({
                    width: 200,
                    maxWidth:300,
                    padding:5,
                    border: "1px solid #2e2e2e",
                    boxShadow: "0px 0px 4px #757575",
                    cursor: "pointer",
                    zIndex:10
                 }).addClass("ui-state-highlight ui-widget ui-corner-bl ui-corner-br ui-button-text-icon-secondary").position({
                     my: "left top",
                     at: "left bottom+1",
                     of: "#header-bar #search input[type=\"search\"]"
                 }).append($("<span class='title ui-button-text'>"))
                   .append($("<span class='ui-icon ui-icon-close ui-button-icon-secondary'>")).attr("title","Zrušiť vyhľadávanie").hide();
            searchInfoElement.click(function(){
                noteMe.search.cancel();
            });
            return {
                /**
                 * Vyhladavanie
                 * @param {array} noteArray pole s id-ckami poznamok, ktore sa maju vyfiltrovat s akt. zobrazenia
                 * @param {boolean} tag true, ak sa hlada podla znacky
                 */
                search: function (noteIdArray,tag) {
                    var notesContainer = $(".notebooks").first(),
                        i;

                    this.cancel();

                    notesContainer.find(".note").hide();

                    for (i in noteIdArray) {
                        notesContainer.find(".note[data-id='"+noteIdArray[i]+"']").show();
                    }

                    notesContainer.find(".notebook").each(function(){
                        if(!$(this).find(".note:visible").length){
                            $(this).hide();
                        }
                    });

                    var text;
                    if(tag) {
                        text = "Hľadaná značka: "+ tag;
                    } else {
                        text = "Hľadané: " + $("#header-bar #search input[type=\"search\"]").val();
                    }
                    searchInfoElement.slideDown("fast").find(".title").text(text);
                },
                /**
                 * Zrusi filter vyhladavanie
                 */
                cancel : function(){
                    $(".notebooks .notebook").show();
                    $(".notebook .note").show();
                    if(searchInfoElement.is(":visible")){
                        searchInfoElement.slideUp("fast").find(".title").text("");
                    }
                }
            };
        }());
        /**
         * animacia pocas ajax requestov
         */
        this.loadAnim = (function(){
            var animUrl = "/public/images/load-anim.gif",
                staticUrl = "/public/images/logo-under-circles.png",
                elem = $("#logo-circles");
                buffer = $("<div class=\"hidden\">").css({
                    position: "absolute",
                    zIndex: -200,
                    top:0,
                    left:0
                }).appendTo("body");
            buffer.append($("<img>").attr("src",animUrl));
            buffer.append($("<img>").attr("src",staticUrl));
            
            return {
                /**
                 * Start animacie
                 * @param {event} e event
                 */
                start : function(e){
                    elem.attr("src",animUrl);
                },
                /**
                 * Ukoncenie animacie
                 */
                stop : function(){
                    elem.attr("src",staticUrl);
                }
            };

        }());
    }.apply(noteMe));

    // tlacidla pred volanim jsRoutes, lebo ten je synchronny
    $("button").iconButton();
    $("header nav a").button();
    $("header #user-account a").iconButton();
    $("input[type='submit']").button();
    $("form#search input[type='submit']").each(function(){
        $("<button>").text($(this).val()).insertAfter($(this)).button({
            icons : {
                primary: "ui-icon-search"
            },
            text: false
        });
        $(this).remove();
    });
    $("#new-notebook").button({
        icons : {
            primary: "ui-icon-circle-plus"
        }
    });

    // nacitaj routy
    $.ajax({
        url: "/jsRoutes",
        type: "GET",
        dataType: "script",
        cache: true,
        async: false
    });

    // bind pre ajax animaciu a globalna sprava pre nedostupny server
    $(document)
            .bind("ajaxSend", noteMe.loadAnim.start)
            .bind("ajaxComplete", noteMe.loadAnim.stop)
            .bind("ajaxComplete", function(event,xhr) {
                if(xhr.status === 0) {
                    noteMe.message.error("Server nedostupný");
                }
            });
    
    
    // navigacia v aplikacii pomocou  url hash zmeny ===========================
    var hashChange = function (event,noanim) {
        var action = window.location.hash.slice(1),
            returnValue;
        if (action && navActions[action]){
            if (noanim) {
                return $.noanim(navActions[action]);
            } else {
                return navActions[action]();
            }
        } else if(action && navActions["_data"]) {
            navActions["_data"](action);
        } else if(action === "" && navActions["_default"]) {
            if (noanim) {
                return $.noanim(navActions["_default"]);
            } else {
                return navActions["_default"]();
            }
        }
    };

    var navActions = {
        _default : function() {
            return false;
        },
        _data : function(data) {
            noteMe.showNote(parseInt(data,10));
        }
    
    };

    $(window).bind("hashchange",hashChange);

    hashChange(null,true);
    // koniec hash navigacie ===================================================
    
    // klavesove skratky
    $(document).bind("keydown", "alt+b", function(event){
        event.preventDefault();
        $("#new-notebook").click();
        closeHotkeyTooltips();
    }).bind("keydown", "alt+z", function(event){
        event.preventDefault();
        $(".new-tag").first().click();
        closeHotkeyTooltips();
    }).bind("keydown", "alt+p", function(event){
        event.preventDefault();
        $(".notebooks .notebook:first-child .new-note").click();
        closeHotkeyTooltips();
    }).bind("keydown", "alt+h", function(event){
        event.preventDefault();
        $("#search input[type=\"search\"]").focus();
        closeHotkeyTooltips();
    }).bind("keydown","ctrl+s", function(event){
        event.preventDefault();
        if($("#saveButton").length){
            noteMe.edit.saveNote();
        }
    }).bind("keydown", "alt", function(event){
        event.preventDefault();
        $("#new-notebook").tooltip("open");
        $("#search input[type=\"search\"]").tooltip("open");
        $(".new-tag").tooltip("open");
    }).bind("keyup", "alt", function(event){
        event.preventDefault();
        closeHotkeyTooltips();
    }); 

    var hotkeyTooltipSettings = {
        disabled: true,
        tooltipClass: "hotkey-tooltip",
        position: {
            my: "left center",
            at: "right-5 center+5"
        }
        
    };

    var closeHotkeyTooltips = function(){
        $("#new-notebook").tooltip("close");
        $("#search input[type=\"search\"]").tooltip("close");
        $(".new-tag").tooltip("close");
        $(".notebooks .notebook:first-child .new-note").tooltip("close");
    };

    $("#new-notebook").tooltip($.extend({items: "#new-notebook",content:"Alt+b"},hotkeyTooltipSettings));
    $("#search input[type=\"search\"]").tooltip($.extend({items: "#search input[type=\"search\"]",content:"Alt+h"},hotkeyTooltipSettings));
    $(".new-tag").tooltip($.extend({items: ".new-tag",content:"Alt+z"},hotkeyTooltipSettings));
    
    // vyber textu vo vyhladavacom poli pri focuse
    $("form#search input").live("focus",function(){
        $(this).select();
    });

    // vyhladavanie
    $("form#search").submit(function(event){
        var searchTerm = $(this).find("input[type='search']").val(),
            self = this;
        if (!searchTerm) {
            event.preventDefault();
            noteMe.search.cancel();
            return false;
        }
        noteMe.jsRoutes.search.ajax({
            urlParams: {
                exp: searchTerm
            },
            success: function(data){
                noteMe.search.search(data);
                $(self).find("input[type='search']").select();
            },
            error: function(err) {

            }
        });
        return false;
    }).find("input[type='search']").bind("keydown","esc",function(event){
        event.preventDefault();
        noteMe.search.cancel();
        $(this).val("");
    });

    // scrollbary
    $("#left-column-scroll").scrollbar();
    $(".sidebar-wrapper").scrollbar();
    $("#notetags").scrollbar();
    //$("#note-scroll").scrollbar().addClass("jspAlwaysShow");


    // vyska poznamky
    var noteResize = function() {
        $("#about, .right-column > h2").on("resize",function(){
            var noteScroll = $("#note"),
                about = $("#about"),
                header = $(".right-column > h2"),
                aboutHeight = about.outerHeight(true),
                headerHeight = header.outerHeight(true);
            noteScroll.css({
                    "margin-top": headerHeight,
                    "margin-bottom": aboutHeight
            });
        });
        $("#about").trigger("resize");
    };
    noteMe.showNoteHooks.push(noteResize);
    
    var editorSpaceResize = function() {
        $(".nicEdit-panel, .right-column > h2").on("resize", function(){
            var editor = $("#editor-space"),
                panel = $("#editor-panel"),
                header = $(".right-column > h2"),
                panelHeight = panel.outerHeight(true),
                headerHeight = header.outerHeight(true);
            editor.css({
                "margin-top" : panelHeight + headerHeight
            });
        });
        $(".nicEdit-panel").trigger("resize");
    };
    noteMe.showNoteEditorHooks.push(editorSpaceResize);


    // vertikalna zmena velkosti informacii o poznamke
    $(".vertical-resize").live("mousedown",function(event) {
            var self = this,
                    resize = true,
                    startY = event.pageY,
                    startH = $(this).parent().height();
            event.preventDefault();
            $("body").one("mouseup", function() {
                    resize = false;
            }).mousemove(function(event) {
                    if (resize) {
                            var resizeAmount = startY - event.pageY;
                            $(self).parent().height(startH+resizeAmount);
                    }
                    event.preventDefault();
            });
    }).live("dblclick",function() {
            //return to default value set by css
            $(this).parent().height("");
    }).disableSelection();

    // zobrazovanie pouzivatelskeho menu
    (function() {
        var timeout;
        $("#user-account #header-menu").removeClass("visuallyhidden").hide();
    $("#user-account").click(function() {
        $(this).find("#header-menu").slideToggle();
    }).mouseleave(function() {
        var self = this;
        timeout = setTimeout(function() {
            $(self).find("#header-menu").slideUp();
        },500);
    }).mouseenter(function() {
        clearTimeout(timeout);
    });
    }());


    $(".notebooks").sortable({
        axis: "y",
        handle: "> h2 .handle",
        items: ".notebook",
        placeholder: "sortable-placeholder",
        revert:"invalid",
        forcePlaceholderSize: true,
        update: function(event, ui) {
            noteMe.jsRoutes.orderNotebooks.ajax({
                urlParams: {
                    notebookId: ui.item.data("id")
                },
                data: {
                    newPosition: ui.item.parent().children().index(ui.item)
                },
                success: function(data) {

                },
                error: function(err) {

                }
            });
        }
    });

    var sortNotesSettings = {
        axis: "y",
        handle: "> .handle",
        items: ".note",
        revert:"invalid",
        connectWith:".notebook > div",
        placeholder: "sortable-placeholder",
        forcePlaceholderSize: true,
        update: function(event, ui) {
            var targetNotebook = ui.item.parents(".notebook"),
                eventTargetNotebook = $(event.target).parents(".notebook"),
                sourceNotebook = ui.sender?$(ui.sender).parents(".notebook"):null;
            if(targetNotebook.get(0)!==eventTargetNotebook.get(0)){
                return;
            }

            noteMe.jsRoutes.orderNotes.ajax({
                urlParams: {
                    noteId: ui.item.data("id")
                },
                data: {
                    fromNotebookId: sourceNotebook?sourceNotebook.data("id"):-1,
                    toNotebookId: targetNotebook.data("id"),
                    newPosition: ui.item.parent().children().index(ui.item)
                },
                success: function(data) {

                },
                error: function(err) {

                }
            });
        }
    };
    $(".notebook >  div").sortable(sortNotesSettings);

    var tagHook = function(){
        $("#tag-sidebar .tag").draggable({
            helper: "clone",
            appendTo: "body",
            revert: "invalid",
            connectToSortable: "#tag-sidebar",
            snapMode: "inner",
            snap: ".note",
            snapTolerance: 5
        });   
    };
    tagHook();
    noteMe.addTagHooks.push(tagHook);
    
    $(".tag .title").singleDoubleClick(function(){
        var tagName = $(this).parents(".tag").find(".title").text();
        noteMe.jsRoutes.searchForTags.ajax({
            urlParams: {
                id: $(this).parents(".tag").data("id")
            },
            success: function(data){
                noteMe.search.search(data,tagName);
            },
            error: function(err) {

            }
        });
    }, function(){
        noteMe.manage.rename.call($(this),function(result){
            var self = this;
            var tag = $(this).parents(".tag");
            if(!result.saved){
                return;
            }
            noteMe.jsRoutes.rename.ajax({
                urlParams: {
                    type:"tag",
                    id: tag.data("id"),
                    newName: $(this).text()
                },
                success: function(){
                    $(".tag[data-id=\""+tag.data("id")+"\"] .title").text($(self).text());
                },
                error: function(err){
                    noteMe.message.error("Chyba premenovania");
                }
            });
        });
    });

    $(".tag .ui-icon-close").live("click",function(event) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        var self = this;
        var deleted =[];
        if($(this).parents("#tag-sidebar").length){
            $.delayedAction({
                name: "Odstránenie značky "+$(this).parents(".tag").find(".title").text(),
                action: noteMe.jsRoutes.remove.ajax,
                actionParams : {
                    urlParams: {
                        type: "tag",
                        id: $(this).parents(".tag").data("id")
                    },
                    success : function(data) {
                        noteMe.message.info("Zmazaná značka "+$(self).find(".title").text());
                    },
                    error: function(err) {
                        noteMe.message.error("Chyba pri mazaní značky");
                    }
                },
                immediateCallback: function(){
                    $('.tag[data-id="'+$(self).parents(".tag").data("id")+'"]').animate({width:0}).promise().done(function(){
                            deleted.push({item:$(this),parent:$(this).parent()});
                            $(this).hide();
                        });
                },
                revertCallback: function(){
                    var i;
                    for (i in deleted){
                        if($(deleted[i].parent).length){
                            $(deleted[i].item).show().removeAttr("style");
                        }
                    }
                }
            });
        } else if ($(this).parents("#notetags").length){
            var noteId = $(this).parents("#right-column-wrapper .note").data("id"),
                tagId = $(this).parents(".tag").data("id");
            noteMe.jsRoutes.removeTagFromNote.ajax({
                urlParams: {
                    noteId: noteId,
                    tagId: tagId
                },
                success: function(data){
                    $(self).parents(".tag").animate({width:0}).promise().done(function(){
                         $(this).remove();
                    });
                    if(data==="lastTagRemoved"){
                        $(".notebook .note[data-id=\""+noteId+"\"] .flags .ui-icon-tag").remove();
                    }
                },
                error: function(err) {

                }
            });
        }
    });

    var droppableNote = function() {
        $(".note").droppable({
            accept: ".tag",
            hoverClass: "ui-state-active",
            drop: function(event, ui) {
                var self = this;
                $(this).highlightWithClass(1000);
                noteMe.jsRoutes.addTagToNote.ajax({
                    urlParams: {
                        tagId: ui.draggable.data("id"),
                        noteId: $(this).data("id")
                    },
                    success: function(data) {
                        var tag;
                        
                        // pridaj symbol znacky na poznamku v zozname
                        if(!$(self).find(".flags .ui-icon-tag").length){
                            if($(self).find(".flags .ui-icon-flag").length){
                                $(self).find(".flags .ui-icon-flag").after("<span class=\"ui-icon ui-icon-tag\" title=\"Obsahuje značky\"></span>");
                            } else {
                                $(self).find(".flags").prepend("<span class=\"ui-icon ui-icon-tag\" title=\"Obsahuje značky\"></span>");
                            }
                        }
                        // zobraz znacku v poznamke ak je otvorena
                        if($(self).data("id")===noteMe.opened.note.id && !$('#notetags .tag[data-id="'+ui.draggable.data("id")+'"]').length){
                            tag = ui.draggable.clone().removeClass("ui-draggable");
                            $(".right-column").find("#notetags").prepend(tag);
                        }
                        noteMe.message.info("Značka \""+ui.draggable.find(".title").text()+"\" pridaná poznámke \""+$(self).find(".title").text()+"\"");
                    },
                    error: function(err) {

                    }
                });
            }
        });
    };
    droppableNote();
    noteMe.addNoteHooks.push(droppableNote);
    
    // nova znacka
    var closeNewTag = function() {
    	$(this).val("").hide("slow").promise().done(function() {
    		$(this).parents(".new-tag").addClass("closed");
        });
    };
    $(".new-tag").click(function() {
        $(this).removeClass("closed").find("input").show("slow").focus();
    });
    $(".new-tag input").enterKey( function() {
        var self = this;
        if($(this).val()===""){
            $(this).highlightWithClass(500,"ui-state-highlight");
            return;
        }
        noteMe.jsRoutes.saveNewTag.ajax({
            urlParams: {
                name: $(this).val()
            },
            success: function(data) {
                $("#tag-sidebar .new-tag").first().after(data).hide().slideDown();
                noteMe.message.info("Vytvorená značka \""+$(self).val()+"\"");
                closeNewTag.call(self);
                noteMe.executeHooks(noteMe.addTagHooks);
                
            },
            error: function(err){

            }
        });
    }).escKey(closeNewTag).blur(closeNewTag);

    
    // premenovania
    $('.notebook h2 .title, .notebook .note:not(.not-owned-note) .title').live("dblclick",function() {
        noteMe.manage.rename.call($(this),function(result){
            if(!result.saved){return;}
            var parents = $(this).parents(),
                self = $(this),
                type;
            if(parents.filter(".note").length){
                type="note";
            } else if(parents.filter(".notebook").length){
                type = "notebook";
            }
            noteMe.jsRoutes.rename.ajax({
                urlParams: {
                    type: type,
                    id: self.parents("."+type).data("id"),
                    newName: self.text()
                },
                success: function(data){
                    if(type === "note" && noteMe.opened.note.id === self.parents(".note").data("id")) {
                        $(".note[data-id=\""+self.parents(".note").data("id")+"\"]").each(function(){
                            $(this).find(".title").first().text(data);
                        });
                    }
                },
                error: function(err) {
                    noteMe.message.error("Chyba pri premenovaní");
                    noteMe.manage.revertLastRename();
                }
            });
        });
    });
    
    $("*[contenteditable='true']").live("click, focus", function() {
    	$(this).select();
    });

    $("#new-notebook").click(function(event) {
        noteMe.jsRoutes.newNotebook.ajax({
            success : function(data) {
                var ad = $(data).prependTo($(".notebooks").first());
                noteMe.manage.rename.call($(ad).find("h2 .title"),function(result) {
                    var self = this;
                    if(!result.saved) {
                        $(this).parents(".notebook").remove();
                        return;
                    }
                    noteMe.jsRoutes.saveNewNotebook.ajax({
                        urlParams: {
                            name: $(this).text()
                        },
                        success: function(data){
                            $(self).parents(".notebook").attr("data-id",data);
                            $(".notebook >  div").sortable(sortNotesSettings);
                            noteMe.message.info("Vytvorený poznámkový blok \""+self.text()+"\"");
                        },
                        error: function(err) {
                        }
                    });
                });
            },
            error : function(err) {

            }
        });
    });

    $(".new-note").live("click",function(evnet) {
        var notebook = $(this).parents(".notebook");
           noteMe.jsRoutes.newNote.ajax({
            urlParams: {
                notebookId: $(notebook).data("id")
            },
            success: function(data) {
                var note = $(data).prependTo($(notebook).children("div.notes").first());
                noteMe.manage.rename.call($(note).find("span.title"), function(result) {
                    var self = this;
                    if (!result.saved) {
                        $(note).remove();
                        return;
                    }
                    noteMe.jsRoutes.saveNewNote.ajax({
                        urlParams: {
                            notebookId: $(notebook).data("id"),
                            name: $(this).text()
                        },
                        success: function(data) {
                            $(self).parents(".note").attr("data-id",data).find(".iconbar a.ui-icon-pencil").attr("href",function(){
                                return $(this).attr("href") + data;
                            });
                            noteMe.message.info("Vytvorená poznámka \""+self.text()+"\"");
                            noteMe.executeHooks(noteMe.addNoteHooks);
                        },
                        error: function(err) {
                            noteMe.message.error("Novú poznámku sa nepodarilo uložiť");
                            note.remove();
                        }
                    });
                });
            },
            error: function(err) {
                noteMe.message.error("Chyba pri vytváraní novej poznámky");
            }
           });
    });

    $(".notebook h2 .iconbar .ui-icon-close").live("click", function(event){
        var notebook = $(this).parents(".notebook");
        var removed = {};
        $.delayedAction({
            name: "odstránenie poznámkového bloku "+notebook.find("h2 .title").text(),
            action: noteMe.jsRoutes.remove.ajax,
            actionParams: {
                urlParams: {
                    type: "notebook",
                    id: notebook.data("id")
                },
                success: function(data){
                    noteMe.message.info("Poznámkový blok \""+notebook.find("h2 .title").text()+"\" bol zmazaný");
                },
                error: function(err) {
                    noteMe.message.error("Chyba pri mazaní poznámkového bloku");

                }
            },
            immediateCallback: function(){
                if(notebook.find(".note[data-id=\""+noteMe.opened.note.id+"\"]").length) {
                    noteMe.opened.note.close(); // ak je v mazanom bloku poznamka, ktora je momentalne otvorena, zavri poznamku
                }
                notebook.slideUp(function() {
                   removed = $(this);
                   $(this).hide(); 
                });
            },
            revertCallback: function(){
                removed.slideDown().promise().done(function(){$(this).show();});
            }

        });
    });



    $(".notebook .note").singleDoubleClick(function(){
        var self = $(this);
        var action = function(){
            window.location.hash=$(self).data("id");
        }
        if (noteMe.opened.note.edited) {
            $("<p>Poznámka bola zmenená</p>").dialog({
                modal: true,
                buttons : {
                    "Uložiť poznámku": function(){
                        $(this).dialog("close");
                        $.Deferred().resolve().done(noteMe.edit.saveNote).promise().done(action);
                        //$(noteMe.edit.saveButton).trigger("mousedown");

                    },
                    "Pokračovať bez uloženia": function(){
                        $(this).dialog("close");
                        action();
                    },
                    "Zrušiť": function(){
                        $(this).dialog("close");
                    }
                }
            });
            return;
        }
        action();
    });

    $(window).on("beforeunload unload",function(event){
        if (noteMe.opened.note.edited) {
            event.preventDefault();
        }
    });

    $(".note .iconbar .ui-icon").live("click", function(event){
        // neklikni, ak sa robil sort
        //event.preventDefault();
        event.stopPropagation();
        //event.stopImmediatePropagation();
    });
    $(".note .iconbar .ui-icon-close").live("click", function(event){
        var note = $(this).parents(".note");
        var removed;
        $.delayedAction({
            name: "Odstránenie poznámky "+ note.find(".title").text(),
            action: noteMe.jsRoutes.remove.ajax,
            actionParams: {
                urlParams: {
                    type: "note",
                    id: note.data("id")
                },
                success: function(data) {
                    noteMe.message.info("Poznámka \""+note.find(".title").text()+"\" bola zmazaná");
                },
                error: function(err) {

                }
            },
            immediateCallback : function(){
                if(note.data("id")===noteMe.opened.note.id) {
                    noteMe.opened.note.close();
                }
                note.slideUp("slow",function(){
                    removed = $(this)
                    $(this).slideUp();
                });
            
            },
            revertCallback: function(){
                removed.slideDown();
            }
        });
    });

    $(".right-column #note-toolbar button").iconButton();
    
    
    
    $(document).tooltip({
        selector: "[title]",
        position: {
            my: "left top",
            at: "left+5 bottom+20"
        },
        tooltipClass: "tooltip"
    });
    
    
    // =========== Edit
    $("#hide-notebooks").iconButton().toggle(function() {
    	$("#left-column-wrapper").hide("slow");
    	$("#right-column-wrapper").animate({
    		marginLeft: "0"
    	});
    	$(".right-column > h2").animate({paddingLeft:"150px"});
    	$(this).button({icons:{primary:"ui-icon-carat-1-e"},label:"Zobraziť bloky"});
    }, function() {
    	$("#left-column-wrapper").show("slow");
    	$("#right-column-wrapper").animate({
    		marginLeft: "36%"
    	});
    	$(".right-column > h2").animate({paddingLeft:"3px"});
    	$(this).button({icons:{primary:"ui-icon-carat-1-w"},label:"Skryť bloky"});
    });
    
    
    // zdielanie
    $(".sharenote-button, .note .iconbar .ui-icon-link").live("click",function() {
    	var note = $(this).parents(".note");
        noteMe.jsRoutes.shareNote.ajax({
            urlParams: {
                id: note.data("id")
            },
            dataType: "html",
            context: $("body"),
            success: function(data) {
                $(data).appendTo($(this)).dialog({
                    buttons: {
                        "Zavrieť": function(event) {
                            event.preventDefault();
                            $(this).dialog("close");
                        },
                        "OK": function(event){
                            event.preventDefault();
                            $(this).find(">form").submit();
                            if($(this).find(".ui-adder").adder("dataLength")){
                                if(!note.find(".flags .ui-icon-link").length){
                                    note.find(".flags").append("<span class=\"ui-icon ui-icon-link\" title=\"Zdieľaná poznámka\"></span>");
                                }
                            } else {
                                note.find(".flags .ui-icon-link").remove();
                            }
                            $(this).dialog("close");
                        }
                    },
                    close:function() {
                        $(this).dialog("destroy");
                        $(this).remove();
                    }
                });
                var adder = $("#sharenote .add-multiple").adder({
                    inputLabel:"Pridať email používateľa",
                    addCheck: function(value,item) {
                        var self = this;
                        noteMe.jsRoutes.knownMail.ajax({
                            urlParams: {
                                email: value
                            },
                            success: function(data) {
                                if (data === "found") {
                                    
                                } else {
                                    noteMe.message.error("Používateľ "+value+" nebol nájdený.");
                                    $(item).addClass("ui-state-highlight").removeClass("ui-state-highlight",500).promise().done(function(){
                                        self.remove($(this));
                                    });
                                }
                            },
                            error: function(err) {
                                noteMe.message.error("Chyba pri kontrole emailu používateľa");
                            }
                        });
                    }
                });
                if(!$("#sharenote #publicId-dest").text()){
                    $("#sharenote #share-public").hide();
                } else {
                    $("#sharenote #publicId").attr('checked', true); 
                }
                $("#sharenote > form").submit(function(event) {
                    event.preventDefault();
                    noteMe.jsRoutes.sharing.ajax({
                        data: {
                            json: JSON.stringify(adder.adder("getValues")),
                            id: $(this).parents(".dialog").data("id"),
                            type: "note"
                        },
                        success: function(data) {
                            noteMe.message.info("Zdieľanie uložené");
                        },
                        error: function(err) {
                            noteMe.message.error("Chyba pri ukladaní zdieľania");
                        }
                    });
                    //adder.adder("destroy");
                    return false;
                }); 
                $("#sharenote #publicId").on("click",function(){
                    if($(this).is(":checked")){
                        noteMe.jsRoutes.sharePublic.ajax({
                            urlParams: {
                                id: $(this).parents(".ui-dialog").find(".ui-dialog-content").data("id")
                            },
                            success: function(data) {
                                $("#sharenote #publicId-dest").text(data);
                                $("#sharenote #share-public").fadeIn();
                            },
                            error: function(err){

                            }
                        });
                    } else {
                        noteMe.jsRoutes.unsharePublic.ajax({
                            urlParams: {
                                id: $(this).parents(".ui-dialog").find(".ui-dialog-content").data("id")
                            },
                            success: function(){
                                $("#sharenote #publicId-dest").text("");
                                $("#sharenote #share-public").fadeOut();
                            },
                            error: function(err){

                            }
                        });
                    }
                });
                $("#sharenote #publicId-dest").click(function(){$(this).selectText();});
            },
            error: function(err) {
                if(err.status===403){
                    noteMe.message.error("Túto poznámku nemôžete ďalej zdieľať");
                }
            }
    	});
    });
    $(".notebook h2 .iconbar .ui-icon-link").live("click", function(){
       var notebook = $(this).parents(".notebook");
        noteMe.jsRoutes.shareNotebook.ajax({
           urlParams:{
               id: notebook.data("id")
           },
           dataType: "html",
           context: $("body"),
           success: function(data) {
                $(data).appendTo($(this)).dialog({
                    buttons: {
                        "Zavrieť": function(event) {
                            event.preventDefault();
                            $(this).dialog("close");
                        },
                        "OK": function(event){
                            event.preventDefault();
                            $(this).find(">form").submit();
                            if($(this).find(".ui-adder").adder("dataLength")){
                                if(!notebook.find("h2 .flags .ui-icon-link").length){
                                    notebook.find("h2 .flags").append("<span class=\"ui-icon ui-icon-link\" title=\"Zdieľaný poznámkový blok\"></span>");
                                }
                            } else {
                                notebook.find(".flags .ui-icon-link").remove();
                            }
                            $(this).dialog("close");
                        }
                    },
                    close:function() {
                        $(this).dialog("destroy");
                        $(this).remove();
                    }
                });
                var adder = $("#sharenotebook .add-multiple").adder({
                    inputLabel:"Pridať email používateľa",
                    addCheck: function(value,item) {
                        var self = this;
                        noteMe.jsRoutes.knownMail.ajax({
                            urlParams: {
                                email: value
                            },
                            success: function(data) {
                                if (data === "found") {
                                    
                                } else {
                                    noteMe.message.error("Používateľ "+value+" nebol nájdený.");
                                    $(item).addClass("ui-state-highlight").removeClass("ui-state-highlight",500).promise().done(function(){
                                        self.remove($(this));
                                    });
                                }
                            },
                            error: function(err) {
                                noteMe.message.error("Chyba pri kontrole emailu používateľa");
                            }
                        });
                    }
                });
                $("#sharenotebook > form").submit(function(event) {
                    event.preventDefault();
                    noteMe.jsRoutes.sharing.ajax({
                        data: {
                            json: JSON.stringify(adder.adder("getValues")),
                            id: $(this).parents(".dialog").data("id"),
                            type: "notebook"
                        },
                        success: function(data) {
                            noteMe.message.info("Zdieľanie uložené");
                        },
                        error: function(err) {
                            noteMe.message.error("Chyba pri ukladaní zdieľania");
                        }
                    });
                    return false;
                });
           }
       }); 
    });

    $("#account").click(function(){
        var acmDialog;
        noteMe.jsRoutes.accountManager.ajax({
            success: function(data){
                acmDialog = $(data).appendTo("header").dialog({
                    modal: true,
                    buttons: {
                        DelAccount: {
                            class: "account-delete-button",
                            text: "Zmazať konto",
                            click: function(){
                                var delAccDialog;
                                noteMe.jsRoutes.deleteAccountDialog.ajax({
                                    success: function(data){
                                        delAccDialog = $(data).appendTo("header").dialog({
                                            dialogClass: "ui-state-error",
                                            modal: true,
                                            buttons: {
                                                "Zrušiť": function(){
                                                    $(this).dialog("close");
                                                },
                                                "Zmazať konto": function(){
                                                    $(this).find("form").submit();
                                                }
                                            },
                                            close:function() {
                                                $(this).dialog("destroy");
                                                $(this).remove();
                                            }
                                        });
                                    }
                                });  
                                $("#accountdelete.dialog form").live("submit",function(event){
                                    event.preventDefault();
                                    var form = $(this);
                                    noteMe.jsRoutes.deleteAccount.ajax({
                                        data: $(this).serialize(),
                                        success: function(data){
                                            if(data.next){
                                                 window.location.assign(data.next);
                                            }
                                        },
                                        error: function(err){
                                            tooltipsOnError(form,err);
                                        }
                                    });
                                    return false;
                                });  
                                $(this).dialog("close");
                            }
                        },
                        "Zavrieť": function() {
                            $(this).dialog("close");
                        },
                        "OK": function(){
                            $(this).find("form").submit();
                        }
                    },
                    close:function() {
                        $(this).dialog("destroy");
                        $(this).remove();
                    }
                });
                $("#accountmanager.dialog form").submit(function(event){
                    event.preventDefault();
                    var form = $(this);
                    noteMe.jsRoutes.manageAccount.ajax({
                        data: $(this).serialize(),
                        success: function(data){
                            $("#user-name").text(form.find("#acm-name").val());
                            acmDialog.dialog("close");
                        },
                        error: function(err){
                            tooltipsOnError(form,err);
                        }
                        
                    });
                });
            }
        });
    });

    function tooltipsOnError(form,err){
        var resp = $.parseJSON(err.responseText),
            selector = "input[type='text'], input[type='password']",
            tooltips;

        try {
            $(selector).tooltip("destroy");
        } catch (e) {
            // ignoruj, sluzi len na zatvorenie pripadnych tooltipov
        }

        tooltips = $(form).find(selector).tooltip({
            items: "input",
            content: function() {
                if(resp && resp[$(this).attr("name")]) {
                    return resp[$(this).attr("name")][0].message;
                }
            },
            open: function(){
                var self = $(this);
                setTimeout(function(){self.tooltip("close");}, 10000);
            },
            close: function(){
                $(this).tooltip("destroy");
            },
            tooltipClass: "ui-state-error"
        });
        tooltips.tooltip("open");
    }


});

if(typeof nicEditors !== "undefined"){
    
    var imgUploadOptions = {
        buttons: {
            "upload": {name: "Nahrať obrázok", type: "imgUpload"}
        }
    };

    var imgUpload = nicEditorAdvancedButton.extend({
        init: function() {
        },
        addPane: function() {
            if (typeof window.FormData === "undefined") {
                return;
            }
            var self = this;
           
            var container = $("<form>").css({padding: 10}).appendTo($(this.pane.pane)).on("submit", function(){
                var form = $(this)
                self.submit();
            });
            
            this.label = $("<label for=\"ne-img-upload\">Zvoľte obrázkový súbor:</label>").appendTo(container);
            this.file = $("<input type=\"file\" id=\"ne-img-upload\">").appendTo(container).focus();
            this.submitButton = $("<input type=\"submit\" value=\"Nahrať obrázok\">").appendTo(container).button();
            this.progressBar = $("<progress width=\"100%\">").css({padding:10}).appendTo($(this.pane.pane)).hide();   
        },
        submit: function() {
            if(this.file.val()===""){
                this.file.highlightWithClass("ui-state-highlight");
                return;
            }
        
            var file = this.file.get(0).files[0],
                self = this;
            
            if (!file || !file.type.match(/image.*/)) {
              noteMe.message.error("Možete nahrávať iba obrázkové súbory");
              return;
            }
        
            this.file.hide();
            this.label.hide();
            this.progressBar.show().val(0);
            
            noteMe.edit.uploadImage(file,noteMe.opened.note.id,function(obj) {
                if(!obj || !obj.image) {
                    return;
                }
                var image = self.ne.selectedInstance.selElm().parentTag('IMG');
                if (!image) {
                    self.ne.selectedInstance.restoreRng();
                    self.ne.nicCommand("insertImage", obj.image.url);
                    image = self.findElm('IMG','src', obj.image.url);
                }
                if (image) {
                    $(image).attr("src",obj.imageUrl).attr("width",Math.min(300,obj.image.width));
                }
            
            });
            
        }
    });

    nicEditors.registerPlugin(nicPlugin,imgUploadOptions);


    $(function(){

        // drag-drop upload obrazkov v editore
        noteMe.showNoteEditorHooks.push(function(){
            $(document).live("dragover dragend", function(event){
                event.preventDefault();
                
            }).live("drop", function(event){
                event.preventDefault();
            });
            $(".note-block-wrapper").live("drop", function(event){
                event.preventDefault();
                if(typeof event.originalEvent.dataTransfer.files[0] === "undefined") {
                    return;
                }
                noteMe.edit.uploadImage(event.originalEvent.dataTransfer.files[0],noteMe.opened.note.id,function(obj){
                    if(!obj || !obj.image) {
                        return;
                    }
                    var selInst = nicEditors.editors[0].selectedInstance ||
                            nicEditors.editors[0].lastSelectedInstance || 
                            nicEditors.editors[0].nicInstances[0];
                    
                    findElm = function(tag,attr,val) {
                            var list = selInst.getElm().getElementsByTagName(tag);
                            for(var i=0;i<list.length;i++) {
                                    if(list[i].getAttribute(attr) === val) {
                                            return $BK(list[i]);
                                    }
                            }
                    };
                    var image = (selInst).selElm().parentTag('IMG');
                    if (!image) {
                        selInst.restoreRng();
                        nicEditors.editors[0].nicCommand("insertImage", obj.image.url);
                        image = findElm('IMG','src', obj.image.url);
                    }
                    if (image) {
                        $(image).attr("src",obj.imageUrl).attr("width",Math.min(300,obj.image.width));
                    }
                    });
            });

        } ); 

    });

}


/* ========= jQuery extensions ========= */

jQuery.fn.singleDoubleClick = function(single_click_callback, double_click_callback, timeout) {
    var clicks = 0;
    jQuery(this.selector).live("singleClick",single_click_callback || function(){}).live("doubleClick",double_click_callback || function(){});
    jQuery(this.selector).live("click",function(event){
        var self = $(this);
        clicks++;
        if (clicks === 1) {
            setTimeout(function(){
                if(clicks === 1) {
                    self.trigger("singleClick",event);
                    //single_click_callback.call(self, event);
                } else {
                    self.trigger("doubleClick",event);
                    //double_click_callback.call(self, event);
                }
                clicks = 0;
            }, timeout || 300);
        }
    });
    jQuery(this.selector).live("dblclick",function(event) {
        event.preventDefault();
    });
    return jQuery(this.selector);
};

// ikony tlacidiel
jQuery.fn.iconButton = function(options) {
	return this.each(function() {
		var opt = {},
                    icons = {
                            icons: {
                                    primary: jQuery(this).attr("data-ui-icon-primary"),
                                    secondary: jQuery(this).attr("data-ui-icon-secondary")
                            }
                    };
		jQuery.extend(true, opt, options?options:{}, icons);
		jQuery(this).button(opt);
	});
};

// scrollbary
jQuery.fn.scrollbar = function(){
	return this.each(function() {
		var self = this;
                var api = $(this).jScrollPane({hideFocus:true, autoReinitialise:true,stickToBottom:true}).data("jsp");
		// apply to this, to all children and parents
		$(this).add($(this).children()).add($(this).parents()).on("resize", function(event) {
			event.stopPropagation();
			api.reinitialise();
		});
		
		return $(this);
	});
};


$.fn.keydownCode = function(keyCode,callback,method) {
    return $(this)[method||"live"]("keydown",function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode === keyCode) {
            callback.call(this, event);
        }
    });
};

$.fn.enterKey = function(cb,method) {
	    return $(this).keydownCode(13,cb,method);
};

$.fn.escKey = function(cb,method) {
        return $(this).keydownCode(27,cb,method);
};

// select text
$.fn.selectText = function () {
    return this.each(function() {
        var doc = document,
            text = $(this).get(0),
            range, selection;

        if (doc.body.createTextRange) { //ms
            range = doc.body.createTextRange();
            range.moveToElementText(text);
            range.select();
        } else if (window.getSelection) { //all others
            selection = window.getSelection();
            range = doc.createRange();
            range.selectNodeContents(text);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });
};

$.fn.highlightWithClass = function(time,cls){
    return this.each(function(){
        if(!cls) {
            cls = "ui-state-highlight";
        }
        $(this).addClass(cls).removeClass(cls,time);
    });
};

$.noanim = function(action) {
    var fx = jQuery.fx.off,
        returnValue;
    jQuery.fx.off = true;
    returnvalue = action();
    jQuery.fx.off = fx;
    return returnValue;
};

/**
 * UI widget pre vytvaranie a upravu zoznamov
 */
$(function(){
    var adderPrototype = {
        options : {
            inputLabel: "Add",
            size: 3,
            addCheck : null
        },
        _internal : {
            itemClass : "ui-adder-item"
        },
        _init : function() {
            var element = $(this.element),
                self = this,
                initValues = element.children().detach();
    
            this.params = {
                adder: $("<form>").addClass("ui-adder-adder"),
                added: $("<div>").addClass("ui-adder-added"),
                inputID: "input-add-"+this.uuid,
                values: [],
                removed: []
            };
        
            $("<label>").text(this.options.inputLabel).appendTo(this.params.adder);
            $("<input>").attr("id",this.params.inputID).attr("type","email").appendTo(this.params.adder);
            this.params.adder.append("&nbsp;");
            $("<button>").text(this.options.inputLabel).appendTo(this.params.adder).button({
                icons: {
                    primary: "ui-icon-plus"
                },
                text: false
            }).click(function(event) {
                event.preventDefault();
                self.add($("#"+self.params.inputID).val());
            });

            this.params.adder.prependTo(element);
            $("<div class='ui-adder-added-scroll'>").appendTo(element).append(this.params.added);

            element.addClass("ui-adder");

            initValues.each(function(){
                var val = $(this).text();
                if ($(this).attr("data-type")==="read-only"){
                    $.noanim(function(){self.add(val,"read-only");});
                } else {
                    $.noanim(function(){self.add(val,"default");});
                }
            });
            element.find("input").focus();
        },
        add : function(value,type) {
            var index = this.params.values.length,
                self = this,
                newItem,
                i;
            if(value===""){
                $("#"+this.params.inputID).addClass("ui-state-highlight").removeClass("ui-state-highlight",500);
                return;
            }
            //kontrola duplicit
            for(i in this.params.values){
                if(this.params.values[i] && this.params.values[i].value === value){
                    this.params.added.children().filter(function() { return $(this).data("index") === parseInt(i,10); }).toggleClass("ui-state-highlight").toggleClass("ui-state-highlight",500);
                    return;
                }
            }
            this.params.values.push({value: value, type: type || "new"});
            newItem = $("<div>").text(value).addClass(this._internal.itemClass);
            if(type === "read-only") {
                newItem.button().addClass("ui-state-highlight").css("cursor","default");
            } else {
                newItem.button({
                    icons: {
                        secondary: "ui-icon-close"
                    }
                });
            }
            newItem.prependTo(this.params.added).hide();

            $(newItem).data("index",index)
                .slideDown("slow")
                .find(".ui-icon-close").click(function(event) {
                    self.remove($(this).parent());
                    event.preventDefault();
                });

            $("#"+this.params.inputID).val("").focus();
            
            if(this.options.addCheck && typeof this.options.addCheck === "function"){  // add check callback
                this.options.addCheck.call(this, value, newItem); 
            }
        },
        remove : function(item) {
            var index = $(item).data("index");
            if(this.params.values[index].type === "default"){
                this.params.removed.push(this.params.values[index].value);
            }
            this.params.values[index] = null;
            $(item).slideUp(function(){
                $(this).remove();
            });
        },
        getValues : function() {
            var newValues = [],
                removedValues = this.params.removed;
            for(i in this.params.values){
                if(this.params.values[i] && this.params.values[i].type==="new"){
                    newValues.push(this.params.values[i].value);
                }
            }
            return {
                "new" : newValues,
                removed: removedValues
            };
        },
        dataLength: function(){
            var val = [];
            for(i in this.params.values){
                if(this.params.values[i]){
                    val.push(this.params.values[i].value);
                }
            }
            return val.length;
        },
        size: function(s) {
            if (s && typeof s === "number"){
               this.options.size = s;
               return this;
            } else {
                return this.options.size;
            }
        }

    };

    $.widget("ui.adder", adderPrototype);
});

$(function(){

    var delay = 10000,
        qn = "daq",
        buttonText = "Vrátiť akciu",
        actions = [],
        dAtooltipCloseTimeout = 0,
        /**
         * @param actionName názov akcie zobrazovaný v popisku tlačidla
         * @param text text tlacidla
         * @param index index akcie
         * @param all true, ak sa ma zobrazit tlacidlo pre zrusenie vsetkych akcii
         */
        dAtooltipContent = function(actionName,text,index,all) {
            var buttonSingleAction  = "", buttonAllActions = "";
            if(typeof index === "undefined" || index === null) {
                index = "";
            }

            buttonSingleAction = "<button title=\""+actionName+"\" class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary\""+
                " id=\"delayed-ajax-cancel"+index+"\">" +
                "<span class=\"ui-button-icon-primary ui-icon ui-icon-arrowrefresh-1-w\"></span>" +
                "<span class=\"ui-button-text\">"+text+"</span></button>";
            if (all){
                buttonAllActions = "<button class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-text-icon-primary\""+
                " id=\"delayed-ajax-cancel-all\">" +
                "<span class=\"ui-button-icon-primary ui-icon ui-icon-arrowrefresh-1-w\"></span>" +
                "<span class=\"ui-button-text\">Vrátiť všetky akcie</span></button>";
            }
            return buttonSingleAction + buttonAllActions;

        },
        dAtooltip = $("header").tooltip({
            content : dAtooltipContent(buttonText),
            items : "header",
            disabled : true,
            tooltipClass : "da-tooltip",
            show : {
                effect : "slideDown",
                duration : 500,
                easing : "swing"
            },
            hide : {
                effect : "slideUp",
                duration : 500,
                easing:"swing"
            },
            position : {
                my : "left top+2",
                at : "left+720 top",
                collision : "none"
            },
            open: function() {
                var self = $(this);
                noteMe.message.close();
                clearTimeout(dAtooltipCloseTimeout);
                dAtooltipCloseTimeout = setTimeout(function(){
                    self.tooltip("close");
                }, delay-250);
            },
            close: function() {
                clearTimeout(dAtooltipCloseTimeout);
            }
        }),
        actionNameTooltipSettings = {
            selector: "[title]",
            position: {
                my: "left top",
                at: "left+5 bottom+20"
            },
            tooltipClass: "tooltip"
        },
        isAnyPending = function(){
            var i;
            for (i in actions) {
                if(actions[i].deferred.state()==="pending"){
                    return true;
                }
            }
            return false;
        },
        actionDeferrer = (function(){
            var deferred = $.Deferred();
            deferred.resolve();
            return deferred.promise();
        }()),
        processAction = function(actionIndex,async) {
            var action, i;
            if (actionIndex === "all") {
                for (i in actions) {
                    action = actions[i];
                    actionDeferrer = actionDeferrer.done(action.deferred.resolve(async)).promise();
                }
            } else if(actions[actionIndex]) {
                action = actions[actionIndex];
                actionDeferrer = actionDeferrer.done(action.deferred.resolve(async)).promise();
            }
        },
        cancelAll = function(){
            var i;
            for (i in actions) {
                actions[i].cancel();
            }
        };

    /**
     * 
     * @param {type} args {action, name, actionParams, immediateCallback, revertCallback}
     * @returns {undefined}
     */
    $.delayedAction = function(args) {
        var action = args.action,
            actionName = args.name,
            actionParams = args.actionParams,
            immediateCallback = args.immediateCallback,
            revertCallback = args.revertCallback,

            deferred = $.Deferred(),
            actionIndex = actions.length,
            timeout = setTimeout(function(){
                processAction(actionIndex);
            }, delay),
            cancel = function(){
                clearTimeout(timeout);
                deferred.reject();
                if(!isAnyPending()) {
                    dAtooltip.tooltip("close");
                }
            };

            deferred.promise().done(function(async){
                if (typeof async === "boolean") {
                    actionParams.async = async;
                }
                action.call(document, actionParams);
            });

            deferred.promise().fail(function(){
                clearTimeout(timeout);
            });

            if (typeof revertCallback === "function") {
                deferred.promise().fail(revertCallback);
            }

            if (typeof immediateCallback === "function") {
                immediateCallback();
            }

            if (isAnyPending()) {
                dAtooltip.tooltip("option",{content: dAtooltipContent(actionName,"Vrátiť poslednú akciu",actionIndex,true),items: "header"}).tooltip("open");
                $("#delayed-ajax-cancel"+actionIndex).live("click",function(){
                    $(this).detach("click");
                    $(this).slideUp();
                    cancel();
                }).tooltip(actionNameTooltipSettings);
                $("#delayed-ajax-cancel-all").live("click",function(){
                    $(this).detach("click");
                    cancelAll();
                });
            } else {
                dAtooltip.tooltip("option",{content: dAtooltipContent(actionName,buttonText,actionIndex),items: "header"}).tooltip("open");
                $("#delayed-ajax-cancel"+actionIndex).live("click",function(){
                    $(this).detach("click");
                    cancel();
                }).tooltip(actionNameTooltipSettings);
            }

            actions.push({
                timeout : timeout,
                deferred : deferred,
                cancel : cancel,
                action : action,
                actionParams : actionParams
            });

    };
    if($.browser.opera) {
        // toto aj tak nefunguje 
        history.navigationMode = 'compatible';
        window.onunload = function(){
            processAction("all",false);
        };
    }
    $(window).bind("beforeunload unload",function(){
        processAction("all",false);  //spracuj vsetky s async = false
    });

});