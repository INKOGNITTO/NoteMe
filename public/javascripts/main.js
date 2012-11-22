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
                position:{my:"center top+2", at:"center top",collision:"none"},
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
        this.showNoteHooks = [];
        this.showNote = function(noteId){
            //window.location.hash = noteId;
            if($("body").hasClass("section-edit")){
                noteMe.jsRoutes.editNote.ajax({
                    urlParams: {
                        id: noteId
                    },
                    beforeSend: function() {
                        noteMe.edit.removeAllInstances();
                    },
                    success: function(data){
                        $(".right-column").first().html(data);
                        noteMe.edit.init();

                    },
                    error: function(err) {
                        console.log(err);
                    }
                });
            } else if($("body").hasClass("section-manage")){
                noteMe.jsRoutes.viewNote.ajax({
                    urlParams: {
                        id: noteId
                    },
                    success: function(data){
                        $(".right-column").first().html(data);
                        $(".right-column button, .right-column a").iconButton();
                        for (var i in noteMe.showNoteHooks){
                            noteMe.showNoteHooks[i]();
                        }
                    },
                    error: function(err) {
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
                editorInstances = [],
                editor = null,
                createEditor = function(){
                    return new nicEditor({
                        onSave: function(c){
                            console.log("ukladanie.....");
                            console.log(c);
                            console.log(editorSpace.html());
                            console.log($(".right-column h2").attr("data-id"));
                            noteMe.jsRoutes.saveNote.ajax({
                                data: {
                                    id: $(".right-column h2").attr("data-id"),
                                    content: $("#editor-space").html()
                                },
                                success: function(data) {
                                    console.log(data);
                                },
                                error: function(err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
                },
                blockCount = null;
                
            editor = createEditor();    
        
            return {
                removeAllInstances: function(){
                    for(var i in editorInstances){
                        editor.removeInstance(editorInstances[i].attr("id"));
                        blockCount = null;
                    }
                },
                createBlock : function(x,y) {
                    blockCount = blockCount || editorSpace.find(".note-block").length;
                    blockCount++;
                    var block = $("<div>").addClass("note-block").attr("id","note-block-"+blockCount),
                        handle = $("<div>").addClass("handle"),  
                        wrapper = $("<div>").addClass("note-block-wrapper").append(handle).append(block).addClass("ui-corner-all");
                    editorSpace.append(wrapper);
                    wrapper.position({
                        my: "left-5 center",
                        at: "left top",
                        offset: x + " " + y,
                        of: document    ,
                        collision:"none"
                    }).draggable({
                        cancel: ".note-block",
                        handle: "> .handle",
                        grid: [10,10]
                    }).resizable({
                        handles: "e,w",
                        maxWidth:1500,
                        grid: [10,10],
                        resize: function(event, ui) {
                            ui.element.css({height:"",maxWidth:1500});
                        }
                    });
                    editor.addInstance(block.attr("id"));
                    editorInstances.push(block);
                    return block;
                },
                init: function() {
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

                    editorSpace.click(function(e){
                        if(e.target!==this){
                            e.stopPropagation();
                            return;
                        }
                        noteMe.edit.createBlock(e.pageX,e.pageY).focus();
                    }); 
                }
            }
        }());
        this.message = {
            info: gtFunction(""),
            error: gtFunction("ui-state-error")
        };
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
                start: function(){
                    elem.attr("src",animUrl);
                },
                stop: function(){
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
        var button = $("<button>").text($(this).val()),
            submit = this;
        $(this).parent().append(button);
        $(button).button({
            icons: {
                primary: "ui-icon-search"
            },
            text: false
        });
        $(this).hide();
    });
    $("#new-notebook").button({
        icons: {
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
            .bind("ajaxComplete", noteMe.loadAnim.stop);
    
    
    
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
        _default: function() {
            return false;
        },
        _data: function(data) {
            noteMe.showNote(parseInt(data,10));
        }
    
    };

    $(window).bind("hashchange",hashChange);

    hashChange(null,true);
    
    $.datepicker.setDefaults( $.datepicker.regional[ "sk" ] );

    $("form#search").submit(function(){
        console.log("hľadané "+$(this).find("input[type='search']").val());
        return false;
    });

    //iconbar
    /*$(".notebook .note .iconbar").each(function() {
            $(this).css({
                    paddingTop: ($(this).parent().height() - $(this).children().height())/2 + 1,
                    right: -$(this).outerWidth()+40,
            }).hover(function() {
                    $(this).animate({right:0});
            }, function() {
                    $(this).animate({right:-$(this).outerWidth()+40});
            });
    })*/

    // scrollbary
    $("#left-column-scroll").scrollbar();
    $(".sidebar-wrapper").scrollbar();
    $("#notetags").scrollbar();
    //$("#note-scroll").scrollbar().addClass("jspAlwaysShow");


    // vyska poznamky
    var noteResize = function() {
        $("#about, .right-column > h2").on("resize",function(){
            console.log("alskmda");
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
        forcePlaceholderSize: true,
        update: function(event, ui) {
            console.log(ui.item, ui.item.parent());
            console.log(ui.item.parent().children().index(ui.item));
            noteMe.jsRoutes.orderNotebooks.ajax({
                data: {
                    notebookId: ui.item.attr("data-id"),
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
                    noteId: ui.item.attr("data-id"),
                    fromNotebookId: sourceNotebook?sourceNotebook.attr("data-id"):-1,
                    toNotebookId: targetNotebook.attr("data-id"),
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

    $("#tag-sidebar").sortable({
        axis: "y",
        items: ".tag",
        placeholder: "sortable-placeholder",
        forcePlaceholderSize: true,
        disabled: true,
        stop: function(event, ui) {
            $("#tag-sidebar .tag").draggable("option","disabled",false);
            $("#tag-sidebar").sortable("option","disabled",true);
        }
    });


    $("#tag-sidebar .tag").draggable({
        helper: "clone",
        appendTo: "body",
        revert: "invalid",
        connectToSortable: "#tag-sidebar",
        snapMode: "inner",
        snap: ".note",
        snapTolerance: 5
    });

    $("#tag-sidebar .tag .ui-icon-grip-dotted-vertical").mousedown(function() {
        $("#tag-sidebar .tag").draggable("option","disabled",true);
        $("#tag-sidebar").sortable("option","disabled",false);
    });
    
    $("#notetags .tag .ui-icon-close").click(function() {
        $(this).parents(".tag").hide('fast').promise().done(function(){$(this).remove();});
    });

    $(".note").droppable({
        accept: ".tag",
        hoverClass: "ui-state-active",
        drop: function(event, ui) {
            $(this).addClass("ui-state-highlight").removeClass("ui-state-highlight",1000);
        }
    });
    
    // nova znacka
    $(".new-tag").click(function() {
    	$(this).removeClass("closed").find("input").show("slow").focus();
    });
    $(".new-tag input").enterKey( function() {
    	console.log("vytvaram novu znacku s nazvom " + $(this).val());
    }).escKey(function() {
    	$(this).val("").hide("slow").promise().done(function() {
    		$(this).parents(".new-tag").addClass("closed");
    	});
    	console.log("rusim vytvaranie novej znacky");
    });

    
    // premenovania
    $('.notebook h2 .title, .note .title, .right-column > h2').live("dblclick",function() {
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
                    id: self.parents("."+type).attr("data-id"),
                    newName: self.text()
                },
                success: function(data){
                    console.log("premenovane",data);
                },
                error: function(err) {
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
                notebookId: $(notebook).attr("data-id")
            },
            success: function(data) {
                var note = $(data).prependTo($(notebook).children("div.notes").first());
                noteMe.manage.rename.call($(note).find("span.title"), function(result) {
                    var self = this;
                    console.log(result.saved);
                    if (!result.saved) {
                        $(note).remove();
                        return;
                    }
                    noteMe.jsRoutes.saveNewNote.ajax({
                        data: {
                            notebookId: $(notebook).attr("data-id"),
                            name: $(this).text()
                        },
                        success: function(data) {
                            $(self).parents(".note").attr("data-id",data);
                            noteMe.message.info("Vytvorená poznámka \""+self.text()+"\"");
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

    



    $(".note").live("click",function(){
        window.location.hash=$(this).attr("data-id");
        //noteMe.showNote($(this).attr("data-id"));
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
                id: note.attr("data-id")
            },
            success: function(data) {
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
    // tlacidlo pod poznamkou
    $(".sharenote-button").live("click",function() {
    	noteMe.jsRoutes.shareNote.ajax({
            data: {
                id: $(this).parents(".right-column").find("h2").attr("data-id")
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
                $("#sharenote .add-multiple").adder({inputLabel:"Pridať email používateľa"});
                $("#sharenote #share-public").hide();
                $("#sharenote input[type='checkbox']").click(function(){
                    $("#sharenote #share-public").fadeIn();
                });
                $("#sharenote form").submit(function(event) {
                    console.log("posiela sa zdielanie");
                    event.preventDefault();
                    $("#sharenote").dialog("close");
                }); 
            }
    	});
    });


});

/* ========= jQuery extensions ========= */

jQuery.fn.singleDoubleClick = function(single_click_callback, double_click_callback, timeout) {
    var clicks = 0;
    jQuery(this.selector).live("singleClick",single_click_callback).live("doubleClick",double_click_callback);
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

$.noanim = function(action) {
    var fx = jQuery.fx.off,
        returnValue;
    jQuery.fx.off = true;
    returnvalue = action();
    jQuery.fx.off = fx;
    return returnValue;
}


// adder

$(function(){
    var adderPrototype = {
        options : {
            inputLabel: "Add",
            size: 3,
            addCheck : null
        },
        _internal : {
            values: [],
            adder : null,
            added : null,
            inputID : null,
            itemClass : "ui-adder-item"
        },
        _init : function() {
            var element = $(this.element),
                self = this,
                adder,
                added,
                inputID = "input-add-"+this.uuid;

            adder = $("<div>").addClass("ui-adder-adder"),
            added = $("<div>").addClass("ui-adder-added");

            this._internal.adder = adder;
            this._internal.added = added;
            this._internal.inputID = inputID;

            $("<label>").text(this.options.inputLabel).appendTo(adder);
            $("<input>").attr("id",inputID).attr("type","email").appendTo(adder);
            adder.append("&nbsp;");
            $("<button>").text(this.options.inputLabel).appendTo(adder).button({
                icons: {
                    primary: "ui-icon-plus"
                },
                text: false
            }).click(function(event) {
                event.preventDefault();
                self.add($("#"+inputID).val());
            });



            adder.prependTo(element);
            $("<div class='ui-adder-added-scroll'>").appendTo(element).append(added);

            element.addClass("ui-adder");
        },
        add : function(value) {
            var index = this._internal.values.length,
                self = this,
                newItem;
            if(value===""){
                $("#"+this._internal.inputID).addClass("ui-state-highlight").removeClass("ui-state-highlight",500);
                return;
            }
            if(this.options.addCheck && !this.options.addCeck()){
                var addCheck = this.options.addCeck();
                if(addCheck){
                    return addCheck;
                }
            }
            this._internal.values.push(value);
            newItem = $("<div>").text(value).addClass(this._internal.itemClass).button({
                icons: {
                    secondary: "ui-icon-close"
                }
            }).prependTo(this._internal.added)
            .slideDown("slow");

            $(newItem).find(".ui-icon-close").click(function(event) {
                self._internal.values[index] = null;
                $(this).parent().remove();
                console.log(self.getValues());
                event.preventDefault();
            });

            $("#"+this._internal.inputID).val("");
        },
        remove : function() {

        },
        getValues : function() {
            var val = [];
            for(i in this._internal.values){
                if(this._internal.values[i]){
                    val.push(this._internal.values[i]);
                }
            }
            return val;
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

