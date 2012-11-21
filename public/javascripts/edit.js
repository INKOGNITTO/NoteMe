$(function() {
	
    var editorPanel = $("#editor-panel"),
        editorSpace = $("#editor-space"),
        editor = new nicEditor(),
        blockCount = null,
        createBlock = function(x,y) {
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
            return block;
        }
    
    // zatial neviem co s tym
        //editorContainer.scrollbar();

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
	createBlock(e.pageX,e.pageY).focus();
    });
    
});


