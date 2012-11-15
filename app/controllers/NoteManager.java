package controllers;

import models.Note;
import models.Notebook;
import models.User;
import play.mvc.*;

import java.util.Map;

@With(Secure.class)
public class NoteManager extends Controller {
  
    public static void index() {
        render("manage.html",User.findByEmail(session.get("user")));
    }
    
    public static void sharenote() {
	    render("dialogs/sharenote.html");
    }

    public static void newNotebook() {
        render("items/notebook.html",
            new Notebook("Nový poznámkový blok",User.findByEmail(session.get("user")))
        );
    }

    public static void saveNewNotebook() {
        /*Map<String, String[]> nb = request.body.asFormUrlEncoded();
        User user = User.findByEmail(session().get("user"));
        Notebook notebook = Notebook.create(nb.get("name")[0],
                user.id);
        user.notebooks.add(0,notebook);
        user.saveManyToManyAssociations("notebooks");
        return ok(String.valueOf(notebook.id)); */
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
