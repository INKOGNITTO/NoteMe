package controllers;

import models.User;
import play.mvc.*;

@With(Security.class)
public class Edit extends Controller {
	
	public static void index() {
	    renderTemplate("views/edit.html",new Object[3]);
	    
	}

}
