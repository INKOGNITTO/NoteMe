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
                renderText(((Note) Note.findById(id)).rename(newName));
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
            //renderText(((Notebook) Notebook.findById(id)).);
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
        
    }
    
    public static void search(String exp) {
        
        User usr = User.findByEmail(session.get("username"));
        List<Notebook> nb = usr.notebooks;
        List<Tag> usrTags = usr.getTags();
        List<Tag> matchTags = Tag.find("name like ?", exp).fetch();
        List<Note> userNotes = usr.getAllNotes();
        List<Note> out = new ArrayList<Note>();
        
        System.out.println("-----serach--------" + usr.name + ": " + exp);
        GenericModel.JPAQuery jpaq = Note.find("name like ? or content like ?", "%" + exp + "%", "%" + exp + "%");
        List<Note> ol = jpaq.fetch();
        
        for (Tag t1 : usrTags) {
            System.out.println("user> " + t1.name + "(" + t1 + ")");
        }
        System.out.println("......");
        for (Tag t2 : matchTags) {
            System.out.println("match> " + t2.name + "(" + t2 + ")");
        }
        System.out.println("......");
        matchTags.retainAll(usrTags);
        for (Tag t2 : matchTags) {
            System.out.println("retain> " + t2.name + "(" + t2 + ")");
        }
        System.out.println("");
        
        for (Note o : ol) {
            System.out.println("enterning note> " + o.name);
            for (Notebook n : nb) {
                if (o.notebooks.contains(n)) {
                    System.out.println("obj_NB> " + o.name + "(" + o.id + ")");
                    out.add(o);
                } else {
                    System.out.println("not> false on NB check");
                }
            }
        }
        for (Note o : userNotes) {
            for (Tag t : matchTags) {
                if (o.tags.contains(t) && !out.contains(o)) {
                    System.out.println("obj_TG> " + o.name + "(" + o.id + ")");
                    out.add(o);
                } else {
                    System.out.println("NOT> " + o.name + " " + o.tags.contains(t) + " " + t.name + " " + !out.contains(o));
                }
            }
            System.out.println(".....");
            for (Note no : out) {
                System.out.println("put> " + no.name + "(" + no.id + ")");
            }
        }
        
        
        System.out.println("------end-------");
        
    }
}
