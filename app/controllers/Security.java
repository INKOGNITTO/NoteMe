package controllers;

import hash.Passwords;
import java.util.logging.Level;
import java.util.logging.Logger;
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
        try {
            Secure.login();
            //NoteManager.index();
        } catch (Throwable ex) {
            Logger.getLogger(Security.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
	

}
