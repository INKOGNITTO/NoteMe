package controllers;

import models.Note;
import models.Notebook;
import models.User;
import play.mvc.*;

import java.util.Map;

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
    
    public static void sharenote() {
	    render("dialogs/sharenote.html");
    }

    public static void newNotebook() {
        renderArgs.put("notebook", new Notebook("Nový poznámkový blok",User.findByEmail(session.get("username"))));
        render("tags/notebook.html");
    }

    public static void saveNewNotebook() {
        User user = User.findByEmail(session.get("username"));
        Notebook notebook = Notebook.create(params.get("name"), user.id);
        user.notebooks.add(0,notebook);
        user.save();
        renderText(notebook.id);
    }

    public static void newNote() {
        /*try {
            Long nbid = Long.valueOf(request().body().asFormUrlEncoded().get("notebookId")[0]).longValue();
            return ok(note.render(
                    new Note("Nová poznámka", nbid, User.findByEmail(session().get("user")).id)
            ));
        } catch (Exception e) {
            return badRequest();
        }*/
    }

    public static void saveNote() {
        /*Map<String, String[]> noteData = request().body().asFormUrlEncoded();
        Long nbid = Long.valueOf(noteData.get("notebookId")[0]).longValue();
        Note note =  Note.create(noteData.get("name")[0], nbid, User.findByEmail(session().get("user")).id);
        return ok(String.valueOf(note.id));*/
    }

}
