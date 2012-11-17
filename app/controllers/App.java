package controllers;

import com.google.gson.*;
import java.util.logging.Level;
import models.User;
import play.data.validation.*;
import play.data.validation.Check;
import play.mvc.*;
import play.mvc.Http.StatusCode;


public class App extends Controller{

    public static class PasswordCheck extends Check{
        @Override
        public boolean isSatisfied(Object user, Object password) {
            setMessage("Chybné meno alebo heslo");
            return Security.authenticate(((LoginCheck)user).email, (String)password);
        }
    }
    
    public static class PasswordCheckCheck extends Check {
        @Override
        public boolean isSatisfied(Object user, Object passwordcheck) {
            setMessage("Heslá sa nezhodujú");
            return (((User)user).password).equals((String)passwordcheck);
        }
    }
    
    public class LoginCheck {
        @Required (message = "Zadajte e-mail")
        @Email (message = "Zadajte platný email") 
        public String email;
        
        @Required (message = "Zadajte heslo")
        @CheckWith(PasswordCheck.class)
        public String password;
        
        public LoginCheck(String email, String password) {
            this.email = email;
            this.password = password;
        }
    }
    
    public static void authenticate(@Valid LoginCheck user) {
    	if(validation.hasErrors()) {
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
    	} 
        
        session.put("username",user.email);
        renderJSON("{\"next\":\"/manage\"}");
    }

    public static void register(@Valid User user) {
        if(validation.hasErrors()) {
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
        } 
        
        User newUser = new User(user.email, user.name, user.password);
        newUser.save();
        session.put("username",user.email);
        renderJSON("{\"next\":\"/manage\"}");

    }
    
    public static void logout() {
    	session.clear();
        try {
            Secure.login();
        } catch (Throwable ex) {
            java.util.logging.Logger.getLogger(App.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public static void index() {
        NoteManager.index();
    }
    
    public static void jsRoutes() {
        if(Security.isConnected()) {
            response.setContentTypeIfNotSet("text/javascript");
            render("jsRoutes");
        } else {
            error(StatusCode.FORBIDDEN, "Nie ste prihlásený");
        }
    }
    
}
