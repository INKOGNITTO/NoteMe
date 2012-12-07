/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import groovy.lang.Closure;
import java.io.PrintWriter;
import java.util.Map;
import models.Note;
import play.db.jpa.GenericModel;
import play.templates.GroovyTemplate.ExecutableTemplate;
import play.templates.*;

public class TemplateTags extends FastTags{
    
    public static void _ifNoteOwner(Map<?, ?> args, Closure body, PrintWriter out, 
      ExecutableTemplate template, int fromLine) {
            if(args.get("noteId")==null || Security.checkNoteOwnership((Long)args.get("noteId"))) {
                out.println(JavaExtensions.toString(body));
            }
    }
    
    public static void _ifNotNoteOwner(Map<?, ?> args, Closure body, PrintWriter out, 
      ExecutableTemplate template, int fromLine) {
            if(args.get("noteId")!=null && !Security.checkNoteOwnership((Long)args.get("noteId"))) {
                out.println(JavaExtensions.toString(body));
            }
    }
    
    public static void _ifSharedNote(Map<?, ?> args, Closure body, PrintWriter out, 
      ExecutableTemplate template, int fromLine) {
            if(args.get("noteId")!=null &&
                    !((Note)Note.findById(args.get("noteId"))).sharedWith.isEmpty() &&
                    Security.checkNoteOwnership((Long)args.get("noteId"))) {
                out.println(JavaExtensions.toString(body));
            }
    }
    
    
    public static void _noteHasTags(Map<?, ?> args, Closure body, PrintWriter out, 
      ExecutableTemplate template, int fromLine) {
            if(args.get("noteId")!=null &&
                    !((Note)Note.findById(args.get("noteId"))).getOwnedTags().isEmpty()) {
                out.println(JavaExtensions.toString(body));
            }
    }
    
}
