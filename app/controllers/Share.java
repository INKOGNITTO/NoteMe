/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import com.google.gson.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        //json vrati vsetkych sharewith<user> a odosle (render)
        renderArgs.put("note", Note.findById(id));
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

        if (type.equals("note")) {
            Note note = Note.findById(id);
            
            //TODO: premazat notOwnedNotes, lebo sa vytvori druhy
            for (int i = 0; i < jsonArray.size(); i++) {
                User.findByEmail(jsonArray.get(i).toString()).notOwnedNotes.add(note);
            }
        }

        if (type.equals("notebook")) {
            Notebook notebook = Notebook.findById(id);

            for (int i = 0; i < jsonArray.size(); i++) {
                notebook.contributors.add(User.findByEmail(jsonArray.get(i).toString()));
            }
        }
    }
    
}
