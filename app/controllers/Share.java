/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import models.*;
import play.mvc.*;

@With(Secure.class)
public class Share extends Controller{
    
    /**
     * Dialogove okno zdielania poznamok
     */
    public static void shareNote(long id) {
        if(!Security.checkNoteOwnership(id)){
            forbidden();
        }
        renderArgs.put("note",Note.findById(id));
        render("dialogs/sharenote.html");
    }
    
    public static void sharePublic(long id) {
        if(!Security.checkNoteOwnership(id)){
            forbidden();
        }
        Note note = Note.findById(id);
        String uuid;
        if(note.publicID==null || note.publicID.isEmpty()){
            uuid = note.generatePublicId();
        } else {
            uuid = note.publicID;
        }
        note.isPulbic = true;
        note.save();
        Map<String,Object> arg = new HashMap<String,Object>();
        arg.put("uuid",uuid);
        renderText(Router.getFullUrl("PublicNote.index",arg).toString());
    }
    
    public static void unsharePublic(long id){
        if(!Security.checkNoteOwnership(id)){
            forbidden();
        }
        ((Note)Note.findById(id)).unsharePublicId();
    }
    
    
}
