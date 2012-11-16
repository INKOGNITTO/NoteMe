var noteMe = noteMe || {};

$(function() {

    // aplikacia :D

    (function() {
        var _self = this;
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
                    result.saved = false;
                    if(typeof cb === "function"){
                        cb.apply($(this),result);
                    }
                }).enterKey(function() {
                    result.saved = true;
                    $(this).blur();
                },"on").escKey(function() {
                    $(this).blur();
                },"on");

                $(this).attr("contenteditable",true).focus();
            }
        };
    }.apply(noteMe));

    // nacitaj routy
    $.ajax({
        url: "/jsRoutes",
        type: "GET",
        dataType: "script",
        cache: true
    });



    $.datepicker.setDefaults( $.datepicker.regional[ "sk" ] );

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
    $("#note-scroll").scrollbar().addClass("jspAlwaysShow");


    // vyska poznamky
    $("#about, .right-column > h2").on("resize", function() {
            var noteScroll = $("#note-scroll"),
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


    // vertikalna zmena velkosti
    $(".vertical-resize").mousedown(function(event) {
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
    }).dblclick(function() {
            //return to default value set by css
            $(this).parent().height("");
    }).disableSelection();;

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
        handle: ".handle",
        placeholder: "sortable-placeholder",
        forcePlaceholderSize: true
    });
    $(".notebook >  div").sortable({
        axis: "y",
        handle: ".handle",
        connectWith:".notebook > div",
        placeholder: "sortable-placeholder",
        forcePlaceholderSize: true
    });

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
        $(this).parents(".tag").hide('fast').promise().done(function(){$(this).remove()});
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
    $('.notebook h2 .title, .note .title, .right-column > h2').live("dblclick",noteMe.manage.rename);
    
    $("*[contenteditable='true']").live("click, focus", function() {
    	$(this).select();
    });
    

    $("#new-notebook").button({
        icons: {
            primary: "ui-icon-circle-plus"
        }
    }).click(function(event) {
        noteMe.jsRoutes.newNotebook.ajax({
            success : function(data) {
                var ad = $(data).prependTo($(".notebooks").first());
                noteMe.manage.rename.call($(ad).find("h2 .title"),function(saved) {
                    var self = this;
                    if(!saved) {
                        $(this).parents(".notebook").remove();
                        return;
                    }
                    noteMe.jsRoutes.saveNewNotebook.ajax({
                        data: {
                            name: $(this).text()
                        },
                        success: function(data){
                            $(self).parents(".notebook").attr("data-id",data);
                            console.log(data);
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

    $(".new-note").click(function(evnet) {
        var notebook = $(this).parents(".notebook");
           noteMe.jsRoutes.newNote.ajax({
            data: {
                notebookId: $(notebook).attr("data-id")
            },
            success: function(data) {
                console.log(data);
                $(notebook).children("div").prepend(data);
            },
            error: function(err) {
                console.log(err);
            }
           });
    });




    $(".note").click(function(){
        $(".right-column > h2").text($(this).text());
    }).find(".ui-icon").click(function(event){
        // neklikni, ak sa robil sort
        event.preventDefault();
        event.stopImmediatePropagation();
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
    $(".sharenote-button").click(function() {
    	$.ajax({
    		url: "sharenote",
    		type: "post",
    		dataType: "html",
    		context: $("body")
    	}).done(function(response) {
            $(response).appendTo($(this)).dialog({
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
}

// ikony tlacidiel
jQuery.fn.iconButton = function(options) {
	return this.each(function() {
		var opt = {},
			icons = {
				icons: {
					primary: jQuery(this).attr("data-ui-icon-primary"),
					secondary: jQuery(this).attr("data-ui-icon-secondary")
				}
		}
		jQuery.extend(true, opt, options?options:{}, icons);
		jQuery(this).button(opt);
	});
}

// scrollbary
jQuery.fn.scrollbar = function(){
	return this.each(function() {
		var self = this;
		// apply to this, to all children and parents
		$(this).add($(this).children()).add($(this).parents()).on("resize", function(event) {
			event.stopPropagation();
			$(self).jScrollPane({hideFocus:true});
		});
		$(this).jScrollPane();
		return $(this);
	});
}


$.fn.keydownCode = function(keyCode,callback,method) {
    return $(this)[method||"live"]("keydown",function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == keyCode) {
            callback.call(this, event);
        }
    });
}

$.fn.enterKey = function(cb,method) {
	    return $(this).keydownCode(13,cb,method);
}

$.fn.escKey = function(cb,method) {
        return $(this).keydownCode(27,cb,method);
}

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

