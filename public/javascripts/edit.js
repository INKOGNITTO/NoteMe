$(function() {
	
    var editorPanel = $("#editor-panel"),
        editorSpace = $("#editor-space"),
        editorContainer = $("#editor-scroll"),
        editor = new nicEditor(),
        blockCount = null,
        createBlock = function(x,y) {
            blockCount = blockCount || editorSpace.find(".note-block").length;
            var block = $("<div>").addClass("note-block").attr("id","note-block-"+blockCount),
                wrapper = $("<div>").addClass("note-block-wrapper").append(block);
            editorSpace.append(wrapper);
            wrapper.css({
                left: x,
                top: y,
                border: "1px solid black",
                position:"absolute",
                width:100,
                height:100
            });
        }
    
    // zatial neviem co s tym
        //editorContainer.scrollbar();

    editor.setPanel(editorPanel.attr("id"));
    
    createBlock(50,500);
    
    


});


