package controllers;

import com.google.gson.*;
import hash.Passwords;
import java.util.logging.Level;
import models.NoteImage;
import models.User;
import play.Logger;
import play.data.validation.*;
import play.data.validation.Check;
import play.db.jpa.Blob;
import play.libs.Codec;
import play.mvc.*;
import play.mvc.Http.StatusCode;


public class App extends Controller{

    /**
     * pomocna trieda pre overenie udajov pri prihlasovani pouzivatela
     */
    public static class PasswordCheck extends Check{
        @Override
        public boolean isSatisfied(Object user, Object password) {
            setMessage("Chybné meno alebo heslo");
            return Security.authenticate(((LoginCheck)user).email, (String)password);
        }
    }
    
    /**
     * Pomocna metoda pre kontrolu zhody zadanych hesiel pri registracii pouzivatela
     */
    public static class PasswordCheckCheck extends Check {
        @Override
        public boolean isSatisfied(Object user, Object passwordcheck) {
            setMessage("Heslá sa nezhodujú");
            // tuto kontrolu vykonavaj iba ak je volana z tohoto controllera
            if(request.controller.contains(App.class.getSimpleName())){
                return (((User)user).password).equals((String)passwordcheck);
            } else {
                return true;
            }
        }
    }
    
    /**
     * Pomocna trieda pre kontrolu udajov pri prihlasovani pouzivatela 
     */
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
    
   /**
    * Prihlasovanie pouzivatela
    * @param user pouzivatel
    */
    public static void authenticate(@Valid LoginCheck user) {
    	if(validation.hasErrors()) {
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
    	} 
        
        session.put("username",user.email);
        //presmeruj na povodnu URL
        String url = flash.get("url");
        if(url == null) {
            url = Router.reverse("NoteManager.index").url; //default url
        }
        renderJSON("{\"next\":\""+url+"\"}");
    }

    /**
     * Resgitracia pouzivatela
     * @param user pouzivatel
     */
    public static void register(@Valid User user) {
        if(validation.hasErrors()) {
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
        } 
        
        User newUser = new User(user.email, user.name, user.password);
        if(User.findAll().isEmpty()){
            user.isAdmin = true;
        }
        newUser.save();
        newUser.setDefaults();
        session.put("username",user.email);
        renderJSON("{\"next\":\"/manage\"}");

    }
    
    public static void logout() {
    	session.clear();
        try {
            flash.put("logout", "logout");
            Secure.login();
        } catch (Throwable ex) {
            java.util.logging.Logger.getLogger(App.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
  
    public static void index() {
        NoteManager.index();
    }
    
    /**
     * Generovanie skriptu obsahujuceho reverzne cesty pre AJAX
     */
    public static void jsRoutes() {
        response.setContentTypeIfNotSet("text/javascript");
        render("jsRoutes");
    }
    
    /**
     * Obrazky v poznamkach
     * @param uuid identifikator obrazka
     */
    public static void getNoteImage(String uuid) {
        Blob image = NoteImage.fidByUuid(uuid).image;
        response.setContentTypeIfNotSet(image.type());
        renderBinary(image.get());
    }
    
    /**
     * test xml odpovede, sluzi ako webova sluzba
     * @param email email pouzivatela
     * @param password heslo, nutne ak pouzivatel nie je prihlaseny 
     */
    public static void userNotes(String email,String password){
        User user = User.findByEmail(email);
        if(user == null || (!Passwords.matches(password, user.password) && !Security.connected().equals(email))){
            forbidden();
        }
        renderArgs.put("user",user);
        render("notes.xml");
    }
    
    public static void resetPasswordDialog() {
        render("dialogs/resetPassword.html");
    }
    
    public static void resetPassword(String email){
        checkAuthenticity();
        User user = User.findByEmail(email);
        String newPass = Codec.UUID().substring(0,8);
        user.password = Passwords.hashPassword(newPass);
        user.save();
        Mails.resetPassword(user,newPass);
        
    }
    
}
