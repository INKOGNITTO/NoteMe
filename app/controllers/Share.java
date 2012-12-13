/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import com.google.gson.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.persistence.Query;
import models.*;
import play.Logger;
import play.Play;
import play.db.jpa.JPA;
import play.mvc.*;

@With(Secure.class)
public class Share extends Controller {

    /**
     * Dialogove okno zdielania poznamok
     */
    public static void shareNote(long id) {
        if (!Security.checkNoteAccessibility(id)) {
            forbidden();
        }
        Note note = Note.findById(id);
        renderArgs.put("note", note);
        render("dialogs/sharenote.html");
    }
    
    public static void shareNotebook(long id) {
        if(!Security.checkNotebookOwnership(id)) {
            forbidden();
        }
        Notebook notebook = Notebook.findById(id);
        renderArgs.put("notebook", notebook);
        render("dialogs/sharenotebook.html");
    }

    public static void sharePublic(long id) {
        if (!Security.checkNoteOwnership(id)) {
            forbidden();
        }
        Note note = Note.findById(id);
        String uuid;
        if (note.publicID == null || note.publicID.isEmpty()) {
            uuid = note.generatePublicId();
        } else {
            uuid = note.publicID;
        }
        note.isPublic = true;
        note.save();
        Map<String, Object> arg = new HashMap<String, Object>();
        arg.put("uuid", uuid);
        renderText(Router.getFullUrl("PublicNote.index", arg).toString());
    }

    public static void unsharePublic(long id) {
        if (!Security.checkNoteOwnership(id)) {
            forbidden();
        }
        ((Note) Note.findById(id)).unsharePublicId();
    }

    public static void knownMail(String email) {
        if (User.findByEmail(email) == null) {
            renderText("notfound");
        } else {
            renderText("found");
        }
    }

    public static void sharing(String json, Long id, String type) {
        JsonElement jsonElement = new JsonParser().parse(json);
        JsonObject jsonObject = jsonElement.getAsJsonObject();
        JsonArray arrayNew = jsonObject.getAsJsonArray("new");
        JsonArray arrayRemoved = jsonObject.getAsJsonArray("removed");
        User user;

        if (type.equals("note")) {
            Note note = Note.findById(id);
            
            if (!Security.checkNoteAccessibility(id)) {
                forbidden();
            }

            //vymazanie pouzivatelov z note.shareddWidth
            for (int i = 0; i < arrayRemoved.size(); i++) {
                user = User.findByEmail(arrayRemoved.get(i).getAsString());
                note.sharedWith.remove(user);
                //odstranenie z notebooku od nevlastnika
                Query q = JPA.em().createQuery("select notebook from Notebook notebook where :u = notebook.owner and :n member of notebook.notes")
                        .setParameter("u", user)
                        .setParameter("n", note);
                Notebook notebook = (Notebook) q.getSingleResult();
                //notebook.notes.remove(note);
                notebook.removeNote(note);
                notebook.save();
                
            }

            for (int i = 0; i < arrayNew.size(); i++) {
                if (arrayNew.get(i).getAsString().equals(session.get("username")) || arrayNew.get(i).getAsString().equals(note.owner.email)) {
                    continue;  // pouzivatel nemoze zdielat poznamku sam so sebou a nikto nemoze vyzdielat poznamku spat vlastnikovi
                }
                user = User.findByEmail(arrayNew.get(i).getAsString());
                note.sharedWith.add(user);
                // ak pouzivatel nema defaultny notebook pre zdielanie, tak sa mu to vytvori
                if (user.defaultNbSharedNotes == null) {
                    user.defaultNbSharedNotes = Notebook.create(Play.configuration.getProperty("notebook.defaultShareName"), user.id);
                    user.notebooks.add(user.defaultNbSharedNotes);
                    user.save();
                }
                //pridanie poznamy do defaultneho notebooka
                //user.defaultNbSharedNotes.notes.add(note);
                user.defaultNbSharedNotes.addNote(note, -1);
                user.defaultNbSharedNotes.save();
            }
            note.save();
        }

        if (type.equals("notebook")) {
            Notebook notebook = Notebook.findById(id);

            if (!Security.checkNotebookOwnership(notebook.getId())) {
                forbidden();
            }
            
            
            for(int i=0; i<arrayRemoved.size(); i++){
                user = User.findByEmail(arrayRemoved.get(i).getAsString());
                //najst NB vlastnik user a notebook ma nalinkovany notebook
                Query q = JPA.em().createQuery("select notebook from Notebook notebook where :u member of notebook.owner and notebook.linkParent = :ntb")
                        .setParameter("u", user)
                        .setParameter("ntb", notebook);
                List<Notebook> notebookResult = q.getResultList();
                for (Notebook nb: notebookResult) {
                    notebook.unlinkNotebook(nb);
                }
                
            }
            
            
            for (int i=0; i<arrayNew.size(); i++){
                if (arrayNew.get(i).getAsString().equals(session.get("username"))) {
                    continue;  // pouzivatel nemoze zdielat blok sam so sebou
                }
                //novy NB (nazov rovnaky, vlastnik z arrrayNew)
                user = User.findByEmail(arrayNew.get(i).getAsString());
                Notebook newNb = Notebook.create(notebook.name, user.getId());
                user.notebooks.add(newNb);
                user.save();
                notebook.linkNotebook(newNb);
                
            }
            notebook.save();
            
//            for (int i = 0; i < arrayNew.size(); i++) {
//                user = User.findByEmail(arrayNew.get(i).getAsString());
//                //kontrola duplicity
//                if (!notebook.contributors.contains(user)) {
//                    user.notebooks.add(notebook);
//                    user.save();
//                }
//            }
        }
    }
}
