package controllers;

import models.Note;
import models.Notebook;
import models.User;
import play.mvc.*;

import java.util.Map;
import play.Play;

@With(Secure.class)
public class NoteManager extends Controller {
  
    public static void index() {
        /*Notebook nb = Notebook.create("Pokus", User.findByEmail(session.get("username")).getId());
        User u = User.findByEmail(session.get("username"));
        u.notebooks.add(nb);
        u.save();*/
        renderArgs.put("user", User.findByEmail(session.get("username")));
        render("manage.html");
    }
    
    public static void shareNote() {
	    render("dialogs/sharenote.html");
    }

    public static void newNotebook() {
        renderArgs.put("notebook",
                new Notebook(Play.configuration.getProperty("notebook.defaultName"),
                    User.findByEmail(session.get("username"))));
        render("tags/notebook.html");
    }

    public static void saveNewNotebook() {
        User user = User.findByEmail(session.get("username"));
        Notebook notebook = Notebook.create(params.get("name"), user.id);
        user.notebooks.add(0,notebook);  // novy blok treba pridat na zaciatok zoznamu
        user.save();
        renderText(notebook.id);
    }

    public static void newNote() {
        try {
            Long nbid = Long.valueOf(params.get("notebookId")).longValue();
            renderArgs.put("note",
                    new Note(Play.configuration.getProperty("note.defaultName"),
                        nbid, User.findByEmail(session.get("username"))));
            render("tags/note.html");
        } catch (Exception e) {
            error(Http.StatusCode.BAD_REQUEST,"Error while creating new note");
        }
    }

    public static void saveNewNote() {
        User user = User.findByEmail(session.get("username"));
        try {
            Long nbid = Long.valueOf(params.get("notebookId")).longValue();
            Note note = Note.create(params.get("name"), nbid, user.id);
            Notebook notebook = Notebook.findById(nbid);
            notebook.notes.add(0,note);
            notebook.save();
            note.save();
        } catch (Exception e) {
            error(Http.StatusCode.BAD_REQUEST,"Error while creating new note");
        }
    }

}
