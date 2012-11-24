package controllers;

import java.util.Date;
import java.util.List;
import javax.persistence.Query;
import models.*;
import play.Logger;
import play.db.jpa.JPA;
import play.mvc.*;

@With(Secure.class)
public class Edit extends Controller {
    
    public static void index() {
        renderArgs.put("user", User.findByEmail(session.get("username")));
        render("edit.html");
    }
    
    public static void editNote(long id) {
        User user = User.findByEmail(session.get("username"));
        Note note = Note.findById(id);
        notFoundIfNull(note);
        if(!user.getAllNotes().contains(note)){
            forbidden("You do not have permission to edit this note.");
        }
        renderArgs.put("note",note);
        render("tags/noteEdit.html");     
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

}
