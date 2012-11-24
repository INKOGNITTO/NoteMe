package controllers;

import models.Note;
import play.mvc.Controller;


public class PublicNote extends Controller {
    
    public static void index(String uuid) {
        Note note = Note.findByPublicId(uuid);
        notFoundIfNull(note);
        renderArgs.put("note", note);
        render("publicNote.html");
    }
    
}
