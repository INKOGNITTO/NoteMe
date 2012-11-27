package controllers;

import java.util.List;
import models.Note;
import models.Notebook;
import models.Tag;
import models.User;
import models.Tag;
import play.Logger;
import play.Play;
import play.db.jpa.GenericModel;
import play.mvc.*;

@With(Secure.class)
public class NoteManager extends Controller {

    public static void index() {
        renderArgs.put("user", User.findByEmail(session.get("username")));
        render("manage.html");
    }

    public static void viewNote(long id) {
        notFoundIfNull(Note.findById(id));
        renderArgs.put("note", Note.findById(id));
        render("tags/noteDetail.html");
    }

    public static void newNotebook() {
        renderArgs.put("notebook",
                new Notebook(Play.configuration.getProperty("notebook.defaultName"),
                User.findByEmail(session.get("username"))));
        render("tags/notebook.html");
    }

    public static void saveNewNotebook(String name) {
        User user = User.findByEmail(session.get("username"));
        Notebook notebook = Notebook.create(name, user.id);
        user.notebooks.add(0, notebook);  // novy blok treba pridat na zaciatok zoznamu
        user.save();
        renderText(notebook.id);
    }

    public static void saveNewTag(String name) {
        User user = User.findByEmail(session.get("username"));
        Tag tag = Tag.create(name, user.id);
        renderArgs.put("tag", tag);
        render("tags/tag.html");
    }

    public static void newNote() {
        try {
            Long nbid = Long.valueOf(params.get("notebookId")).longValue();
            renderArgs.put("note",
                    new Note(Play.configuration.getProperty("note.defaultName"),
                    nbid, User.findByEmail(session.get("username"))));
            render("tags/note.html");
        } catch (Exception e) {
            error(Http.StatusCode.BAD_REQUEST, "Error while creating new note");
        }
    }

    public static void saveNewNote() {
        User user = User.findByEmail(session.get("username"));
        //try {
        Long nbid = Long.valueOf(params.get("notebookId")).longValue();
        Note note = Note.create(params.get("name"), nbid, user.id);
        Notebook notebook = Notebook.findById(nbid);
        notebook.notes.add(0, note);
        notebook.save();
        note.save();
        renderText(note.id);
        /*} catch (Exception e) {
         error(Http.StatusCode.BAD_REQUEST, e.);
         //error(Http.StatusCode.BAD_REQUEST, "Error while creating new note");
         }*/
    }

    public static void orderNotebooks(long notebookId, int newPosition) {
        User user = User.findByEmail(session.get("username"));
        try {
            List<Notebook> usrNtb = user.notebooks;
            Notebook dump = Notebook.findById(notebookId);
            usrNtb.remove(dump);
            if (dump != null) {
                usrNtb.add(newPosition, dump);
            }
            user.save();
        } catch (Exception ex) {
            error(Http.StatusCode.BAD_REQUEST, "Error while reordering notebooks");
        }
    }

    public static void orderNotes(long noteId, long toNotebookId, long fromNotebookId, int newPosition) {
        try {
            User user = User.findByEmail(session.get("username"));
            Notebook destinationNotebook = Notebook.findById(toNotebookId);
            Notebook sourceNotebook = destinationNotebook;
            Note note = Note.findById(noteId);

            if (fromNotebookId > 0) {
                sourceNotebook = Notebook.findById(fromNotebookId);
            }

            if (!user.notebooks.contains(destinationNotebook) || !user.notebooks.contains(sourceNotebook)) {
                error(Http.StatusCode.FORBIDDEN, "No access");
            }

            sourceNotebook.notes.remove(note);
            sourceNotebook.save();
            destinationNotebook.notes.add(newPosition, note);
            destinationNotebook.save();

        } catch (Exception ex) {
            error(Http.StatusCode.BAD_REQUEST, "Error while reordering notes");
        }
    }

    public static void rename(String type, Long id, String newName) {
        if (type.equals("notebook")) {
            renderText(((Notebook) Notebook.findById(id)).rename(newName));
        } else if (type.equals("note")) {
            renderText(((Note) Note.findById(id)).rename(newName));
        } else if (type.equals("tag")) {
            renderText(((Tag) Tag.findById(id)).rename(newName));
        }
        error(Http.StatusCode.BAD_REQUEST, "Bad object type");
    }

    public static void remove(String type, Long id) {
        if (type.equals("notebook")) {
            //renderText(((Notebook) Notebook.findById(id)).);
        } else if (type.equals("note")) {
            ((Note) Note.findById(id)).remove();
        } else if (type.equals("tag")) {
            ((Tag) Tag.findById(id)).remove();
        } else {
            error(Http.StatusCode.BAD_REQUEST, "Bad object type");
        }
    }
}
