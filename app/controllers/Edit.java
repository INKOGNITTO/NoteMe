package controllers;

import com.google.gson.*;
import java.io.File;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import models.*;
import play.mvc.*;

@With(Secure.class)
public class Edit extends Controller {
    
    @Before(unless = "index")
    public static void checkNoteOwnership(long id){
        if(!Security.checkNoteOwnership(id)){
            forbidden();
        }
    }
    
    public static void index() {
        renderArgs.put("user", User.findByEmail(session.get("username")));
        render("edit.html");
    }
    
    public static void editNote(long id) {
        User user = User.findByEmail(session.get("username"));
        Note note = Note.findById(id);
        notFoundIfNull(note);
        renderArgs.put("note",note);
        render("snippets/noteEdit.html"); 
        
            
    }
    
    public static void saveNote(long id, String content) {
        List<Note> notes = User.findByEmail(session.get("username")).getAllNotes();

        if(notes.isEmpty() || !notes.contains((Note)Note.findById(id))) {
            forbidden("You do not have permission to save this note.");
        }
        Note note = Note.findById(id);
        note.content = content;
        note.updateDate = new Date();
        note.save();
        ok();
    }
    
    public static void imageUpload(Long id, File image) {
        Note note = Note.findById(id);
        NoteImage ni = new NoteImage(note, image);
        ni.save();
        JsonObject jsonImage = new JsonObject();
        JsonObject jsonResponse  = new JsonObject();
        Map<String, Object> args = new HashMap();
        args.put("uuid", ni.uuid);
        jsonImage.addProperty("url", Router.reverse("App.getNoteImage",args).url);
        jsonImage.addProperty("fullUrl", Router.getFullUrl("App.getNoteImage", args));
        jsonImage.addProperty("name", ni.name);
        jsonImage.addProperty("width", ni.width);
        jsonImage.addProperty("height",ni.height);
        jsonResponse.add("image", jsonImage);
        renderJSON(jsonResponse.toString());
    }
    

}
