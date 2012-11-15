package controllers;

import hash.Passwords;
import models.*;
import play.mvc.*;
import play.mvc.Http.*;

public class Security extends Secure.Security {
	
    static boolean authenticate(String email, String password) {
        User user = User.findByEmail(email);
        return user != null && Passwords.matches(password, user.password);
    }
    
    static void onDisconnected() {
        App.index();
    }
    
    static void onAuthenticated() {
        NoteManager.index();
    }
	

}
