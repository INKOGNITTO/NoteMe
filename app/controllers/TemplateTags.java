/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import groovy.lang.Closure;
import java.io.PrintWriter;
import java.util.Map;
import play.templates.GroovyTemplate.ExecutableTemplate;
import play.templates.*;

public class TemplateTags extends FastTags{
    
    public static void _ifNoteOwner(Map<?, ?> args, Closure body, PrintWriter out, 
      ExecutableTemplate template, int fromLine) {
            if(Security.checkNoteOwnership((Long)args.get("noteId"))) {
                out.println(JavaExtensions.toString(body));
            }
    }
    
}
