/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import java.util.List;
import models.*;
import play.mvc.Controller;

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
    
}
