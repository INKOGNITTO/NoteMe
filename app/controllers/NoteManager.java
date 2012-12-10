package controllers;

import java.util.ArrayList;
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
        if(Security.checkNoteAccessibility(id)){
            renderArgs.put("note", Note.findById(id));
            render("snippets/noteDetail.html");
        } else {
            forbidden();
        }
    }
    
    public static void newNotebook() {
        renderArgs.put("notebook",
                new Notebook(Play.configuration.getProperty("notebook.defaultName"),
                User.findByEmail(session.get("username"))));
        render("snippets/notebook.html");
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
        render("snippets/tag.html");
    }
    
    public static void newNote() {
        try {
            Long nbid = Long.valueOf(params.get("notebookId")).longValue();
            renderArgs.put("note",
                    new Note(Play.configuration.getProperty("note.defaultName"),
                    nbid, User.findByEmail(session.get("username"))));
            render("snippets/note.html");
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
        //notebook.notes.add(0, note);
        notebook.addNote(note, 0);
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
            
            //sourceNotebook.notes.remove(note);
            sourceNotebook.removeNote(note);
            sourceNotebook.save();
            //destinationNotebook.notes.add(newPosition, note);
            destinationNotebook.addNote(note, newPosition);
            destinationNotebook.save();
            
        } catch (Exception ex) {
            error(Http.StatusCode.BAD_REQUEST, "Error while reordering notes");
        }
    }
    
    public static void addTagToNote(Long noteId, Long tagId) {
        Note note = (Note) Note.findById(noteId);
        note.tags.add((Tag) Tag.findById(tagId));
        note.save();
        
    }
    
    public static void rename(String type, Long id, String newName) {
        if (!newName.isEmpty()) {
            if (type.equals("notebook")) {
                renderText(((Notebook) Notebook.findById(id)).rename(newName));
            } else if (type.equals("note")) {
                if(Security.checkNoteOwnership(id)){
                    renderText(((Note) Note.findById(id)).rename(newName));
                } else {
                    forbidden();
                }
            } else if (type.equals("tag")) {
                renderText(((Tag) Tag.findById(id)).rename(newName));
            }
            error(Http.StatusCode.BAD_REQUEST, "Bad object type");
        } else {
            error(Http.StatusCode.BAD_REQUEST, "Empty name");
        }
    }
    
    public static void remove(String type, Long id) {
        if (type.equals("notebook")) {
            if(Security.checkNotebookOwnership(id)) {
                ((Notebook) Notebook.findById(id)).remove();
            } else {
                forbidden();
            }
        } else if (type.equals("note")) {
            ((Note) Note.findById(id)).remove();
        } else if (type.equals("tag")) {
            ((Tag) Tag.findById(id)).remove();
        } else {
            error(Http.StatusCode.BAD_REQUEST, "Bad object type");
        }
    }
    
    public static void removeTagFromNote(Long noteId, Long tagId) {
        ((Tag) Tag.findById(tagId)).removeFromNote(noteId);
        // ak je odstranena posledna znacka, posli info pre odstranenie ikony z poznamkys
        if(((Note)Note.findById(noteId)).getOwnedTags().isEmpty()){
            renderText("lastTagRemoved");
        }
    }
    
    public static void search(String exp) {
        
        User usr = User.findByEmail(session.get("username"));
        List<Tag> matchTags = Tag.find("name like ?", exp).fetch();
        matchTags.retainAll(usr.getTags());
        List<Long> out = new ArrayList<Long>();
        GenericModel.JPAQuery jpaq = Note.find("name like ? or content like ?", "%" + exp + "%", "%" + exp + "%");
        List<Note> ol = jpaq.fetch();
        
        for (Note o : ol) {
            for (Notebook n : usr.notebooks) {
                if (o.notebooks.contains(n)) {
                    out.add(o.id);
                }
            }
        }
        for (Note o : usr.getAllNotes()) {
            for (Tag t : matchTags) {
                if (o.tags.contains(t) && !out.contains(o)) {
                    out.add(o.id);
                }
            }
        }
        renderJSON(out);
    }
    
    public static void searchForTags(Long id) {
        Tag tag = Tag.findById(id);
        List<Note> notes = User.findByEmail(session.get("username")).getAllNotes();
        List<Long> out = new ArrayList<Long>();
        for (Note nt : notes) {
            if (nt.tags.contains(tag)) {
                out.add(nt.id);
            }
        }
        renderJSON(out);
    }
}
