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
import play.db.jpa.JPA;
import play.mvc.*;

@With(Secure.class)
public class Share extends Controller {

    /**
     * Dialogove okno zdielania poznamok
     */
    public static void shareNote(long id) {
        if (!Security.checkNoteOwnership(id)) {
            forbidden();
        }
        Note note = Note.findById(id);
        
        //TODO: json vrati vsetkych sharewith<user> - ich emailov a odosle (render)
//        Gson jshareWith = new GsonBuilder().create();
        //jshareWith.toJson(note.sharedWith, array);
        
     //   renderArgs.put("jshareWith",jshareWith);
        renderArgs.put("note", note);
        render("dialogs/sharenote.html");
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
        note.isPulbic = true;
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
        JsonArray jsonArray = jsonElement.getAsJsonArray();
        User user;

        if (type.equals("note")) {
            Note note = Note.findById(id);
            note.sharedWith.clear();
            for (int i = 0; i < jsonArray.size(); i++) {
                user  = User.findByEmail(jsonArray.get(i).getAsString());
                note.sharedWith.add(user);
                if(user.defaultNbSharedNotes==null){
                    user.defaultNbSharedNotes = Notebook.create("Zdieľané", user.id);
                    user.notebooks.add(user.defaultNbSharedNotes);
                    user.save();
                }
                user.defaultNbSharedNotes.notes.add(note);
                user.defaultNbSharedNotes.save();
            }
            note.save();
        }

        if (type.equals("notebook")) {
            Notebook notebook = Notebook.findById(id);

            for (int i = 0; i < jsonArray.size(); i++) {
                user  = User.findByEmail(jsonArray.get(i).getAsString());
                notebook.contributors.add(user);
            }
            notebook.save();
        }
    }
    
}
