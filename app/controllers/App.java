package controllers;

import java.util.logging.Level;
import play.*;
import models.User;
import play.data.validation.*;
import play.mvc.*;
import play.mvc.Http.StatusCode;


public class App extends Controller{

	// Autentifikácia
    
    public class Login {
        @Required (message = "Zadajte e-mail")
        @Email(message = "Zadajte platný email")
    	public String email;

        @Required (message = "Zadajte heslo")
    	public String password;
    	
    }

    public class Registration {
        @Required (message = "E-mail je požadovaný")
        @Email(message = "Zadajte platný email")
        public String email;

        public String name;

        //@Length(value = 6, message = "Heslo je krátke, zadajte aspoň 6 znakov")
        @Required (message = "Zadajte svoje nové heslo")
        public String password;

        @Required (message = "Zopakujte svoje nové heslo")
        public String passwordcheck;

        public String validate() {
            if(!password.equals(passwordcheck)) {
                return "Zadané heslo sa nezhoduje s kontrolou hesla";
            } else if(User.findByEmail(email)!=null) {
                return "Zadaný e-mail je už zaregistrovaný. " +
                        "Skontrolujte e-mail. " +
                        "Ak ste sa už v noteMe registrovali, prihláste sa.";
            }
            return null;
        }
    }
    
    public static void authenticate(
            @Required
            @Email
            String email,
            @Required
            String password
            ) {
        Logger.info(email);
        Logger.info(password);
    	if(validation.hasErrors()) {
            response.status = StatusCode.BAD_REQUEST;
            renderJSON(validation.errorsMap());
    	} 
        if(Security.authenticate(email, password)) {
            session.put("user",email);
            renderJSON("{\"next\":\"/manage\"}");
    	}
    }

    public static void register() {
        /*Form<Registration> registerForm = form(Registration.class).bindFromRequest();
        if(registerForm.hasErrors()) {
            return badRequest(registerForm.errorsAsJson());
        } else {
            User newUser = new User(registerForm.get().email, registerForm.get().name, registerForm.get().password);
            newUser.save();
            session("user",registerForm.get().email);
            ObjectNode resp = Json.newObject();
            resp.put("next",routes.NoteManager.index().url());
            return ok(resp);
        }
*/
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

}
