package controllers;

import hash.Passwords;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import models.*;
import play.mvc.*;
import play.mvc.Http.*;

public class Security extends Secure.Security {
	
    public static boolean authenticate(String email, String password) {
        User user = User.findByEmail(email);
        return user != null && Passwords.matches(password, user.password);
    }
    
    static void onDisconnected() {
        App.index();
    }
    
    static void onAuthenticated() {
        try {
            Secure.login();
        } catch (Throwable ex) {
            ex.printStackTrace(System.err);
        }
    }
    
    public static boolean checkNoteAccessibility(long noteId) {
        User user = User.findByEmail(session.get("username"));
        return user.getAllNotes().contains((Note)Note.findById(noteId));
    }
    
    public static boolean checkNoteOwnership(long noteId){
        User user = User.findByEmail(session.get("username"));
        return user.getOwnedNotes().contains((Note)Note.findById(noteId));
    }
    
    public static boolean checkNotebookOwnership(long nbId) {
        User user = User.findByEmail(Security.connected());
        return ((Notebook) Notebook.findById(nbId)).owner.equals(user);
    }
    
    public static boolean check(String what) {
        User user = User.findByEmail(connected());
        if ("admin".equals(what)) {
            return user.isAdmin;
        }
        else {
            return false;
        }
    }
    
}
