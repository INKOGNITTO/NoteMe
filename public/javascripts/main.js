var noteMe = noteMe || {};

$(function() {

    // aplikacia :)

    (function() {
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
            };
    
        this.manage = {
            rename : function(cb) {
                var oldText = $(this).text(),
                    result = {
                        saved : false
                    };
                $(this).off(".rename").off("keydown");
                $(this).on("focus.rename", function() {
                    $(this).selectText();
                    if($.browser.opera){
                        // opera zrusi selekciu kvoli zmene stylu elementu, treba ju preto zopakovat
                        var self = $(this);
                        setTimeout(function(){self.selectText();},10);
                    }
                }).on("blur.rename", function() {
                    if(!result.saved){
                        $(this).text(oldText);
                    }
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
            }
        };
        this.opened  = {
            note: {
                id: null,
                close: function() {
                    this.id = null;
                    $(".right-column.note").remove();
                }
            }
        };
        this.addNoteHooks = [];
        this.addTagHooks = [];
        this.showNoteHooks = [];
        this.executeHooks = function(hooks){
            for (var i in hooks){
                hooks[i]();
            }
        };
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
                        noteMe.edit.init();
                    },
                    error : function(err) {
                        console.log(err);
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
                        console.log(err);
                    }
                });
            } else {
                return;
            }   
        };
        this.edit = (function(){
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
                createEditor = function(){
                    return new nicEditor({
                        onSave : function(c){
                            var content = $(editorSpace).clone(true);
                            content.find(".note-block-wrapper").attr("class","note-block-wrapper").find(".handle").hide();
                            content.find(".ui-resizable-handle").remove();
                            content.find(".note-block").removeAttr("contenteditable");
                            noteMe.jsRoutes.saveNote.ajax({
                                data : {
                                    id: $(".right-column h2").data("id"),
                                    content: content.html()
                                },
                                success : function(data) {
                                    noteMe.message.info("Poznámka uložená");
                                },
                                error : function(err) {
                                    noteMe.message.error("Chyba pri ukladaní poznámky");
                                }
                            });
                        }
                    });
                },
                blockCount = null;
                
            editor = createEditor();    
        
            return {
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
                    }).draggable(draggableSettings).resizable(resizebleSettings);
                    editor.addInstance(block.attr("id"));
                    editorInstances.push(block);
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
                            if(!jqe.text()){
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
                    editorSpace.find(".note-block").each(function(){
                        editor.addInstance($(this).attr("id"));
                        editorInstances.push($(this));
                    });
                    
                    editorSpace.click(function(e){
                        if(e.target!==this){
                            e.stopPropagation();
                            return;
                        }
                        noteMe.edit.createBlock(e.pageX,e.pageY).focus();
                    }); 
                }
            };
        }());
        this.message = {
            info: gtFunction(""),
            error: gtFunction("ui-state-error")
        };
        this.search = (function() {
            var searchInfoElement = $("<div>").appendTo("header").css({
                    width: 200,
                    maxWidth:300,
                    padding:5,
                    border: "1px solid #2e2e2e",
                    boxShadow: "0px 0px 4px #757575",
                    cursor: "pointer",
                    zIndex:10
                 }).addClass("ui-state-highlight ui-widget ui-corner-all ui-button-text-icon-secondary").position({
                     my: "left top",
                     at: "left bottom+3",
                     of: "#header-bar #search input[type=\"search\"]"
                 }).append($("<span class='title ui-button-text'>"))
                   .append($("<span class='ui-icon ui-icon-close ui-button-icon-secondary'>")).attr("title","Zrušiť vyhľadávanie").hide(),
                cancelNoteSearch = function(){
                    $(".notebooks .notebook").show();
                    $(".notebook .note").show();
                    if(searchInfoElement.is(":visible")){
                        searchInfoElement.slideUp("fast").find(".title").text("");
                    }
                };
            searchInfoElement.click(function(){
                cancelNoteSearch();
            });
            return function (noteIdArray,tag) {
                var notesContainer = $(".notebooks").first(),
                    i;

                cancelNoteSearch();

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
            };
        }());
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
                start : function(e){
                    elem.attr("src",animUrl);
                },
                stop : function(){
                    elem.attr("src",staticUrl);
                }
            };

        }());
    }.apply(noteMe));

    // tlacidla pred jsRoutes, lebo ten je synchronny
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

    $(document)
            .bind("ajaxSend", noteMe.loadAnim.start)
            .bind("ajaxComplete", noteMe.loadAnim.stop)
            .bind("ajaxComplete", function(event,xhr) {
                if(xhr.status === 0) {
                    noteMe.message.error("Server nedostupný");
                }
            });
    
    
    
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
    
    // klavesove skratky
    $(document).bind("keydown", "alt+b", function(event){
        event.preventDefault();
        $("#new-notebook").click();
    }).bind("keydown", "alt+z", function(){
        event.preventDefault();
        $(".new-tag").first().click();
    }).bind("keydown", "alt+p", function(){
        event.preventDefault();
        $(".notebooks .notebook").first().find(".new-note").click();
    }).bind("keydown", "alt+h", function(){
        event.preventDefault();
        $("#search input[type=\"search\"]").focus();
    });
    
 
    $("form#search input").live("focus",function(){
        $(this).select();
    });

    $("form#search").submit(function(event){
        var searchTerm = $(this).find("input[type='search']").val();
        if (!searchTerm) {
            event.preventDefault();
            note
            //event.preventDefault();
            return false;
        }
        noteMe.jsRoutes.search.ajax({
            data: {
                exp: searchTerm
            },
            success: function(data){
                noteMe.search(data);
            },
            error: function(err) {
                console.log(err);
            }
        });
        return false;
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


    // vertikalna zmena velkosti
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
            console.log(ui.item, ui.item.parent());
            console.log(ui.item.parent().children().index(ui.item));
            noteMe.jsRoutes.orderNotebooks.ajax({
                data: {
                    notebookId: ui.item.data("id"),
                    newPosition: ui.item.parent().children().index(ui.item)
                },
                success: function(data) {
                    console.log("zmena pozicie",data);
                },
                error: function(err) {
                    console.log("chyba zmeny pozicie poz.bloku",err);
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
            console.log(sourceNotebook);
            noteMe.jsRoutes.orderNotes.ajax({
                data: {
                    noteId: ui.item.data("id"),
                    fromNotebookId: sourceNotebook?sourceNotebook.data("id"):-1,
                    toNotebookId: targetNotebook.data("id"),
                    newPosition: ui.item.parent().children().index(ui.item)
                },
                success: function(data) {
                    console.log("zmena pozicie",data);
                },
                error: function(err) {
                    console.log("chyba zmeny pozicie poz.bloku",err);
                }
            });
        }
    };
    $(".notebook >  div").sortable(sortNotesSettings);

    /*$("#tag-sidebar").sortable({
        axis: "y",
        items: ".tag",
        placeholder: "sortable-placeholder",
        forcePlaceholderSize: true,
        disabled: true,
        stop: function(event, ui) {
            $("#tag-sidebar .tag").draggable("option","disabled",false);
            $("#tag-sidebar").sortable("option","disabled",true);
        }
    });*/


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
        var tagName = $(this).parents(".tag").find(".title").text()
        noteMe.jsRoutes.searchForTags.ajax({
            data: {
                id: $(this).parents(".tag").data("id")
            },
            success: function(data){
                noteMe.search(data,tagName);
            },
            error: function(err) {
                console.log(err);
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
                data: {
                    type:"tag",
                    id: tag.data("id"),
                    newName: $(this).text()
                },
                success: function(){
                    $(".tag[data-id=\""+tag.data("id")+"\"] .title").text($(self).text());
                },
                error: function(err){
                    console.log(err);
                    noteMe.message.error("Chyba premenovania");
                }
            });
        });
    });

    /*$("#tag-sidebar .tag .ui-icon-grip-dotted-vertical").mousedown(function() {
        $("#tag-sidebar .tag").draggable("option","disabled",true);
        $("#tag-sidebar").sortable("option","disabled",false);
    });*/
    
    $(".tag .ui-icon-close").live("click",function() {
        var self = this;
        if($(this).parents("#tag-sidebar").length){
            noteMe.jsRoutes.remove.ajax({
                data: {
                    type: "tag",
                    id: $(this).parents(".tag").data("id")
                },
                success : function(data) {
                    noteMe.message.info("Zmazaná značka "+$(self).find(".title").text());
                    $('.tag[data-id="'+$(self).parents(".tag").data("id")+'"]').animate({width:0}).promise().done(function(){
                         $(this).remove();
                    });
                },
                error: function(err) {
                    noteMe.message.error("Chyba pri mazaní značky");
                }
            });
        } else if ($(this).parents("#notetags").length){
            noteMe.jsRoutes.removeTagFromNote.ajax({
                data: {
                    noteId: $(this).parents("#right-column-wrapper .note").data("id"),
                    tagId: $(this).parents(".tag").data("id")
                },
                success: function(data){
                    $(self).parents(".tag").animate({width:0}).promise().done(function(){
                         $(this).remove();
                    });
                },
                error: function(err) {
                console.log(err);
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
                    data: {
                        tagId: ui.draggable.data("id"),
                        noteId: $(this).data("id")
                    },
                    success: function(data) {
                        var tag;
                        console.log($('#notetags .tag[data-id="'+ui.draggable.data("id")+'"]'));
                        if($(self).data("id")===noteMe.opened.note.id && !$('#notetags .tag[data-id="'+ui.draggable.data("id")+'"]').length){
                            tag = ui.draggable.clone().removeClass("ui-draggable");
                            $(".right-column").find("#notetags").prepend(tag);
                        }
                        noteMe.message.info("Značka \""+ui.draggable.find(".title").text()+"\" pridaná poznámke \""+$(self).find(".title").text()+"\"");
                    },
                    error: function(err) {
                        console.log(err);
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
            $(this).addClass("ui-state-highlight").removeClass("ui-state-highlight",500);
            return;
        }
        noteMe.jsRoutes.saveNewTag.ajax({
            data: {
                name: $(this).val()
            },
            success: function(data) {
                $("#tag-sidebar .new-tag").first().after(data);
                noteMe.message.info("Vytvorená značka \""+$(self).val()+"\"");
                closeNewTag.call(self);
                noteMe.executeHooks(noteMe.addTagHooks);
                
            },
            error: function(err){
                console.log(err);
            }
        });
    }).escKey(closeNewTag).blur(closeNewTag);

    
    // premenovania
    $('.notebook h2 .title, .notebook .note .title').live("dblclick",function() {
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
                data: {
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
                    console.log("chyba premenovania",err);
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
                        data: {
                            name: $(this).text()
                        },
                        success: function(data){
                            $(self).parents(".notebook").attr("data-id",data);
                            $(".notebook >  div").sortable(sortNotesSettings);
                            noteMe.message.info("Vytvorený poznámkový blok \""+self.text()+"\"");
                        },
                        error: function(err) {
                            console.log(err);
                        }
                    });
                });
            },
            error : function(err) {
                console.log(err);
            }
        });
    });

    $(".new-note").live("click",function(evnet) {
        var notebook = $(this).parents(".notebook");
           noteMe.jsRoutes.newNote.ajax({
            data: {
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
                        data: {
                            notebookId: $(notebook).data("id"),
                            name: $(this).text()
                        },
                        success: function(data) {
                            $(self).parents(".note").attr("data-id",data);
                            noteMe.message.info("Vytvorená poznámka \""+self.text()+"\"");
                            noteMe.executeHooks(noteMe.addNoteHooks);
                        },
                        error: function(err) {
                            console.log(err);
                        }
                    });
                });
            },
            error: function(err) {
                console.log(err);
            }
           });
    });

    $(".notebook h2 .ui-icon-close").live("click", function(event){
        var notebook = $(this).parents(".notebook");
        noteMe.jsRoutes.remove.ajax({
            data: {
                type: "notebook",
                id: notebook.data("id")
            },
            success: function(data){
                noteMe.message.info("Poznámkový blok \""+notebook.find("h2 .title").text()+"\" bol zmazaný");
                if(notebook.find(".note[data-id=\""+noteMe.opened.note.id+"\"]").length) {
                    noteMe.opened.note.close(); // ak je v mazanom bloku poznamka, ktora je momentalne otvorena, zavri poznamku
                }
                notebook.slideUp(function() {
                   $(this).remove(); 
                });
            },
            error: function(err) {
                noteMe.message.error("Chbyba pri mazaní poznámkového bloku");
                console.log(err);
            }
        });
    });



    $(".note").singleDoubleClick(function(){
        window.location.hash=$(this).data("id");
        //noteMe.showNote($(this).data("id"));
    });
    $(".note .ui-icon").live("click", function(event){
        // neklikni, ak sa robil sort
        //event.preventDefault();
        event.stopPropagation();
        //event.stopImmediatePropagation();
    });
    $(".note .ui-icon-close").live("click", function(event){
        var note = $(this).parents(".note");
        noteMe.jsRoutes.remove.ajax({
            data: {
                type: "note",
                id: note.data("id")
            },
            success: function(data) {
                if(note.data("id")===noteMe.opened.note.id) {
                    noteMe.opened.note.close();
                }
                noteMe.message.info("Poznámka \""+note.find(".title").text()+"\" bola zmazaná");
                note.slideUp("slow",function(){$(this).remove();});
            },
            error: function(err) {
                console.log(err);
            }
        });
    });

    $(".right-column #note-toolbar button").iconButton();
    
    
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
    $(".sharenote-button, .note .ui-icon-link").live("click",function() {
    	noteMe.jsRoutes.shareNote.ajax({
            data: {
                id: $(this).parents(".note").data("id")
            },
            dataType: "html",
            context: $("body"),
            success: function(data) {
                $(data).appendTo($(this)).dialog({
                    buttons: {
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
                var adder = $("#sharenote .add-multiple").adder({
                    inputLabel:"Pridať email používateľa",
                    addCheck: function(value,item) {
                        var self = this;
                        noteMe.jsRoutes.knownMail.ajax({
                            data: {
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
                                console.log(err);
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
                $("#sharenote form").submit(function(event) {
                    console.log(adder.adder("getValues"));
                    event.preventDefault();
                    console.log(JSON.stringify(adder.adder("getValues")));
                    noteMe.jsRoutes.sharing.ajax({
                        data: {
                            json: JSON.stringify(adder.adder("getValues")),
                            id: $(this).parents(".dialog").data("id"),
                            type: "note"
                        },
                        success: function(data) {
                            noteMe.message.info("Zdieľanie uložené")
                        },
                        error: function(err) {
                            console.log(err);
                            noteMe.message.error("Chyba pri ukladaní zdieľania");
                        }
                    });
                    //adder.adder("destroy");
                    $("#sharenote").dialog("close");
                }); 
                $("#sharenote #publicId").on("click",function(){
                    if($(this).is(":checked")){
                        noteMe.jsRoutes.sharePublic.ajax({
                            data: {
                                id: $(this).parents(".ui-dialog").find(".ui-dialog-content").data("id")
                            },
                            success: function(data) {
                                $("#sharenote #publicId-dest").text(data);
                                $("#sharenote #share-public").fadeIn();
                            },
                            error: function(err){
                                console.log(err);
                            }
                        });
                    } else {
                        noteMe.jsRoutes.unsharePublic.ajax({
                            data: {
                                id: $(this).parents(".ui-dialog").find(".ui-dialog-content").data("id")
                            },
                            success: function(){
                                $("#sharenote #publicId-dest").text("");
                                $("#sharenote #share-public").fadeOut();
                            },
                            error: function(err){
                                console.log(err);
                            }
                        });
                    }
                });
                $("#sharenote #publicId-dest").click(function(){$(this).selectText();});
            },
            error: function(err) {
                console.log(err);
                if(err.status===403){
                    noteMe.message.error("Túto poznámku nemôžete ďalej zdieľať");
                }
            }
    	});
    });


});

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


// adder

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
                $.noanim(function(){self.add(val,"default");});
            });
        },
        add : function(value,type) {
            var index = this.params.values.length,
                self = this,
                newItem;
            if(value===""){
                console.log($("#"+this.params.inputID));
                $("#"+this.params.inputID).addClass("ui-state-highlight").removeClass("ui-state-highlight",500);
                return;
            }
            this.params.values.push({value: value, type: type || "new"});
            newItem = $("<div>").text(value).addClass(this._internal.itemClass).button({
                icons: {
                    secondary: "ui-icon-close"
                }
            }).prependTo(this.params.added).hide();

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
            console.log(this.getValues());
        },
        getValues : function() {
            var newValues = [],
                removedValues = this.params.removed;
            for(i in this.params.values){
                if(this.params.values[i]){
                    newValues.push(this.params.values[i].value);
                }
            }
            return {
                "new" : newValues,
                removed: removedValues
            };
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

