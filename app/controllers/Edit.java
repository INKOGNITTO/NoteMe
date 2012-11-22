package controllers;

import models.User;
import play.mvc.*;

@With(Security.class)
public class Edit extends Controller {
	
	public static void index() {
            renderArgs.put("user", User.findByEmail(session.get("username")));
	    render("edit.html");
	    
	}
        
        public static void saveNote(long id, String content) {
            //TODO
        }

}
